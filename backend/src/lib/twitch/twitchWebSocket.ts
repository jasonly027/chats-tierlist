import * as ws from 'ws';
import * as tw from './types/webSocket.js';
import { baseLogger } from '@lib/util.js';

const logger = baseLogger.child({ module: 'TwitchWebSocket' });

type ListenerArgs = {
  welcome: [msg: tw.WelcomeMessage];
  notification: [msg: tw.NotifcationMessage];
  revocation: [msg: tw.RevocationMessage];
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
        logger.warn({ messageType, obj }, 'Unexpected message received');
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

  private onWelcome(msg: tw.WelcomeMessage): void {
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

  private onKeepAlive(_msg: tw.KeepAliveMessage): void {
    logger.debug('Received keep-alive message');
    this.lastKeepAlive = Date.now();
  }

  private onNotification(msg: tw.NotifcationMessage): void {
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

  private onReconnect(msg: tw.ReconnectMessage): void {
    logger.info('Received reconnect message');

    const newSocket = new ws.WebSocket(msg.payload.session.reconnect_url, {
      autoPong: true,
    });
    newSocket.once('message', (data) => {
      this.socket.off('close', this.onCloseRef);
      this.socket.close(1000, 'Switching to new connection');

      this.socket = this.registerSocket(newSocket);

      const obj = JSON.parse(data.toString());
      const msg = tw.WelcomeMessageSchema.parse(obj);
      logger.info('Successfully reconnected');
      this.onWelcome(msg);
    });
  }

  private onRevocation(msg: tw.RevocationMessage): void {
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
