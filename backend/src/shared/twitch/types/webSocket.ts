import z from 'zod';

const baseMessageMetadata = {
  message_id: z.string(),
  message_timestamp: z.iso.datetime(),
};

// https://dev.twitch.tv/docs/eventsub/websocket-reference#welcome-message
export const WelcomeMessageSchema = z.object({
  metadata: z.object({
    ...baseMessageMetadata,
    message_type: z.literal('session_welcome'),
  }),
  payload: z.object({
    session: z.object({
      id: z.string(),
      status: z.literal('connected'),
      keepalive_timeout_seconds: z.int(),
      reconnect_url: z.null(),
      connected_at: z.iso.datetime(),
    }),
  }),
});
export type WelcomeMessage = z.infer<typeof WelcomeMessageSchema>;

// https://dev.twitch.tv/docs/eventsub/websocket-reference#keepalive-message
export const KeepAliveMessageSchema = z.object({
  metadata: z.object({
    ...baseMessageMetadata,
    message_type: z.literal('session_keepalive'),
  }),
  payload: z.object(),
});
export type KeepAliveMessage = z.infer<typeof KeepAliveMessageSchema>;

// https://dev.twitch.tv/docs/eventsub/websocket-reference#notification-message
export const NotificationMessageSchema = z.object({
  metadata: z.object({
    ...baseMessageMetadata,
    message_type: z.literal('notification'),
    subscription_type: z.string(),
    subscription_version: z.string(),
  }),
  payload: z.object({
    subscription: z.object({
      id: z.string(),
      status: z.literal('enabled'),
      type: z.string(),
      version: z.string(),
      cost: z.int(),
      condition: z.unknown(),
      transport: z.object({
        method: z.literal('websocket'),
        session_id: z.string(),
      }),
      created_at: z.iso.datetime(),
    }),
    event: z.unknown(),
  }),
});
export type NotifcationMessage = z.infer<typeof NotificationMessageSchema>;

// https://dev.twitch.tv/docs/eventsub/websocket-reference#reconnect-message
export const ReconnectMessageSchema = z.object({
  metadata: z.object({
    ...baseMessageMetadata,
    message_type: z.literal('session_reconnect'),
  }),
  payload: z.object({
    session: z.object({
      id: z.string(),
      status: z.literal('reconnecting'),
      keepalive_timeout_seconds: z.null(),
      reconnect_url: z.url(),
      connected_at: z.iso.datetime(),
    }),
  }),
});
export type ReconnectMessage = z.infer<typeof ReconnectMessageSchema>;

// https://dev.twitch.tv/docs/eventsub/websocket-reference#revocation-message
export const RevocationMessageSchema = z.object({
  metadata: z.object({
    ...baseMessageMetadata,
    message_type: z.literal('revocation'),
    subscription_type: z.string(),
    subscription_version: z.string(),
  }),
  payload: z.object({
    subscription: z.object({
      id: z.string(),
      status: z.union([
        z.literal('authorization_revoked'),
        z.literal('user_removed'),
        z.literal('version_removed'),
      ]),
      type: z.string(),
      version: z.string(),
      cost: z.int(),
      condition: z.unknown(),
      transport: z.object({
        method: z.literal('websocket'),
        session_id: z.string(),
      }),
      created_at: z.iso.datetime(),
    }),
    event: z.unknown(),
  }),
});
export type RevocationMessage = z.infer<typeof RevocationMessageSchema>;

// https://dev.twitch.tv/docs/eventsub/eventsub-reference/#channel-chat-message-event
export const ChatMessageEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_name: z.string(),
  broadcaster_user_login: z.string(),
  chatter_user_id: z.string(),
  chatter_user_name: z.string(),
  chatter_user_login: z.string(),
  message_id: z.string(),
  message: z.object({
    text: z.string(),
  }),
  message_type: z.string(),
});
export type ChatMessageEvent = z.infer<typeof ChatMessageEventSchema>;
