import { Type as T } from '@fastify/type-provider-typebox';
import type { WebSocket } from '@fastify/websocket';
import type {
  FastifyReplyTypeBox,
  FastifyRequestTypeBox,
  FastifyTypeBox,
} from '@lib/util.js';
import type { FastifyBaseLogger, FastifySchema } from 'fastify';
import type { TierListStore } from '@lib/tierlist/tierListStore.js';
import { Channel } from '@lib/twitch/models.js';
import { requireAuth } from '@plugins/auth.js';
import type { TierListListener } from '@lib/tierlist/tierListListener.js';
import {
  FreshTierListSchema,
  tierListFromFreshTierList,
} from '@lib/tierlist/models.js';

export default function (fastify: FastifyTypeBox) {
  fastify.register(devRoutes);
  fastify.register(tierListRoutes, { prefix: '/tierlist' });
}

function tierListRoutes(fastify: FastifyTypeBox) {
  const ListenChannelSchema = {
    params: T.Object({
      name: T.String({ maxLength: 1 }),
    }),
  } satisfies FastifySchema;

  // Attaches the channel associated with name to req.custom.
  async function ListenChannelPreHandler(
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

  fastify.get(
    '/:name',
    {
      schema: ListenChannelSchema,
      preHandler: ListenChannelPreHandler,
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

  fastify.register(tierListAuthedRoutes);
}

function tierListAuthedRoutes(fastify: FastifyTypeBox) {
  fastify.addHook('onRequest', requireAuth);

  const OverwriteTierListBody = T.Object({
    tier_list: FreshTierListSchema,
  });
  fastify.put(
    '',
    {
      schema: {
        summary: 'Overwrite entire tier list',
        tags: ['Tier List'],
        body: OverwriteTierListBody,
        response: {
          204: T.Null({ description: 'Successfully overwrote tier list' }),
        },
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

  const FocusSchema = T.String({
    minLength: 1,
    description: 'Name of the item to focus',
  });

  const IsVotingSchema = T.Boolean({
    description: 'Determine whether votes should be parsed or ignored',
  });

  const UpdateTierListBody = T.Object({
    focus: T.Optional(FocusSchema),
    is_voting: T.Optional(IsVotingSchema),
  });
  fastify.patch(
    '',
    {
      schema: {
        summary: 'Update settings on the tier list',
        tags: ['Tier List'],
        body: UpdateTierListBody,
        response: {
          204: T.Null({
            description: 'Successfully updated settings on the tier list',
          }),
          404: T.Object(
            { message: T.String() },
            { description: 'Focus target does not exist' }
          ),
        },
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

  const TierNameSchema = T.String({
    minLength: 1,
    description: 'Name of the tier',
  });

  const TierColorSchema = T.String({
    minLength: 1,
    description: 'Background color of the tier',
  });

  const AddTierBody = T.Object({
    name: TierNameSchema,
    color: TierColorSchema,
  });
  fastify.post(
    '/tier',
    {
      schema: {
        summary: 'Add a new tier',
        tags: ['Tier List'],
        body: AddTierBody,
        response: {
          201: T.Null({ description: 'Successfully added tier' }),
          409: T.Object({ message: T.String() }, { description: 'Conflict' }),
        },
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

  const UpdateTierBody = T.Object({
    name: T.Optional(TierNameSchema),
    color: T.Optional(TierColorSchema),
  });
  fastify.patch(
    '/tier/:name',
    {
      schema: {
        summary: 'Update an existing tier',
        tags: ['Tier List'],
        body: UpdateTierBody,
        params: T.Object({ name: TierNameSchema }),
        response: {
          204: T.Null({ description: 'Successfully updated tier' }),
          409: T.Object({ message: T.String() }, { description: 'Conflict' }),
        },
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

  const ItemNameSchema = T.String({
    minLength: 1,
    description: 'Name of the item',
  });

  const ItemImageUrlSchema = T.String({
    minLength: 1,
    description: 'Image url of the item',
  });

  const AddItemBody = T.Object({
    name: ItemNameSchema,
    image_url: T.Optional(ItemImageUrlSchema),
  });
  fastify.post(
    '/item',
    {
      schema: {
        summary: 'Adds a new item',
        tags: ['Tier List'],
        body: AddItemBody,
        response: {
          201: T.Null({ description: 'Successfully added item' }),
          409: T.Object({ message: T.String() }, { description: 'Conflict' }),
        },
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

  const UpdateItemBody = T.Object({
    name: T.Optional(ItemNameSchema),
    image_url: T.Optional(ItemImageUrlSchema),
  });
  fastify.patch(
    '/item/:name',
    {
      schema: {
        summary: 'Updates an item',
        tags: ['Tier List'],
        params: T.Object({ name: ItemNameSchema }),
        body: UpdateItemBody,
        response: {
          204: T.Null({ description: 'Successfully updated item' }),
          409: T.Object({ message: T.String() }, { description: 'Conflict' }),
        },
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
          204: T.Null({ description: 'Successfully deleted item' }),
        },
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

function devRoutes(fastify: FastifyTypeBox) {
  fastify.get('/', { onRequest: requireAuth }, async (req) => {
    return `Hello World ${JSON.stringify(req.user)}`;
  });

  fastify.get(
    '/subscribe',
    {
      schema: {
        querystring: T.Object({
          name: T.String({ minLength: 1 }),
        }),
      },
    },
    async (req) => {
      const { name } = req.query;

      const ch = await fastify.twitch.client.searchChannel(name);
      if (!ch) return 'unknown channel';
      const channel = new Channel(ch);

      return fastify.tierlist.listener.listen(channel);
    }
  );

  fastify.get('/subscriptions', async () => {
    return await fastify.twitch.client.subscriptions();
  });

  fastify.get('/revoke', async () => {
    const res = await fastify.twitch.client.revoke();
    fastify.log.info({ res });
    return 'ok';
  });
}
