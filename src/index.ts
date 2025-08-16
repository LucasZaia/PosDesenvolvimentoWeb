import { json } from 'stream/consumers';
import fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import Product from './interfaces/products';
import multipart, { MultipartFile } from '@fastify/multipart';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import fastifyStatic from '@fastify/static';
import { AddressInfo } from 'net';
import productsRepository from './repository/products';
import UserRepository from './repository/user';
import Authentication from './auth/authentication';

// Declare os tipos dos decorators
declare module 'fastify' {
  interface FastifyInstance {
    authMiddleware: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (allowedRoles: string | string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<FastifyRequest | void>;
  }
}

const server: FastifyInstance = fastify({
  logger: {
    level: 'debug',
  }
});

server.register(multipart, {
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
});

server.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'tmp/images'),
  prefix: '/products/image',
  decorateReply: false
});

server.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
  server.log.debug({method: request.method, url: request.url}, 'Request received');
});

server.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
  server.log.info({params: request.params, query: request.query}, 'Request received');
});

server.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
  server.log.info({
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    time: reply.elapsedTime + 'ms',
  },
  'Response sent'
);
});

server.addHook('onError', async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
  server.log.error({
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    error: error.message,
  }, 'Error');
});


export async function routes(fastify: FastifyInstance, options: any) {

  fastify.decorate('authMiddleware', 
    async (request: FastifyRequest, reply: FastifyReply) => {
      const token = request.headers.authorization;

      if (!token) {
        return reply.status(401).send({ message: 'Token not found' });
      }

      try {
        const decoded = Authentication.verifyToken(token);
        (request as any).user = decoded;
      } catch (err) {
        return reply.status(401).send({ message: (err as Error).message });
      }
    }
  );

  fastify.decorate('requireRole', (allowedRoles: string | string[]) => {
    const allowedRolesList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    return async (request: FastifyRequest, reply: FastifyReply) => {
      const userRoles = (request as any).user?.roles || (request as any).user?.role || [];
      const roles = Array.isArray(userRoles) ? userRoles : [userRoles];

      const ok = roles.some(role => allowedRolesList.includes(role));

      if (!ok) {
        return reply.status(403).send({ message: 'insufficient permissions' });
      }

      return request;
    }
  });

  fastify.get('/products', { 
    preHandler: [fastify.authMiddleware, fastify.requireRole('admin')]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const products = await productsRepository.findAll();

      reply.status(200).send({
        success: true,
        message: 'Products fetched successfully',
        data: products
      });
    } catch (error) {
      reply.status(400).send({
        success: false,
        data: null,
        message: 'Error fetching products'
      });
    }
  });

  fastify.get('/products/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    
    const { id } = request.params as { id: number };

    try {
      const product = await productsRepository.findById(id);
      reply.status(200).send({
        success: true,
        message: 'Product fetched successfully',
        data: product 
      });
    } catch (error) {
      reply.status(400).send({
        success: false,
        data: null,
        message: 'Error fetching product'
      });
    }
  });

  fastify.post('/products/create', async (request: FastifyRequest, reply: FastifyReply) => { 
    
    const product = request.body as Product;
    try {
      const newProduct = await productsRepository.create(product);
      reply.status(201).send({
        success: true,
        message: 'Product created successfully',
        data: newProduct
      });
    } catch (error) {
      reply.status(400).send({
        success: false,
        data: null,
        message: 'Error creating product'
      });
    }
  });

  fastify.put('/products/update/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    
    const { id } = request.params as { id: number };
    const product = request.body as Product;
    try {
      const updatedProduct = await productsRepository.update(id, product);
      reply.status(200).send({
        success: true,
        message: 'Product updated successfully',  
        data: updatedProduct
      });
    } catch (error) {

      reply.status(400).send({
        success: false,
        data: null,
        message: 'Error updating product'
      });
    }
  });

  fastify.delete('/products/delete/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: number };
    try {
      await productsRepository.delete(id);
      reply.status(200).send({
        success: true,
        message: 'Product deleted successfully' 
      });
    } catch (error) {
      reply.status(400).send({
        success: false,
        data: null,
        message: 'Error deleting product' 
      });
    }
  });

  fastify.put('/products/upload_image/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: number };
    const data = await request.file() as MultipartFile;

    try {

      if (!data.mimetype.startsWith('image/')) {
        reply.status(400).send({
          success: false,
          message: 'Only image files are allowed',
          data: null
        });
        return;
      }

      data.fieldname = id.toString() + '.' + data.mimetype.split('/')[1];
      const destination = path.join(__dirname, '..', 'tmp/images');
      const save_path = path.join(destination, data.fieldname);

      await fs.promises.mkdir(destination, { recursive: true }); 

      await pipeline(data.file, fs.createWriteStream(save_path));

      const server_address = server.server.address() as AddressInfo;

      const image_url = "http://" + server_address.address + ':' + server_address.port + '/products/image/' + data.fieldname;

      await productsRepository.update(id, { pictureUrl: image_url } as Product);

      reply.status(200).send({
        success: true,  
        message: 'Image uploaded successfully',
        data: save_path
      });
    } catch (error) {
      reply.status(400).send({
        success: false,
        data: null,
        message: 'Error uploading image'
      });
      }
    });

  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = request.body as { email: string, password: string };
    try {
      const user = await UserRepository.findByEmailAndPassword(email, password);
      const tokens = new Authentication(user).mountToken();
      reply.status(200).send({
        success: true,
        data: tokens,
        message: 'Login successful'
      });
    } catch (error) {
      reply.status(400).send({
        success: false,
        data: null,
        message: error
      });
    }
  })
}




