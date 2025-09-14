import * as ws from 'ws';
import * as tw from './types/webSocket.js';
import type { FastifyBaseLogger } from 'fastify';

export interface TwitchWebSocketOptions {
  url?: string;
  logger?: FastifyBaseLogger;
}

type ListenerArgs = {
  welcome: [msg: tw.WelcomeMessage];
  notification: [msg: tw.NotifcationMessage];
  close: [code: number, reason: string];
  error: [err: Error];
};

type Listener<T extends Array<unknown>> = (...args: T) => void;

type OnCloseRef = (code: number, reason: Buffer) => void;

export class TwitchWebSocket {
  private isAlive: boolean;
  private keepAliveInterval: NodeJS.Timeout | undefined;
  private onCloseRef: OnCloseRef;
  private socket: ws.WebSocket;

  private listeners: {
    [K in keyof ListenerArgs]: Array<Listener<ListenerArgs[K]>>;
  };

  private logger: FastifyBaseLogger | undefined;

  constructor(options?: TwitchWebSocketOptions) {
    this.isAlive = true;
    this.keepAliveInterval = undefined;
    this.onCloseRef = this.onClose.bind(this);
    this.socket = this.registerSocket(
      new ws.WebSocket(options?.url ?? 'wss://eventsub.wss.twitch.tv/ws', {
        autoPong: true,
      })
    );

    this.listeners = {
      welcome: [],
      notification: [],
      close: [],
      error: [],
    };

    this.logger = options?.logger;
  }

  on<K extends keyof ListenerArgs>(
    event: K,
    callback: Listener<ListenerArgs[K]>
  ): this {
    this.listeners[event].push(callback);
    return this;
  }

  off<K extends keyof ListenerArgs>(
    event: K,
    callback: Listener<ListenerArgs[K]>
  ): this {
    const idx = this.listeners[event].indexOf(callback);
    if (idx == -1) return this;

    this.listeners[event].splice(idx, 1);
    return this;
  }

  once<K extends keyof ListenerArgs>(
    event: K,
    callback: Listener<ListenerArgs[K]>
  ): this {
    const wrapper: Listener<ListenerArgs[K]> = (...msg) => {
      this.off(event, wrapper);
      callback(...msg);
    };
    this.on(event, wrapper);
    return this;
  }

  private registerSocket(socket: ws.WebSocket): ws.WebSocket {
    this.clearKeepAliveCheck();
    this.isAlive = true;
    this.onCloseRef = this.onClose.bind(this);

    socket.on('message', this.onMessage.bind(this));
    socket.on('error', this.onError.bind(this));
    socket.on('close', this.onCloseRef);
    return socket;
  }

  private onMessage(data: ws.RawData): void {
    const obj = JSON.parse(data.toString());
    const messageType = obj?.metadata?.message_type;

    switch (messageType) {
      case 'session_welcome':
        this.onWelcome(tw.WelcomeMessageSchema.parse(obj));
        break;
      case 'session_keepalive':
        this.onKeepAlive(tw.KeepAliveMessageSchema.parse(obj));
        break;
      case 'notification':
        this.onNotification(tw.NotificationMessageSchema.parse(obj));
        break;
      case 'session_reconnect':
        this.onReconnect(tw.ReconnectMessageSchema.parse(obj));
        break;
      case 'revocation':
        this.onRevocation(tw.RevocationMessageSchema.parse(obj));
        break;
      default:
        this.logger?.warn({ messageType, obj }, 'Unexpected message received');
    }
  }

  private onError(err: Error): void {
    this.logger?.error({ err }, 'Received error');
    this.listeners.error.forEach((fn) => fn(err));
  }

  private onClose(code: number, reason: Buffer): void {
    const reasonStr = reason.toString();
    this.logger?.info({ code, reason: reasonStr }, 'Connection closed');
    this.clearKeepAliveCheck();
    this.listeners.close.forEach((fn) => fn(code, reasonStr));
  }

  private onWelcome(msg: tw.WelcomeMessage): void {
    this.logger?.info(
      { id: msg.payload.session.id },
      'Received welcome message'
    );

    this.startKeepAliveCheck(msg.payload.session.keepalive_timeout_seconds);
    this.listeners.welcome.forEach((fn) => fn(msg));
  }

  private onKeepAlive(_msg: tw.KeepAliveMessage): void {
    this.logger?.debug('Received keep-alive message');
    this.isAlive = true;
  }

  private onNotification(msg: tw.NotifcationMessage): void {
    this.logger?.info('Received notification message');
    this.isAlive = true;
    this.listeners.notification.forEach((fn) => fn(msg));
  }

  private onReconnect(msg: tw.ReconnectMessage): void {
    this.logger?.info('Received reconnect message');

    const newSocket = new ws.WebSocket(msg.payload.session.reconnect_url, {
      autoPong: true,
    });
    newSocket.once('message', (data) => {
      this.socket.off('close', this.onCloseRef);
      this.socket.close(1000, 'Switching to new connection');

      this.socket = this.registerSocket(newSocket);

      const obj = JSON.parse(data.toString());
      const msg = tw.WelcomeMessageSchema.parse(obj);
      this.logger?.info('Successfully reconnected');
      this.onWelcome(msg);
    });
  }

  private onRevocation(msg: tw.RevocationMessage): void {
    this.logger?.info({ msg }, 'Received revocation message');
  }

  private startKeepAliveCheck(timeoutSecs: number): void {
    const timeoutMilliseconds = timeoutSecs * 1000;

    this.keepAliveInterval = setInterval(() => {
      if (!this.isAlive) {
        this.logger?.info('No keep-alive from server. Closing connection...');
        this.socket.close(1001, 'No keep-alive from server');
        return;
      }
      this.isAlive = false;
    }, timeoutMilliseconds);
  }

  private clearKeepAliveCheck(): void {
    clearInterval(this.keepAliveInterval);
    this.keepAliveInterval = undefined;
  }
}
