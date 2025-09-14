import type { FastifyPluginCallback } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

import repo from '@plugins/repo.js';
import twitch from '@plugins/twitch.js';
import auth from '@plugins/auth.js';
import fastifySensible from '@fastify/sensible';
import chatSubscriber from './chatSubscriber.ts';

const plugins: FastifyPluginCallback = (fastify) => {
  fastify.register(fastifySensible);
  fastify.register(repo);
  fastify.register(twitch);
  fastify.register(chatSubscriber);
  fastify.register(auth);
};

export default fastifyPlugin(plugins);
