import { Repository } from '@lib/db/repository.js';
import type { TierList } from '@lib/tierlist/models.js';
import { TierListEditor } from '@lib/tierlist/tierListEditor.js';
import { expect } from 'chai';
import Sinon from 'sinon';

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
      const tierList = createTierList();
      tierList.tiers.push({ name: '', color: '' });

      const res = editor.setTierList(tierList);

      expect(res).to.be.true;
      expect(editor.getTierList()).to.equal(tierList);
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
      const res = editor.addItem('item', 'image');

      expect(res).to.be.true;
      expect(editor.getTierList().items).to.have.all.keys('item');
      expect(editor.getTierList().items['item']?.imageUrl).to.equal('image');
    });

    it('should fail if name is already in use in the tier list', function () {
      editor.addItem('item', 'image');
      const res = editor.addItem('item', 'other image');

      expect(res).to.be.false;
    });

    it('should fail if name is empty', function () {
      const res = editor.addItem('');

      expect(res).to.be.false;
    });
  });

  describe('removeItem', function () {
    it('should remove an item', function () {
      editor.addItem('item');
      editor.removeItem('item');

      expect(editor.getTierList().items).to.be.empty;
    });

    it('should not affect other items', function () {
      editor.addItem('item');
      editor.addItem('other');
      editor.removeItem('item');

      expect(editor.getTierList().items).to.have.all.keys('other');
    });

    it('should not throw when deleting nonexisting item', function () {
      editor.removeItem('item');
    });

    it('should reset focus if deleted item was focused', function () {
      editor.addItem('item');

      const res = editor.setFocus('item');
      editor.removeItem('item');

      expect(res).to.be.true;
      expect(editor.getTierList().focus).to.be.null;
    });
  });

  describe('renameItem', function () {
    it('should rename the item', function () {
      editor.addItem('old');
      const item = editor.getTierList().items['old'];

      const res = editor.updateItem('old', 'new');

      expect(res).to.be.true;
      expect(editor.getTierList().items).to.have.all.keys('new');
      expect(editor.getTierList().items['new']).to.equal(item);
    });

    it('should fail on empty old name', function () {
      const res = editor.updateItem('', 'new');
      expect(res).to.be.false;
    });

    it('should fail on empty new name', function () {
      const res = editor.updateItem('old', '');
      expect(res).to.be.false;
    });

    it('should fail on nonexisting old name', function () {
      const res = editor.updateItem('old', 'new');
      expect(res).to.be.false;
    });

    it('should fail on preexisting item with new name', function () {
      editor.addItem('old');
      editor.addItem('new');

      const res = editor.updateItem('old', 'new');

      expect(res).to.be.false;
    });

    it('should rename focus if item was focused', function () {
      editor.addItem('old');
      editor.setFocus('old');

      const res = editor.updateItem('old', 'new');

      expect(res).to.be.true;
      expect(editor.getTierList().focus).to.equal('new');
    });
  });

  describe('addTier', function () {
    it('should add the tier', function () {
      const res = editor.addTier('tier', 'color');

      expect(res).to.be.true;
      expect(editor.getTierList().tiers).to.have.lengthOf(1);
      expect(editor.getTierList().tiers[0]).to.be.deep.equal({
        name: 'tier',
        color: 'color',
      });
    });

    it('should fail if name is already in use by a preexisting tier', function () {
      editor.addTier('tier', 'color');

      const res = editor.addTier('tier', 'color');

      expect(res).to.be.false;
    });

    it('should fail if name is empty', function () {
      const res = editor.addTier('', 'color');
      expect(res).to.be.false;
    });
  });

  describe('updateTier', function () {
    it('should update the tier', function () {
      editor.addTier('old', 'old color');

      const res = editor.updateTier('old', 'new', 'new color');

      expect(res).to.be.true;
      expect(editor.getTierList().tiers[0]).to.deep.equal({
        name: 'new',
        color: 'new color',
      });
    });

    it('should fail on empty old name', function () {
      const res = editor.updateTier('', 'new');
      expect(res).to.be.false;
    });

    it('should fail on empty new name', function () {
      const res = editor.updateTier('old', '');
      expect(res).to.be.false;
    });

    it('should fail on nonexisting old name', function () {
      const res = editor.updateTier('old', 'new');
      expect(res).to.be.false;
    });

    it('should fail on preexisting item with new name', function () {
      editor.addTier('old', 'old color');
      editor.addTier('new', 'new color');

      const res = editor.updateTier('old', 'new', 'new color');

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
      const res1 = editor.addItem('other item');
      const res2 = editor.setFocus('other item');
      const res3 = editor.vote('user', 'item A');

      expect(res1).to.be.true;
      expect(res2).to.be.true;
      expect(res3).to.be.false;
    });
  });
});
