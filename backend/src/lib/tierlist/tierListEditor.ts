import type { Repository } from '@lib/db/repository.js';
import type { Channel } from '@lib/twitch/models.js';
import type { TierList } from './types.ts';
import escapeStringRegexp from 'escape-string-regexp';

export class TierListEditor {
  private readonly repo: Repository;
  private readonly channelId: string;
  private readonly tierList: TierList;
  private regex: RegExp;
  private saveIntervalId: NodeJS.Timeout | undefined;

  constructor(repo: Repository, channel: Channel, tierList: TierList) {
    this.repo = repo;
    this.channelId = channel.id();
    this.tierList = tierList;
    this.regex = this.buildRegex();
    this.startAutoSave();
  }

  addItem(name: string, imageUrl?: string | undefined): boolean {
    if (!name.trim() || this.tierList.items[name]) return false;

    this.tierList.items[name] = {
      imageUrl,
      votes: {},
    };
    this.regex = this.buildRegex();

    return true;
  }

  removeItem(name: string): void {
    delete this.tierList.items[name];
    this.regex = this.buildRegex();
  }

  renameItem(oldName: string, newName: string): boolean {
    if (!oldName.trim() || !newName.trim()) return false;

    const item = this.tierList.items[oldName];
    if (!item || this.tierList.items[newName]) return false;

    delete this.tierList.items[oldName];
    this.tierList.items[newName] = item;
    this.regex = this.buildRegex();

    return true;
  }

  renameTier(oldName: string, newName: string): boolean {
    if (!oldName.trim() || !newName.trim()) return false;

    const tier = this.tierList.tiers.find((t) => t.name === oldName);
    if (!tier || this.tierList.tiers.find((t) => t.name === newName)) {
      return false;
    }

    tier.name = newName;
    this.regex = this.buildRegex();

    return true;
  }

  vote(userId: string, message: string): void {
    if (!message.trim()) return;
    const choice = this.parse(message);
    if (!choice) return;

    const [itemName, tierIdx] = choice;
    const votes = this.tierList.items[itemName]?.votes;
    if (votes) {
      votes[userId] = tierIdx;
    }
  }

  save(): void {
    this.repo.setTierList(this.channelId, this.tierList);
  }

  startAutoSave(): void {
    const SAVE_INTERVAL = 15 * 1000; // 15 seconds

    this.stopAutoSave();
    this.saveIntervalId = setInterval(() => {
      this.repo.setTierList(this.channelId, this.tierList);
    }, SAVE_INTERVAL);
  }

  stopAutoSave(): void {
    clearInterval(this.saveIntervalId);
    this.saveIntervalId = undefined;
  }

  // Tries to parse `message` as [item name, tier index]
  private parse(message: string): [string, number] | undefined {
    const match = message.match(this.regex);
    if (!match) return undefined;

    const [, itemName, tierName] = match;
    const tierIdx = this.tierList.tiers.findIndex((t) => t.name === tierName);
    if (!itemName || tierIdx === -1) return undefined;

    return [itemName!, tierIdx];
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