//   fastify.get('/products/:id', async (request: FastifyRequest, reply: FastifyReply) => {
//     const { id } = request.params as { id: number };
//     const product = await processor.getProductById(id);
//     try {

//       reply.status(200).send({
//         success: true,
//         message: 'Product fetched successfully',
//         data: product
//       });
      
//     } catch (error) {
//       reply.status(400).send({
//         success: false,
//         data: product,
//         message: 'Error fetching product'
//       });
//     }
//   });

//   fastify.post('/products/create', { schema: createProductSchema }	, async (request: FastifyRequest, reply: FastifyReply) => {
    
//     try {
//       const product = await processor.createProduct(request.body as Product);
//       return {message: 'Product created successfully', data: product, success: true}
//     } catch (error) {
//       return {message: 'Error creating product', success: false}
//     }
//   });

//   fastify.put('/products/update/:id', async (request: FastifyRequest, reply: FastifyReply) => {
//     const { id } = request.params as { id: number };
//     const product = await processor.updateProduct(id, request.body as Product);

//     try {
//       reply.status(200).send({
//         success: true,
//         message: 'Product updated successfully',
//         data: product
//       });
//     } catch (error) {
//       reply.status(400).send({
//         success: false,
//         data: null,
//         message: 'Error updating product'
//       });
//     }
//   });

//   fastify.delete('/products/delete/:id', async (request: FastifyRequest, reply: FastifyReply) => {
//     const { id } = request.params as { id: number };
//     const product = await processor.deleteProduct(id);

//     console.log(id);
//     try {
//       reply.status(200).send({
//         success: true,
//         message: 'Product deleted successfully',
//         data: product
//       });
//     } catch (error) {
//       reply.status(400).send({
//         success: false,
//         data: product,
//         message: 'Error deleting product'
//       });
//     }
//   });

//   fastify.put('/products/upload_image/:id', async (request: FastifyRequest, reply: FastifyReply) => {
//     const { id } = request.params as { id: number };
//     const data = await request.file() as MultipartFile;

//     if (!data.mimetype.startsWith('image/')) {
//       reply.status(400).send({
//         success: false,
//         message: 'Only image files are allowed',
//         data: null
//       });
//       return;
//     }

//     data.fieldname = id.toString() + '.' + data.mimetype.split('/')[1];
//     const destination = path.join(__dirname, '..', 'tmp/images');
//     const save_path = path.join(destination, data.fieldname);

//     await fs.promises.mkdir(destination, { recursive: true }); 

//     await pipeline(data.file, fs.createWriteStream(save_path));

//     const server_address = server.server.address() as AddressInfo;

//     const image_url = "http://" + server_address.address + ':' + server_address.port + '/products/image/' + data.fieldname;

//     await processor.setImage(id, image_url);

//     reply.status(200).send({
//       success: true,
//       message: 'Image uploaded successfully',
//       data: save_path
//     });
//   });

const start = async () => {
  try {
    await server.listen({ port: 8081 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

server.register(routes);

start();
// const processor = new ProductProcessor();
// processor.main();

