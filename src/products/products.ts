import fs, { writeFile } from 'fs/promises';
import axios from "axios";
import Product from '../interfaces/products';
import { pipeline } from 'stream';
import { AddressInfo } from 'net';

class ProductProcessor {
  
  async readFile() {
    const data = await fs.readFile('./base/products.json', 'utf8');
    const products = JSON.parse(data);
    return products;
  }

  async checkCategory(category: string): Promise<boolean> {
    try {
      const response = await axios.get(`https://posdesweb.igormaldonado.com.br/api/allowedCategory?category=${category}`);
      const isAllowed = response.data.allowed;
      return isAllowed;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async getProducts(): Promise<Product[]> {
    let allowedProducts: Array<Product> = [];

    try {
      const products = await this.readFile();

      for (const product of products) {
        const category = product.category;
        const categoryIsAllowed = await this.checkCategory(category);

        if (categoryIsAllowed) {
          const permissibleProduct: Product = {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            pictureUrl: product.pictureUrl
          }
          
          allowedProducts.push(permissibleProduct);
        } else {
          console.warn(`Categoria ${product.category} não é permitida - produto ignorado`);
        }
      }
      return allowedProducts;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async getProductById(id: number): Promise<Product> {
    const products = await this.readFile();
    const productFound = findProductIndex(products, id);
    return productFound;
  }

  async createProduct(product: Product): Promise<Product> {
    const products = await this.readFile();
    products.push(product);
    await fs.writeFile('./base/products.json', JSON.stringify(products, null, 2));
    return product;
  }

  async updateProduct(id: number, product: Product): Promise<Product> {
    const products = await this.readFile();

    const productFound = findProductIndex(products, id);

    if (productFound) {
      productFound.name = product.name;
      productFound.description = product.description;
      productFound.price = product.price;
      productFound.category = product.category;
      await fs.writeFile('./base/products.json', JSON.stringify(products, null, 2));
      return productFound;
    } else {
      throw new Error('Product not found');
    }
  }

  async deleteProduct(id: number): Promise<void> {
    try {
      let products = await this.readFile();


      const index = products.findIndex((product: Product) => product.id === id) || null;
    
      if (index !== -1) {
        products.splice(index, 1);
        await fs.writeFile('./base/products.json', JSON.stringify(products, null, 2));
      } else {
        throw new Error('Product not found');
      }

    } catch (error) {
      console.error(error);
      throw new Error('Product not found');
    }
  }

  async setImage(id: number, image: string): Promise<Boolean> {
    const products = await this.readFile();
    const productFound = findProductIndex(products, id);
    productFound.pictureUrl = image;
    await fs.writeFile('./base/products.json', JSON.stringify(products, null, 2));
    return true;
  }
}

 function findProductIndex(products: Product[], id: number) {
   const productFound = products.find((product: Product) => product.id === id) || null;
   if (!productFound) {
    throw new Error('Product not found');
   }
   return productFound;
 }

export default ProductProcessor;