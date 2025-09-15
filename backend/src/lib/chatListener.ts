import { TwitchChatSubscriber } from './twitch/twitchChatSubscriber.js';

export class ChatListener {
  private readonly subscriber: TwitchChatSubscriber;

  constructor(subscriber: TwitchChatSubscriber) {
    this.subscriber = subscriber;
  }
}
