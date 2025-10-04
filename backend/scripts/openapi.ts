import fs from 'fs';

import fastifySwagger from '@fastify/swagger';
import type { FastifyPluginCallback } from 'fastify';
import Fastify from 'fastify';
import fastifyPlugin from 'fastify-plugin';

import serverPlugin from '../src/server.ts';

const swagger: FastifyPluginCallback = (fastify) => {
  fastify.register(fastifySwagger, {
    openapi: {
      openapi: '3.1.1',
      info: {
        title: "Chat's TierList",
        version: '0.1.0',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'sessionId',
          },
        },
      },
    },
  });
};
const swaggerPlugin = fastifyPlugin(swagger, { name: 'swagger' });

const fastify = Fastify();
await fastify.register(swaggerPlugin);
await fastify.register(serverPlugin);
await fastify.ready();

fs.writeFileSync('docs/openapi.yaml', fastify.swagger({ yaml: true }) + '\n');
console.log(
  'Spec written to docs/openapi.yaml.\nView docs with `npm run docs`.'
);
process.exit(0);
