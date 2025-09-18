import type { FastifyPluginCallback } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

import repo from './repo.js';
import twitch from './twitch.js';
import auth from './auth.js';
import fastifySensible from '@fastify/sensible';
import tierlist from './tierlist.ts';

const plugins: FastifyPluginCallback = (fastify) => {
  fastify.register(fastifySensible);
  fastify.register(repo);
  fastify.register(twitch);
  fastify.register(tierlist);
  fastify.register(auth);
};

export default fastifyPlugin(plugins);
