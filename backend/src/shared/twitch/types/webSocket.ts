import T, { Static } from 'typebox';
import { Compile } from 'typebox/compile';

const baseMessageMetadata = {
  message_id: T.String(),
  message_timestamp: T.String({ format: 'date-time' }),
};

// https://dev.twitch.tv/docs/eventsub/websocket-reference#welcome-message
export const WelcomeMessageSchema = T.Object({
  metadata: T.Object({
    ...baseMessageMetadata,
    message_type: T.Literal('session_welcome'),
  }),
  payload: T.Object({
    session: T.Object({
      id: T.String(),
      status: T.Literal('connected'),
      keepalive_timeout_seconds: T.Number(),
      reconnect_url: T.Null(),
      connected_at: T.String({ format: 'date-time' }),
    }),
  }),
});
export type WelcomeMessage = Static<typeof WelcomeMessageSchema>;

// https://dev.twitch.tv/docs/eventsub/websocket-reference#keepalive-message
export const KeepAliveMessageSchema = T.Object({
  metadata: T.Object({
    ...baseMessageMetadata,
    message_type: T.Literal('session_keepalive'),
  }),
  payload: T.Unknown(),
});
export type KeepAliveMessage = Static<typeof KeepAliveMessageSchema>;

// https://dev.twitch.tv/docs/eventsub/websocket-reference#notification-message
export const NotificationMessageSchema = T.Object({
  metadata: T.Object({
    ...baseMessageMetadata,
    message_type: T.Literal('notification'),
    subscription_type: T.String(),
    subscription_version: T.String(),
  }),
  payload: T.Object({
    subscription: T.Object({
      id: T.String(),
      status: T.Literal('enabled'),
      type: T.String(),
      version: T.String(),
      cost: T.Number(),
      condition: T.Unknown(),
      transport: T.Object({
        method: T.Literal('websocket'),
        session_id: T.String(),
      }),
      created_at: T.String({ format: 'date-time' }),
    }),
    event: T.Unknown(),
  }),
});
export type NotifcationMessage = Static<typeof NotificationMessageSchema>;

// https://dev.twitch.tv/docs/eventsub/websocket-reference#reconnect-message
export const ReconnectMessageSchema = T.Object({
  metadata: T.Object({
    ...baseMessageMetadata,
    message_type: T.Literal('session_reconnect'),
  }),
  payload: T.Object({
    session: T.Object({
      id: T.String(),
      status: T.Literal('reconnecting'),
      keepalive_timeout_seconds: T.Null(),
      reconnect_url: T.String({ format: 'url' }),
      connected_at: T.String({ format: 'date-time' }),
    }),
  }),
});
export type ReconnectMessage = Static<typeof ReconnectMessageSchema>;

// https://dev.twitch.tv/docs/eventsub/websocket-reference#revocation-message
export const RevocationMessageSchema = T.Object({
  metadata: T.Object({
    ...baseMessageMetadata,
    message_type: T.Literal('revocation'),
    subscription_type: T.String(),
    subscription_version: T.String(),
  }),
  payload: T.Object({
    subscription: T.Object({
      id: T.String(),
      status: T.Union([
        T.Literal('authorization_revoked'),
        T.Literal('user_removed'),
        T.Literal('version_removed'),
      ]),
      type: T.String(),
      version: T.String(),
      cost: T.Number(),
      condition: T.Unknown(),
      transport: T.Object({
        method: T.Literal('websocket'),
        session_id: T.String(),
      }),
      created_at: T.String({ format: 'date-time' }),
    }),
    event: T.Unknown(),
  }),
});
export type RevocationMessage = Static<typeof RevocationMessageSchema>;

export const WebSocketMessageSchema = T.Union([
  WelcomeMessageSchema,
  KeepAliveMessageSchema,
  NotificationMessageSchema,
  ReconnectMessageSchema,
  RevocationMessageSchema,
]);
export type WebSocketMessage = Static<typeof WebSocketMessageSchema>;

export const WebSocketMessageCompiler = Compile(WebSocketMessageSchema);

// https://dev.twitch.tv/docs/eventsub/eventsub-reference/#channel-chat-message-event
export const ChatMessageEventSchema = T.Object({
  broadcaster_user_id: T.String(),
  broadcaster_user_name: T.String(),
  broadcaster_user_login: T.String(),
  chatter_user_id: T.String(),
  chatter_user_name: T.String(),
  chatter_user_login: T.String(),
  message_id: T.String(),
  message: T.Object({
    text: T.String(),
  }),
  message_type: T.String(),
});
export type ChatMessageEvent = Static<typeof ChatMessageEventSchema>;

export const ChatMessageEventCompiler = Compile(ChatMessageEventSchema);
