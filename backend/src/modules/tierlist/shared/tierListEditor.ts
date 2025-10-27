import escapeStringRegexp from 'escape-string-regexp';
import { nanoid } from 'nanoid';

import {
  TierListTier,
  type FreshTierList,
  type TierList,
  type TierListItem,
} from '@/modules/tierlist/tierlist.types';
import type { Repository } from '@/shared/db/repository';
import { baseLogger } from '@/shared/util';

const logger = baseLogger.child({ module: 'TierListEditor' });

export class TierListEditor {
  private readonly repo: Repository;
  private readonly channelId: string;
  private tierList: TierList;
  private regex: RegExp;
  private saveTimeoutId: NodeJS.Timeout | undefined;
  private dirty: boolean;

  constructor(repo: Repository, channelId: string, tierList: TierList) {
    this.repo = repo;
    this.channelId = channelId;
    this.tierList = tierList;
    this.regex = this.buildRegex();
    this.dirty = false;
  }

  getTierList(): TierList {
    return this.tierList;
  }

  setTierList(fresh: FreshTierList): boolean {
    this.tierList = tierListFromFreshTierList(fresh);
    this.update();
    return true;
  }

  setVoting(isVoting: boolean): void {
    this.tierList.isVoting = isVoting;
  }

  setFocus(name: string | null): boolean {
    if (name !== null && !this.tierList.items[name]) {
      return false;
    }

    this.tierList.focus = name;
    return true;
  }

  addItem(name: string, imageUrl: string | null = null): string | null {
    if (!name || this.tierList.items[name]) {
      return null;
    }

    const id = nanoid();
    this.tierList.items[name] = {
      id,
      imageUrl,
      votes: {},
    };
    this.update();

    return id;
  }

  removeItem(id: string): boolean {
    const [name] = this.itemById(id);
    if (!name) {
      return false;
    }

    delete this.tierList.items[name];
    if (this.tierList.focus === name) {
      this.tierList.focus = null;
    }

    this.update();
    return true;
  }

  updateItem(
    id: string,
    { name: newName, imageUrl }: { name?: string; imageUrl?: string }
  ): boolean {
    const [name, item] = this.itemById(id);
    if (!item) {
      return false;
    }
    if (
      // Empty name
      newName === '' ||
      // Naming collision
      (newName !== undefined && this.tierList.items[newName])
    ) {
      return false;
    }

    item.imageUrl = imageUrl ?? item.imageUrl;
    if (newName) {
      delete this.tierList.items[name];
      this.tierList.items[newName] = item;
      if (this.tierList.focus === name) {
        this.tierList.focus = newName;
      }
    }
    this.update();

    return true;
  }

  addTier(name: string, color: string): string | null {
    if (!name || this.tierList.tiers.find((t) => t.name === name)) {
      return null;
    }

    const id = nanoid();
    this.tierList.tiers.push({ id, name, color });
    this.update();

    return id;
  }

  updateTier(
    id: string,
    { name, color }: { name?: string; color?: string }
  ): boolean {
    const tier = this.tierById(id);
    if (!tier) {
      return false;
    }
    if (
      // Empty name
      name === '' ||
      // Naming collision
      this.tierList.tiers.find((t) => t.name === name)
    ) {
      return false;
    }

    tier.name = name ?? tier.name;
    tier.color = color ?? tier.color;
    this.update();

    return true;
  }

  vote(userId: string, message: string): boolean {
    if (!this.tierList.isVoting || !message) return false;

    const choice = this.parse(message);
    if (!choice) return false;

    const [itemName, tierIdx] = choice;
    if (this.tierList.focus !== null && this.tierList.focus !== itemName) {
      return false;
    }

    const votes = this.tierList.items[itemName]?.votes;
    if (!votes) return false;

    votes[userId] = tierIdx;
    this.update();

    return true;
  }

  save(): Promise<void> {
    return this.repo
      .setTierList(this.channelId, this.tierList)
      .then(() => {
        logger.info({ channelId: this.channelId }, 'Saved tier list');
      })
      .catch((err: unknown) => {
        logger.error({ err }, 'Failed to save tier list');
      });
  }

  private tierById(id: string): TierListTier | undefined {
    return this.tierList.tiers.find((t) => t.id === id);
  }

  private itemById(
    id: string
  ): [string, TierListItem] | [undefined, undefined] {
    const entry = Object.entries(this.tierList.items).find(
      ([, value]) => value.id === id
    );
    if (!entry) {
      return [undefined, undefined];
    }
    return entry;
  }

  // Tries to parse `message` as [item name, tier index]
  private parse(message: string): [string, number] | undefined {
    const match = message.match(this.regex);
    if (!match) return undefined;

    const [, itemName, tierName] = match;
    const tierIdx = this.tierList.tiers.findIndex((t) => t.name === tierName);
    if (!itemName || tierIdx === -1) return undefined;

    return [itemName, tierIdx];
  }

  private update(): void {
    this.tierList.version = Date.now();
    this.requestToSave();
    this.regex = this.buildRegex();
  }

  // Marks the state as dirty and schedules a save after a delay.
  // Subsequent calls after a scheduling call but before the actual save
  // only re-mark the state dirty and do not schedule another save.
  // After the save completes, if the state is still dirty, this function
  // calls itself to schedule another save.
  private requestToSave(): void {
    this.dirty = true;
    if (this.saveTimeoutId) return;
    const SAVE_DELAY = 5 * 1000; // 5 seconds

    this.saveTimeoutId = setTimeout(() => {
      this.dirty = false;
      void this.save().finally(() => {
        this.saveTimeoutId = undefined;
        if (this.dirty) this.requestToSave();
      });
    }, SAVE_DELAY);
  }

  private buildRegex(): RegExp {
    const tiersPattern = this.tierList.tiers
      .map((tier) => escapeStringRegexp(tier.name))
      .sort((a, b) => b.length - a.length)
      .join('|');
    const itemsPattern = Object.keys(this.tierList.items)
      .map((item) => escapeStringRegexp(item))
      .sort((a, b) => b.length - a.length)
      .join('|');
    if (!tiersPattern || !itemsPattern) return /^$/;

    return new RegExp(`^(${itemsPattern}) (${tiersPattern})$`);
  }
}

function tierListFromFreshTierList(list: FreshTierList): TierList {
  const tiers = Object.entries(list.tiers).map<TierListTier>(
    ([name, { color }]) => ({
      id: nanoid(),
      name,
      color,
    })
  );

  const items = Object.entries(list.items).reduce<Record<string, TierListItem>>(
    (prev, [name, { image_url }]) => ({
      ...prev,
      [name]: {
        id: nanoid(),
        imageUrl: image_url ?? null,
        votes: {},
      },
    }),
    {}
  );

  return {
    tiers,
    items,
    isVoting: false,
    focus: null,
    version: Date.now(),
  };
}
