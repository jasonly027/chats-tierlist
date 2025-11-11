import { useState } from 'react';

import Button from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { useSetTierList } from '@/features/tierlist/api/set-tier-list';
import { useTierList } from '@/features/tierlist/hooks/use-tier-list';

export default function ResetButton() {
  const [open, setOpen] = useState(false);

  const { tierList } = useTierList();

  const { mutate, isPending } = useSetTierList();

  if (!tierList) return;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          Reset List
        </Button>
      </DialogTrigger>

      <DialogContent disableClose={isPending} className="max-w-75">
        <DialogTitle>Reset List</DialogTitle>
        <DialogDescription>
          Do you want to reset the tier list to its default state?
        </DialogDescription>

        <div className="flex flex-wrap justify-center gap-3">
          <Button
            disabled={isPending}
            onClick={() => {
              mutate(
                {
                  data: {
                    tier_list: {
                      tiers: {
                        S: {},
                        A: {},
                        B: {},
                        C: {},
                        D: {},
                      },
                      items: {},
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
            className="bg-danger hover:bg-danger-light w-[7ch] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? '...' : 'Reset'}
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
      </DialogContent>
    </Dialog>
  );
}
