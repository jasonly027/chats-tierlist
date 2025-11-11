import { produce } from 'immer';
import { useState } from 'react';
import toast from 'react-hot-toast';

import Button from '@/components/ui/button';
import Cross from '@/components/ui/cross';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import Input from '@/components/ui/input';
import { useSetTierList } from '@/features/tierlist/api/set-tier-list';
import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import type {
  TierList,
  TierListRequest,
} from '@/features/tierlist/types/tier-list';

export default function HardEditButton() {
  const [open, setOpen] = useState(false);

  const { tierList } = useTierList();

  const [tiers, setTiers] = useState(() =>
    createFormTiers(tierList?.tiers ?? [])
  );

  const addNewTier = () => {
    if (tiers.length >= 50) {
      toast.error('Cannot have more than 50 tiers.');
      return;
    }
    setTiers(
      produce((tiers) => {
        const id = (tiers.at(-1)?.id ?? 0) + 1;
        tiers.push({ id, name: '', error: '' });
      })
    );
  };

  const removeTier = (idx: number) => {
    setTiers(
      produce((tiers) => {
        tiers.splice(idx, 1);
      })
    );
  };

  const [items, setItems] = useState(() =>
    createFormItems(tierList?.items ?? {})
  );

  const addNewItem = () => {
    if (items.length >= 500) {
      toast.error('Cannot have more than 500 items.');
      return;
    }
    setItems(
      produce((items) => {
        const id = (items.at(-1)?.id ?? 0) + 1;
        items.push({ id, name: '', imageUrl: '', error: '' });
      })
    );
  };

  const removeItem = (idx: number) =>
    setItems(
      produce((items) => {
        items.splice(idx, 1);
      })
    );

  const validate = () => {
    let isValid = true;

    setTiers(
      produce((tiers) => {
        isValid = isValid && !markDuplicates(tiers, 'Duplicate tier name');
      })
    );
    setItems(
      produce((items) => {
        isValid = isValid && !markDuplicates(items, 'Duplicate item name');
      })
    );

    return isValid;
  };

  const { mutate, isPending } = useSetTierList();

  if (!tierList) return;

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setTiers(() => createFormTiers(tierList.tiers));
        setItems(() => createFormItems(tierList.items));
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button className="flex items-center gap-1 text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
          Hard Edit
        </Button>
      </DialogTrigger>

      <DialogContent
        disableClose={isPending}
        className="max-h-[min(700px,90vh)] max-w-125 overflow-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <DialogTitle>Hard Edit</DialogTitle>
        <DialogDescription>
          Edit tiers and items. <br />
          <span className="font-bold text-red-600">Warning: </span> Edits using
          this window WILL reset votes.
        </DialogDescription>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!validate()) {
              const tierIdx = tiers.findIndex(({ error }) => error);
              if (tierIdx !== -1) {
                document
                  .getElementById(`tierName${tierIdx}`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
              }

              const itemIdx = items.findIndex(({ error }) => error);
              if (itemIdx !== -1) {
                document
                  .getElementById(`itemName${itemIdx}`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
              }

              return;
            }

            mutate(
              {
                data: {
                  tier_list: {
                    tiers: tiers.reduce<TierListRequest['tiers']>(
                      (tiers, { name }) => {
                        tiers[name] = {};
                        return tiers;
                      },
                      {}
                    ),
                    items: items.reduce<TierListRequest['items']>(
                      (items, { name, imageUrl }) => {
                        items[name] = {
                          image_url: imageUrl !== '' ? imageUrl : undefined,
                        };
                        return items;
                      },
                      {}
                    ),
                  },
                },
              },
              {
                onSettled() {
                  setOpen(false);
                },
              }
            );
          }}
          className="flex flex-col justify-center gap-3"
        >
          <h2 className="text-lg font-semibold">Tiers</h2>
          {tiers.map(({ id, name, error }, idx) => (
            <fieldset key={id}>
              <div className="flex items-center gap-1">
                <Input
                  id={`tierName${idx}`}
                  name={`tierName${idx}`}
                  type="text"
                  required
                  minLength={1}
                  maxLength={255}
                  value={name}
                  onChange={(e) =>
                    setTiers(
                      produce((tiers) => {
                        const tier = tiers[idx]!;
                        tier.name = e.target.value;
                        tier.error = '';
                      })
                    )
                  }
                  placeholder="Tier Name"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeTier(idx)}
                  className="hover:bg-surface-light/50 focus:bg-surface-light/50 rounded-full p-px focus:outline-0"
                >
                  <Cross />
                  <span className="sr-only">Remove Tier</span>
                </button>
              </div>
              <span className="mt-1 ml-1 block text-red-500">{error}</span>
            </fieldset>
          ))}
          <Button type="button" onClick={addNewTier} className="self-center">
            Add Tier
          </Button>

          <h2 className="text-lg font-semibold">Items</h2>
          {items.map(({ id, name, imageUrl, error }, idx) => (
            <fieldset key={id}>
              <div className="flex items-center gap-1">
                <Input
                  id={`itemName${idx}`}
                  name={`itemName${idx}`}
                  type="text"
                  required
                  minLength={1}
                  maxLength={255}
                  value={name}
                  onChange={(e) =>
                    setItems(
                      produce((items) => {
                        const item = items[idx]!;
                        item.name = e.target.value;
                        item.error = '';
                      })
                    )
                  }
                  placeholder="Item Name"
                  className="flex-2"
                />
                <Input
                  id={`itemImage${idx}`}
                  name={`itemImage${idx}`}
                  type="url"
                  value={imageUrl}
                  onChange={(e) =>
                    setItems(
                      produce((items) => {
                        items[idx]!.imageUrl = e.target.value;
                      })
                    )
                  }
                  placeholder="Image URL"
                  className="flex-1"
                />

                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="hover:bg-surface-light/50 focus:bg-surface-light/50 rounded-full p-px focus:outline-0"
                >
                  <Cross />
                  <span className="sr-only">Remove Item</span>
                </button>
              </div>
              <span className="mt-1 ml-1 block text-red-500">{error}</span>
            </fieldset>
          ))}
          <Button type="button" onClick={addNewItem} className="self-center">
            Add Item
          </Button>

          <div className="flex flex-wrap justify-center gap-3">
            <Button
              type="submit"
              disabled={isPending}
              className="w-[7ch] bg-emerald-700 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? '...' : 'Save'}
            </Button>
            <DialogClose disabled={isPending} asChild>
              <Button
                type="button"
                className="disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </Button>
            </DialogClose>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type FormTiers = {
  id: number;
  name: string;
  error: string;
}[];

type FormItems = {
  id: number;
  name: string;
  imageUrl: string;
  error: string;
}[];

function createFormTiers(tiers: TierList['tiers']): FormTiers {
  return tiers.map(({ name }, id) => ({ id, name, error: '' }));
}

function createFormItems(items: TierList['items']): FormItems {
  return Object.values(items).map(({ name, imageUrl }, id) => ({
    id,
    name,
    imageUrl: imageUrl ?? '',
    error: '',
  }));
}

function markDuplicates<T extends { name: string; error: string }>(
  items: T[],
  errorMessage: string
) {
  let didMark = false;
  const duplicateItems = new Map<string, T[]>();

  items.forEach((item) => {
    const duplicates = duplicateItems.get(item.name) ?? [];
    duplicates.push(item);
    duplicateItems.set(item.name, duplicates);
  });

  duplicateItems.forEach((items) => {
    if (items.length <= 1) return;
    items.forEach((item) => (item.error = errorMessage));
    didMark = true;
  });

  return didMark;
}
