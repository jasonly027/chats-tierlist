import type { TierListListener } from '@lib/tierlist/tierListListener.js';
import type { TierListStore } from '@lib/tierlist/tierListStore.js';
import { Channel } from '@lib/twitch/models.js';
import type {
  FastifyReplyTypeBox,
  FastifyRequestTypeBox,
  FastifyTypeBox,
} from '@lib/util.js';
import type { FastifyBaseLogger, FastifySchema } from 'fastify';
import { WebSocket } from 'ws';
import { Type as T } from '@fastify/type-provider-typebox';

export default function (fastify: FastifyTypeBox) {
  const ListenChannelSchema = {
    params: T.Object({
      name: T.String(),
    }),
  } satisfies FastifySchema;

  fastify.get(
    '/:name',
    {
      schema: ListenChannelSchema,
      preHandler: rootPreHandler,
      websocket: true,
    },
    async (socket, req) => {
      // Attached by listenPreHandler
      const channel = (req as typeof req & { custom: Channel }).custom;

      socket.once('pong', () => {
        startSendingTierList(fastify.tierlist.store, socket, channel);
        startListenKeepAlive(
          fastify.tierlist.listener,
          socket,
          channel,
          req.log
        );
      });
    }
  );

  // Attaches the channel associated with name to req.custom.
  async function rootPreHandler(
    req: FastifyRequestTypeBox<typeof ListenChannelSchema>,
    res: FastifyReplyTypeBox<typeof ListenChannelSchema>
  ): Promise<void> {
    const { name } = req.params;

    const ch = await fastify.twitch.client.searchChannel(name);
    if (!ch) {
      return res.notFound();
    }

    (req as typeof req & { custom: Channel }).custom = new Channel(ch);
  }

  // Starts periodically sending the tier list to the client.
  // Channel info is sent once as the first message.
  function startSendingTierList(
    store: TierListStore,
    socket: WebSocket,
    channel: Channel
  ): void {
    socket.send(JSON.stringify(channel.channel));

    const sendTierList = async () => {
      await store.getEditor(channel.id()).then((editor) => {
        const tierList = editor?.getTierList();
        socket.send(
          JSON.stringify({
            type: 'tierlist',
            success: tierList !== undefined,
            tier_list: tierList,
          })
        );
      });
    };
    sendTierList();

    const SEND_INTERVAL = 3 * 1000; // 3 secs
    const intervalId = setInterval(sendTierList, SEND_INTERVAL);

    socket.on('close', () => clearInterval(intervalId));
  }

  // Periodically notifies the tier list listener that there is a listener.
  // Stops notifying when the websocket is closed. A status message is sent
  // to the websocket client about the listen state.
  function startListenKeepAlive(
    listener: TierListListener,
    socket: WebSocket,
    channel: Channel,
    logger: FastifyBaseLogger
  ): void {
    const reportKeepAlive = async () => {
      await listener
        .listen(channel)
        .then((success) => {
          const status = success ? 'ok' : 'full';
          socket.send(JSON.stringify({ type: 'listen', status }));
        })
        .catch((err) => {
          logger.error({ err }, 'Failed to listen to channel');
          socket.send(JSON.stringify({ type: 'listen', status: 'error' }));
        });
    };
    reportKeepAlive();

    const ALIVE_INTERVAL = 10 * 1000; // 10 secs
    const intervalId = setInterval(reportKeepAlive, ALIVE_INTERVAL);

    socket.on('close', () => clearInterval(intervalId));
  }

  fastify.put(
    '',
    {
      schema: {
        tags: ['Tier List'],
        body: T.Object({
          tier_list: T.Object({
            tiers: T.Array(
              T.Object({
                name: T.String({ minLength: 1 }),
                color: T.String(),
              }),
              {
                maxItems: 50,
              }
            ),
            items: T.Array(
              T.Object({
                name: T.String({ minLength: 1 }),
                image_url: T.Union([T.String(), T.Null()]),
              }),
              {
                maxItems: 500,
              }
            ),
          }),
        }),
        response: {
          200: T.Literal('OK'),
        },
      },
    },
    async (_req, res) => {
      return res.send('OK');
    }
  );
}
