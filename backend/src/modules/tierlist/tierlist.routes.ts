import type { WebSocket } from '@fastify/websocket';
import type { FastifyBaseLogger } from 'fastify';
import T from 'typebox';

import type { TierListListener } from '@/modules/tierlist/shared/tierListListener';
import type { TierListStore } from '@/modules/tierlist/shared/tierListStore';
import {
  AddItemRequest,
  AddTierRequest,
  ItemNameSchema,
  ListenChannelParamsSchema,
  OverwriteTierListRequest,
  tierListFromFreshTierList,
  TierNameSchema,
  UpdateItemRequest,
  UpdateTierListRequest,
  UpdateTierRequest,
} from '@/modules/tierlist/tierlist.schemas';
import { requireAuth } from '@/server/plugins/auth';
import { nullSchema } from '@/shared/api/null.response';
import { Channel } from '@/shared/twitch/models';

export default function (fastify: FastifyTypeBox) {
  fastify.get(
    '/:name',
    {
      schema: {
        params: ListenChannelParamsSchema,
      },
      preHandler: [ListenChannelPreHandler],
      websocket: true,
    },
    (socket, req) => {
      // Attached by prehandler
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
  async function ListenChannelPreHandler(
    req: FastifyRequestTypeBox<{ params: typeof ListenChannelParamsSchema }>,
    res: FastifyReplyTypeBox<{ params: typeof ListenChannelParamsSchema }>
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
      await store
        .getEditor(channel.id())
        .then((editor) => {
          const tierList = editor?.getTierList();
          socket.send(
            JSON.stringify({
              type: 'tierlist',
              success: tierList !== undefined,
              tier_list: tierList,
            })
          );
        })
        .catch((err: unknown) => {
          fastify.log.error({ err }, 'Failed to send tier list');
        });
    };
    void sendTierList();

    const SEND_INTERVAL = 3 * 1000; // 3 secs
    const intervalId = setInterval(() => void sendTierList(), SEND_INTERVAL);

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
        .catch((err: unknown) => {
          logger.error({ err }, 'Failed to listen to channel');
          socket.send(JSON.stringify({ type: 'listen', status: 'error' }));
        });
    };
    void reportKeepAlive();

    const ALIVE_INTERVAL = 10 * 1000; // 10 secs
    const intervalId = setInterval(() => void reportKeepAlive, ALIVE_INTERVAL);

    socket.on('close', () => clearInterval(intervalId));
  }

  registerAuthRoutes(fastify);
}

