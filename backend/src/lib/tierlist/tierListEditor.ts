import type { Repository } from '@lib/db/repository.js';
import type { TierList } from './models.ts';
import escapeStringRegexp from 'escape-string-regexp';
import { baseLogger } from '@lib/util.js';

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

  setTierList(tierList: TierList): boolean {
    this.tierList = tierList;
    this.update();
    return true;
  }

  setVoting(isVoting: boolean): void {
    this.tierList.isVoting = isVoting;
  }

  setFocus(name: string | null): boolean {
    if (name !== null && !this.tierList.items[name]) return false;

    this.tierList.focus = name;
    return true;
  }

  addItem(name: string, imageUrl: string | null = null): boolean {
    if (!name || this.tierList.items[name]) return false;

    this.tierList.items[name] = {
      imageUrl,
      votes: {},
    };
    this.update();

    return true;
  }

  removeItem(name: string): void {
    delete this.tierList.items[name];
    if (this.tierList.focus === name) {
      this.tierList.focus = null;
    }
    this.update();
  }

  renameItem(oldName: string, newName: string): boolean {
    if (!oldName || !newName) return false;

    const item = this.tierList.items[oldName];
    if (!item || this.tierList.items[newName]) return false;

    delete this.tierList.items[oldName];
    this.tierList.items[newName] = item;
    if (this.tierList.focus === oldName) {
      this.tierList.focus = newName;
    }
    this.update();

    return true;
  }

  addTier(name: string, color: string): boolean {
    if (!name || this.tierList.tiers.find((t) => t.name === name)) {
      return false;
    }

    this.tierList.tiers.push({ name, color });
    this.update();

    return true;
  }

  updateTier(oldName: string, newName: string, color?: string): boolean {
    if (!oldName || !newName) return false;

    const tier = this.tierList.tiers.find((t) => t.name === oldName);
    if (!tier || this.tierList.tiers.find((t) => t.name === newName)) {
      return false;
    }

    tier.name = newName;
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
      .catch((err) => {
        logger.error({ err }, 'Failed to save tier list');
      });
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
      this.save().then(() => {
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
