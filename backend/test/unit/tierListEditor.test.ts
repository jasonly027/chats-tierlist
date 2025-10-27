import { assert, expect } from 'chai';
import Sinon from 'sinon';

import { TierListEditor } from '@/modules/tierlist/shared/tierListEditor';
import type { TierList } from '@/modules/tierlist/tierlist.types';
import { Repository } from '@/shared/db/repository';

describe('TierListEditor', function () {
  let editor: TierListEditor;
  const repo = Sinon.createStubInstance(Repository);

  beforeEach(function () {
    repo.setTierList.resolves();

    editor = new TierListEditor(repo, 'id', createTierList());
  });

  afterEach(function () {
    // Cancel the delayed save to repo
    if (editor['saveTimeoutId']) {
      clearTimeout(editor['saveTimeoutId']);
    }
    Sinon.reset();
  });

  function createTierList(): TierList {
    return {
      tiers: [],
      items: {},
      isVoting: true,
      focus: null,
      version: Date.now(),
    };
  }

  describe('setTierList', function () {
    it('should set tier list', function () {
      const res = editor.setTierList({
        tiers: {
          newTier: { color: 'red' },
        },
        items: {},
      });

      expect(res).to.be.true;
      expect(editor.getTierList().tiers).to.have.lengthOf(1);
      expect(editor.getTierList().tiers[0]).to.have.property('name', 'newTier');
      expect(editor.getTierList().tiers[0]).to.have.property('color', 'red');
    });
  });

  describe('setFocus', function () {
    beforeEach(function () {
      editor.addTier('A', 'red');
      editor.addTier('B', 'blue');
      editor.addItem('item');
    });

    it('should set focus to item', function () {
      const res = editor.setFocus('item');

      expect(res).to.be.true;
      expect(editor.getTierList().focus).to.equal('item');
    });

    it('should set focus to null', function () {
      editor.setFocus('item');

      const res = editor.setFocus(null);

      expect(res).to.be.true;
      expect(editor.getTierList().focus).to.be.null;
    });

    it('should fail if fail is not a valid item', function () {
      const res = editor.setFocus('not item');
      expect(res).to.be.false;
    });
  });

  describe('addItem', function () {
    it('should add the item to the tier list', function () {
      const id = editor.addItem('item', 'image');

      expect(id).to.not.be.null;
      expect(editor.getTierList().items).to.have.all.keys('item');
      expect(editor.getTierList().items['item']?.imageUrl).to.equal('image');
    });

    it('should fail if name is already in use in the tier list', function () {
      editor.addItem('item', 'image');
      const id = editor.addItem('item', 'other image');

      expect(id).to.be.null;
    });

    it('should fail if name is empty', function () {
      const id = editor.addItem('');

      expect(id).to.be.null;
    });
  });

  describe('removeItem', function () {
    it('should remove an item', function () {
      const id = editor.addItem('item');
      assert.isNotNull(id);
      editor.removeItem(id);

      expect(editor.getTierList().items).to.be.empty;
    });

    it('should not affect other items', function () {
      const itemId = editor.addItem('item');
      assert.isNotNull(itemId);
      editor.addItem('other');
      editor.removeItem(itemId);

      expect(editor.getTierList().items).to.have.all.keys('other');
    });

    it('should not throw when deleting nonexisting item', function () {
      editor.removeItem('item');
    });

    it('should reset focus if deleted item was focused', function () {
      const id = editor.addItem('item');
      assert.isNotNull(id);

      const res = editor.setFocus('item');
      editor.removeItem(id);

      expect(res).to.be.true;
      expect(editor.getTierList().focus).to.be.null;
    });
  });

  describe('updateItem', function () {
    it('should update the item', function () {
      const id = editor.addItem('old');
      assert.isNotNull(id);
      const item = editor.getTierList().items['old'];

      const res = editor.updateItem(id, {
        name: 'new',
        imageUrl: 'image',
      });

      expect(res).to.be.true;
      expect(editor.getTierList().items).to.have.all.keys('new');
      expect(editor.getTierList().items['new']).to.equal(item);
      expect(item?.imageUrl).to.equal('image');
    });

    it('should fail on nonexisting old name', function () {
      const res = editor.updateItem('old', {});
      expect(res).to.be.false;
    });

    it('should fail on empty new name', function () {
      editor.addItem('old');

      const res = editor.updateItem('old', { name: '' });

      expect(res).to.be.false;
    });

    it('should fail on preexisting item with new name', function () {
      editor.addItem('old');
      editor.addItem('new');

      const res = editor.updateItem('old', { name: 'new' });

      expect(res).to.be.false;
    });

    it('should rename focus if item was focused', function () {
      const id = editor.addItem('old');
      assert.isNotNull(id);
      editor.setFocus('old');

      const res = editor.updateItem(id, { name: 'new' });

      expect(res).to.be.true;
      expect(editor.getTierList().focus).to.equal('new');
    });
  });

  describe('addTier', function () {
    it('should add the tier', function () {
      const id = editor.addTier('tier', 'color');

      expect(id).to.not.be.null;
      expect(editor.getTierList().tiers).to.have.lengthOf(1);
      expect(editor.getTierList().tiers[0]).to.be.deep.equal({
        id,
        name: 'tier',
        color: 'color',
      });
    });

    it('should fail if name is already in use by a preexisting tier', function () {
      editor.addTier('tier', 'color');

      const id = editor.addTier('tier', 'color');

      expect(id).to.be.null;
    });

    it('should fail if name is empty', function () {
      const id = editor.addTier('', 'color');
      expect(id).to.be.null;
    });
  });

  describe('updateTier', function () {
    it('should update the tier', function () {
      const id = editor.addTier('old', 'old color');
      assert.isNotNull(id);

      const res = editor.updateTier(id, {
        name: 'new',
        color: 'new color',
      });

      expect(res).to.be.true;
      expect(editor.getTierList().tiers[0]).to.deep.equal({
        id,
        name: 'new',
        color: 'new color',
      });
    });

    it('should fail on nonexisting old name', function () {
      const res = editor.updateTier('old', { name: 'new' });
      expect(res).to.be.false;
    });

    it('should fail on empty new name', function () {
      editor.addTier('old', 'old color');

      const res = editor.updateTier('old', {
        name: '',
      });
      expect(res).to.be.false;
    });

    it('should fail on preexisting item with new name', function () {
      editor.addTier('old', 'old color');
      editor.addTier('new', 'new color');

      const res = editor.updateTier('old', {
        name: 'new',
      });

      expect(res).to.be.false;
    });
  });

  describe('vote', function () {
    beforeEach(function () {
      editor.addTier('A', 'red');
      editor.addTier('B', 'blue');
      editor.addItem('item');
    });

    it('should store the vote', function () {
      const res = editor.vote('user', 'item A');

      expect(res).to.be.true;
      expect(editor.getTierList().items['item']?.votes).has.all.keys('user');
      expect(editor.getTierList().items['item']?.votes['user']).to.equal(0);
    });

    it('should overwrite a vote from the same user for the same item', function () {
      const res1 = editor.vote('user', 'item A');
      const res2 = editor.vote('user', 'item B');

      expect(res1).to.be.true;
      expect(res2).to.be.true;
      expect(editor.getTierList().items['item']?.votes['user']).to.equal(1);
    });

    it('should store votes from multiple users', function () {
      const res1 = editor.vote('user1', 'item A');
      const res2 = editor.vote('user2', 'item B');

      expect(res1).to.be.true;
      expect(res2).to.be.true;
      expect(editor.getTierList().items['item']?.votes).has.all.keys(
        'user1',
        'user2'
      );
      expect(editor.getTierList().items['item']?.votes['user1']).to.equal(0);
      expect(editor.getTierList().items['item']?.votes['user2']).to.equal(1);
    });

    it('should fail when voting is disabled', function () {
      editor.setVoting(false);

      const res = editor.vote('user', 'item A');

      expect(res).to.be.false;
    });

    it('should fail when message is empty', function () {
      const res = editor.vote('user', '');
      expect(res).to.be.false;
    });

    it('should fail when parse fails', function () {
      const res = editor.vote('user', 'notItem notAorB');
      expect(res).to.be.false;
    });

    it('should fail when item does not exist', function () {
      const res = editor.vote('user', 'notItem A');
      expect(res).to.be.false;
    });

    it('should fail when tier does not exist', function () {
      const res = editor.vote('user', 'item notAorB');
      expect(res).to.be.false;
    });

    it('should fail when item is not the focus', function () {
      const id = editor.addItem('other item');
      const focusRes = editor.setFocus('other item');
      const voteRes = editor.vote('user', 'item A');

      expect(id).to.not.be.null;
      expect(focusRes).to.be.true;
      expect(voteRes).to.be.false;
    });
  });
});
