import type { SearchChannel } from './types/api.ts';

export class Channel {
  readonly channel: SearchChannel;

  constructor(channel: SearchChannel) {
    this.channel = channel;
  }

  name(): string {
    return this.channel.broadcaster_login;
  }

  id(): string {
    return this.channel.id;
  }
}
