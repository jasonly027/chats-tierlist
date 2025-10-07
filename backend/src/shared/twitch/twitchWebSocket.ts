import Value from 'typebox/value';
import * as ws from 'ws';

import {
  KeepAliveMessage,
  NotifcationMessage,
  ReconnectMessage,
  RevocationMessage,
  WebSocketMessageCompiler,
  WelcomeMessage,
  WelcomeMessageSchema,
} from '@/shared/twitch/types/webSocket';
import { baseLogger } from '@/shared/util';

const logger = baseLogger.child({ module: 'TwitchWebSocket' });

type ListenerArgs = {
  welcome: [msg: WelcomeMessage];
  notification: [msg: NotifcationMessage];
  revocation: [msg: RevocationMessage];
  close: [code: number, reason: string];
  error: [err: Error];
};

type Listener<T extends unknown[]> = (...args: T) => void;

type OnCloseRef = (code: number, reason: Buffer) => void;

export class TwitchWebSocket {
  private lastKeepAlive: number;
  private keepAliveInterval: NodeJS.Timeout | undefined;
  private onCloseRef: OnCloseRef;
  private socket: ws.WebSocket;

  private listeners: {
    [K in keyof ListenerArgs]: Array<Listener<ListenerArgs[K]>>;
  };

  constructor(url?: string) {
    this.lastKeepAlive = Date.now();
    this.onCloseRef = this.onClose.bind(this);
    this.socket = this.registerSocket(
      new ws.WebSocket(url ?? 'wss://eventsub.wss.twitch.tv/ws', {
        autoPong: true,
      })
    );

    this.listeners = {
      welcome: [],
      notification: [],
      revocation: [],
      close: [],
      error: [],
    };
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
    this.onCloseRef = this.onClose.bind(this);

    socket.on('message', this.onMessage.bind(this));
    socket.on('error', this.onError.bind(this));
    socket.on('close', this.onCloseRef);
    return socket;
  }

  private onMessage(data: ws.RawData): void {
    if (!Buffer.isBuffer(data)) {
      logger.error({ data }, 'Received unexpected non-Buffer data');
      return;
    }

    const msg: unknown = JSON.parse(data.toString());
    if (!WebSocketMessageCompiler.Check(msg)) {
      logger.error({ msg }, 'Unexpected WebSocket message received');
      return;
    }

    switch (msg.metadata.message_type) {
      case 'session_welcome':
        this.onWelcome(msg as WelcomeMessage);
        break;
      case 'session_keepalive':
        this.onKeepAlive(msg as KeepAliveMessage);
        break;
      case 'notification':
        this.onNotification(msg as NotifcationMessage);
        break;
      case 'session_reconnect':
        this.onReconnect(msg as ReconnectMessage);
        break;
      case 'revocation':
        this.onRevocation(msg as RevocationMessage);
        break;
    }
  }

  private onError(err: Error): void {
    logger.error({ err }, 'Received error');
    this.listeners.error.forEach((fn) => {
      try {
        fn(err);
      } catch (err) {
        logger.error({ err }, 'onError callback threw an error');
      }
    });
  }

  private onClose(code: number, reason: Buffer): void {
    const reasonStr = reason.toString();
    logger.info({ code, reason: reasonStr }, 'Connection closed');
    this.clearKeepAliveCheck();
    this.listeners.close.forEach((fn) => {
      try {
        fn(code, reasonStr);
      } catch (err) {
        logger.error({ err }, 'onClose callback threw an error');
      }
    });
  }

  private onWelcome(msg: WelcomeMessage): void {
    logger.info({ id: msg.payload.session.id }, 'Received welcome message');

    this.startKeepAliveCheck(msg.payload.session.keepalive_timeout_seconds);
    this.listeners.welcome.forEach((fn) => {
      try {
        fn(msg);
      } catch (err) {
        logger.error({ err }, 'onWelcome callback threw an error');
      }
    });
  }

  private onKeepAlive(_msg: KeepAliveMessage): void {
    logger.debug('Received keep-alive message');
    this.lastKeepAlive = Date.now();
  }

  private onNotification(msg: NotifcationMessage): void {
    logger.debug('Received notification message');
    this.lastKeepAlive = Date.now();
    this.listeners.notification.forEach((fn) => {
      try {
        fn(msg);
      } catch (err) {
        logger.error({ err }, 'onNotification callback threw an error');
      }
    });
  }

  private onReconnect(msg: ReconnectMessage): void {
    logger.info('Received reconnect message');

    const newSocket = new ws.WebSocket(msg.payload.session.reconnect_url, {
      autoPong: true,
    });
    newSocket.once('message', (data) => {
      this.socket.off('close', this.onCloseRef);
      this.socket.close(1000, 'Switching to new connection');

      this.socket = this.registerSocket(newSocket);

      if (!Buffer.isBuffer(data)) {
        logger.error(
          { data },
          'Received unexpected non-Buffer data while reconnecting'
        );
        return;
      }
      const msg: unknown = JSON.parse(data.toString());
      if (!Value.Check(WelcomeMessageSchema, msg)) {
        logger.error(
          { msg },
          'Received unexpected non-Welcome message while reconnecting'
        );
        return;
      }

      logger.info('Successfully reconnected');
      this.onWelcome(msg);
    });
  }

  private onRevocation(msg: RevocationMessage): void {
    logger.info({ msg }, 'Received revocation message');
    this.listeners.revocation.forEach((fn) => {
      try {
        fn(msg);
      } catch (err) {
        logger.error({ err }, 'onRevocation callback threw an error');
      }
    });
  }

  private startKeepAliveCheck(timeoutSecs: number): void {
    this.clearKeepAliveCheck();

    const CHECK_INTERVAL = 10 * 1000; // 10 seconds
    const ALIVE_TIMEOUT = timeoutSecs * 1000;

    this.lastKeepAlive = Date.now();
    this.keepAliveInterval = setInterval(() => {
      if (Date.now() - this.lastKeepAlive > ALIVE_TIMEOUT) {
        logger.info('No keep-alive from server. Closing connection...');
        this.socket.close(1001, 'No keep-alive from server');
      }
    }, CHECK_INTERVAL);
  }

  private clearKeepAliveCheck(): void {
    clearInterval(this.keepAliveInterval);
    this.keepAliveInterval = undefined;
  }
}
