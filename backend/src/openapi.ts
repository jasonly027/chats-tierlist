import fastifySwagger from '@fastify/swagger';
import type { FastifyPluginCallback } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import serverPlugin from './server.ts';
import Fastify from 'fastify';
import fs from 'fs';

const swagger: FastifyPluginCallback = (fastify) => {
  fastify.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.4',
      info: {
        title: 'Title',
        description: 'Description',
        version: '0.1.0',
      },
    },
  });
};
const swaggerPlugin = fastifyPlugin(swagger, { name: 'swagger' });

const fastify = Fastify();
await fastify.register(swaggerPlugin);
await fastify.register(serverPlugin);
await fastify.ready();

await fs.writeFileSync('openapi.yaml', fastify.swagger({ yaml: true }) + '\n');
process.exit(0);

