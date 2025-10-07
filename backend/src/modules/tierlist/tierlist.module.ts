import routes from '@/modules/tierlist/tierlist.routes';

export default function (fastify: FastifyTypeBox) {
  fastify.register(routes, { prefix: '/tierlist' });
}
