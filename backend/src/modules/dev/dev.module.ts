import { env } from '@/config';
import routes from '@/modules/dev/dev.routes';

export default function (fastify: FastifyTypeBox) {
  if (env.NODE_ENV !== 'development') return;

  fastify.register(routes, { prefix: '/dev' });
}
