import { FastifyInstance } from 'fastify';
import passport from '@fastify/passport';
const fastifyPassport = passport.default;

export default async function (fastify: FastifyInstance) {
  fastify.get(
    '/auth/callback',
    {
      preValidation: fastifyPassport.authenticate('twitch', {
        successRedirect: '/',
      }),
    },
    () => {}
  );

  fastify.get('/login', fastifyPassport.authenticate('twitch'));

  fastify.get('/logout', async (req, res) => {
    req.logOut();
    res.send({ success: true });
  });
}
