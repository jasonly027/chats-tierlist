import routes from '@/modules/user/user.routes';

export default function (fastify: FastifyTypeBox) {
  fastify.register(routes);
}
