import { expect } from 'chai';
import Sinon from 'sinon';

import { TierListEditor } from '@lib/tierlist/tierListEditor.js';
import { TierListListener } from '@lib/tierlist/tierListListener.js';
import { TierListStore } from '@lib/tierlist/tierListStore.js';
import { Channel } from '@lib/twitch/models.js';
import {
  TwitchChatSubscriber,
  type SubscriberEvent,
} from '@lib/twitch/twitchChatSubscriber.js';

describe('TierListListener', function () {
  let listener: TierListListener;
  const store = Sinon.createStubInstance(TierListStore);
  const subscriber = Sinon.createStubInstance(TwitchChatSubscriber);

  beforeEach(function () {
    listener = new TierListListener(store, subscriber);
  });

  afterEach(function () {
    for (const bd of listener['broadcasts']) {
      listener['removeBroadcast'](bd);
    }
    Sinon.reset();
  });

  function createChannel(): Channel {
    return new Channel({
      id: 'id',
      broadcaster_login: 'login',
      display_name: 'name',
      is_live: true,
      thumbnail_url: 'thumbnail',
    });
  }

  describe('listen', function () {
    it('should create a broadcast from the given channel', async function () {
      subscriber.subscribe.resolves(true);

      const channel = createChannel();
      const res = await listener.listen(channel);

      expect(res).to.be.true;
      expect(listener['broadcasts']).to.have.lengthOf(1);
      expect(listener['broadcasts'][0]?.channel).to.equal(channel);
    });

    it('should not create a broadcast from the given channel if a broadcast for it already exists', async function () {
      subscriber.subscribe.onFirstCall().resolves(true);
      subscriber.subscribe.throws(new Error('should be not be called again'));

      const channel = createChannel();
      const res1 = await listener.listen(channel);
      const res2 = await listener.listen(channel);

      expect(res1).to.be.true;
      expect(res2).to.be.true;
      expect(listener['broadcasts']).to.have.lengthOf(1);
      expect(listener['broadcasts'][0]?.channel).to.equal(channel);
    });

    it('should not create a broadcast if subscribe fails', async function () {
      subscriber.subscribe.resolves(false);

      const res = await listener.listen(createChannel());

      expect(res).to.be.false;
      expect(listener['broadcasts']).to.be.empty;
    });

    it('should forward a subscriber message to editor', async function () {
      subscriber.subscribe.resolves(true);
      const editor = Sinon.createStubInstance(TierListEditor);
      store.getEditor.resolves(editor);

      await listener.listen(createChannel());
      const msg: SubscriberEvent = {
        type: 'message',
        event: {
          broadcaster_user_id: '',
          broadcaster_user_login: '',
          broadcaster_user_name: '',
          chatter_user_id: '',
          chatter_user_login: '',
          chatter_user_name: '',
          message: {
            text: '',
          },
          message_id: '',
          message_type: '',
        },
      };
      subscriber.subscribe.yield(msg);
      await Promise.resolve();

      Sinon.assert.called(editor.vote);
    });

    it('should remove the broadcast when subscriber message is not a regular message', async function () {
      subscriber.subscribe.resolves(true);

      await listener.listen(createChannel());
      subscriber.subscribe.yield({ type: 'not message' });
      await Promise.resolve();

      expect(listener['broadcasts']).to.be.empty;
      Sinon.assert.called(subscriber.unsubscribe);
    });
  });
});