function registerAuthRoutes(fastify: FastifyTypeBox) {
  fastify.addHook('onRequest', requireAuth);

  fastify.put(
    '',
    {
      schema: {
        summary: 'Overwrite entire tier list',
        tags: ['Tier List'],
        body: OverwriteTierListRequest,
        response: {
          204: nullSchema('Successfully overwrote tier list'),
        },
        security: [{ cookieAuth: [] }],
      },
    },
    async (req, res) => {
      const editor = await fastify.tierlist.store.getEditor(req.user.twitch_id);
      if (!editor) {
        return res.internalServerError();
      }

      const tierList = tierListFromFreshTierList(req.body.tier_list);
      editor.setTierList(tierList);

      return res.code(204).send(null);
    }
  );

  fastify.patch(
    '',
    {
      schema: {
        summary: 'Update settings on the tier list',
        tags: ['Tier List'],
        body: UpdateTierListRequest,
        response: {
          204: nullSchema('Successfully updated settings on the tier list'),
          404: T.Object(
            { message: T.String() },
            { description: 'Focus target does not exist' }
          ),
        },
        security: [{ cookieAuth: [] }],
      },
    },
    async (req, res) => {
      const editor = await fastify.tierlist.store.getEditor(req.user.twitch_id);
      if (!editor) {
        return res.internalServerError();
      }

      const { focus, is_voting } = req.body;
      if (focus) {
        const success = editor.setFocus(focus);
        if (!success) {
          return res.code(404).send({ message: 'Focus target does not exist' });
        }
      }
      if (is_voting !== undefined) {
        editor.setVoting(is_voting);
      }

      return res.code(204).send(null);
    }
  );

  fastify.post(
    '/tier',
    {
      schema: {
        summary: 'Add a new tier',
        tags: ['Tier List'],
        body: AddTierRequest,
        response: {
          201: nullSchema('Successfully added tier'),
          409: T.Object({ message: T.String() }, { description: 'Conflict' }),
        },
        security: [{ cookieAuth: [] }],
      },
    },
    async (req, res) => {
      const editor = await fastify.tierlist.store.getEditor(req.user.twitch_id);
      if (!editor) {
        return res.internalServerError();
      }

      const { name, color } = req.body;
      const success = editor.addTier(name, color);
      if (!success) {
        return res
          .code(409)
          .send({ message: 'A tier exists with the same name' });
      }

      return res.code(201).send(null);
    }
  );

  fastify.patch(
    '/tier/:name',
    {
      schema: {
        summary: 'Update an existing tier',
        tags: ['Tier List'],
        body: UpdateTierRequest,
        params: T.Object({ name: TierNameSchema }),
        response: {
          204: nullSchema('Successfully updated tier'),
          409: T.Object({ message: T.String() }, { description: 'Conflict' }),
        },
        security: [{ cookieAuth: [] }],
      },
    },
    async (req, res) => {
      const editor = await fastify.tierlist.store.getEditor(req.user.twitch_id);
      if (!editor) {
        return res.internalServerError();
      }

      const oldName = req.params.name;
      const newName = 'name' in req.body ? req.body.name : undefined;
      const color = 'color' in req.body ? req.body.color : undefined;

      const success = editor.updateTier(oldName, {
        ...(newName !== undefined && { newName }),
        ...(color !== undefined && { color }),
      });
      if (!success) {
        return res
          .code(409)
          .send({ message: 'A tier exists with the same new name' });
      }

      return res.code(204).send(null);
    }
  );

  fastify.post(
    '/item',
    {
      schema: {
        summary: 'Adds a new item',
        tags: ['Tier List'],
        body: AddItemRequest,
        response: {
          201: nullSchema('Successfully added item'),
          409: T.Object({ message: T.String() }, { description: 'Conflict' }),
        },
        security: [{ cookieAuth: [] }],
      },
    },
    async (req, res) => {
      const editor = await fastify.tierlist.store.getEditor(req.user.twitch_id);
      if (!editor) {
        return res.internalServerError();
      }

      const { name, image_url } = req.body;
      const success = editor.addItem(name, image_url);
      if (!success) {
        return res
          .code(409)
          .send({ message: 'An item exists with the same name' });
      }

      return res.code(201).send(null);
    }
  );

  fastify.patch(
    '/item/:name',
    {
      schema: {
        summary: 'Updates an item',
        tags: ['Tier List'],
        params: T.Object({ name: ItemNameSchema }),
        body: UpdateItemRequest,
        response: {
          204: nullSchema('Successfully updated item'),
          409: T.Object({ message: T.String() }, { description: 'Conflict' }),
        },
        security: [{ cookieAuth: [] }],
      },
    },
    async (req, res) => {
      const editor = await fastify.tierlist.store.getEditor(req.user.twitch_id);
      if (!editor) {
        return res.internalServerError();
      }

      const oldName = req.params.name;
      const newName = 'name' in req.body ? req.body.name : undefined;
      const imageUrl = 'image_url' in req.body ? req.body.image_url : undefined;

      const success = editor.updateItem(oldName, {
        ...(newName !== undefined && { newName }),
        ...(imageUrl !== undefined && { imageUrl }),
      });
      if (!success) {
        return res
          .code(409)
          .send({ message: 'An item exists with the same new name' });
      }

      return res.code(204).send(null);
    }
  );

  fastify.delete(
    '/item/:name',
    {
      schema: {
        summary: 'Deletes an item',
        tags: ['Tier List'],
        params: T.Object({ name: ItemNameSchema }),
        response: {
          204: nullSchema('Successfully deleted item'),
        },
        security: [{ cookieAuth: [] }],
      },
    },
    async (req, res) => {
      const editor = await fastify.tierlist.store.getEditor(req.user.twitch_id);
      if (!editor) {
        return res.internalServerError();
      }

      const name = req.params.name;
      editor.removeItem(name);

      return res.code(204).send(null);
    }
  );
}
