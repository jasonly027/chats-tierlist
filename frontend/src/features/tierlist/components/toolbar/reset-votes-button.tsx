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
import Trash from '@/components/ui/trash';
import { tierListToDto } from '@/features/tierlist/api/get-tier-list';
import { useSetTierList } from '@/features/tierlist/hooks/use-set-tier-list';
import { useTierList } from '@/features/tierlist/hooks/use-tier-list';

export default function ResetVotesButton() {
  const [open, setOpen] = useState(false);

  const { tierList } = useTierList();

  const { mutate, isPending } = useSetTierList();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-danger hover:bg-danger-light flex items-center gap-1 text-sm">
          <Trash />
          Reset Votes
        </Button>
      </DialogTrigger>

      <DialogContent disableClose={isPending} className="max-w-75">
        <DialogTitle>Reset Votes</DialogTitle>
        <DialogDescription>
          Do you want to clear ALL votes currently submitted?
        </DialogDescription>

        <div className="flex flex-wrap justify-center gap-3">
          <Button
            disabled={isPending}
            onClick={() => {
              if (!tierList) return;

              mutate(
                {
                  data: {
                    tier_list: tierListToDto(tierList),
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
