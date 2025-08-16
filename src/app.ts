import fastify, { FastifyInstance } from 'fastify';
import { routes } from './index';

export async function build(): Promise<FastifyInstance> {
  const app = fastify({
    logger: {
      level: 'debug',
    }
  });

  // Registra as rotas
  await app.register(routes);

  return app;
} 