import { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import * as util from '../util.js';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';

const SESSION_TTL = 5 * 24 * 60 * 60; // 5 days

const auth: FastifyPluginAsync = async (fastify) => {
  fastify.register(fastifyCookie);

  fastify.register(fastifySession, {
    secret: util.envVar('SESSION_SECRET'),
    cookie: {
      maxAge: SESSION_TTL,
      secure: process.env['NODE_ENV'] === 'production',
    },
  });
};

export default fastifyPlugin(auth);
