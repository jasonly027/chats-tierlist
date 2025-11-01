import { Label } from '@radix-ui/react-label';
import { useRef, useState } from 'react';

import Button from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Input from '@/components/ui/input';
import Trash from '@/components/ui/trash';
import { useAddTier } from '@/features/tierlist/hooks/use-add-tier';
import { useTierList } from '@/features/tierlist/hooks/use-tier-list';

export default function Toolbar() {
  return (
    <>
      <div className="bg-surface flex flex-wrap items-center gap-3 p-3">
        <AddTierButton />
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
              d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 6h.008v.008H6V6Z"
            />
          </svg>
          Add Item
        </Button>
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
        <Button className="bg-danger hover:bg-danger-light flex items-center gap-1 text-sm">
          <Trash />
          Reset Votes
        </Button>
      </div>
    </>
  );
}

function AddTierButton() {
  const [tierName, setTierName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);

  const { tierList } = useTierList();
  const { mutate, isPending } = useAddTier();

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setTierName('');
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
              d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5"
            />
          </svg>
          Add Tier
        </Button>
      </DialogTrigger>
      <DialogContent
        disableClose={isPending}
        aria-describedby={undefined}
        className="max-w-125"
      >
        <DialogTitle>Add Tier</DialogTitle>

        <form
          onSubmit={(e) => {
            e.preventDefault();

            if (tierList?.tiers.find((t) => t.name === tierName)) {
              inputRef.current?.setCustomValidity('Tier name already exists');
              inputRef.current?.reportValidity();
              return;
            }

            mutate(
              { data: { name: tierName, color: 'blue' } },
              {
                onSettled() {
                  setOpen(false);
                },
              }
            );
          }}
        >
          <fieldset className="mb-3 flex items-center gap-3">
            <Label htmlFor="tierName">Tier Name</Label>
            <Input
              id="tierName"
              type="text"
              minLength={1}
              maxLength={255}
              required
              ref={inputRef}
              value={tierName}
              onChange={(e) => {
                setTierName(e.target.value);
                inputRef.current?.setCustomValidity('');
              }}
              className="flex-1"
            />
          </fieldset>

          <div className="flex justify-end gap-3">
            <Button
              type="submit"
              disabled={isPending}
              className="w-[6ch] bg-sky-800 hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? '...' : 'Add'}
            </Button>
            <DialogClose disabled={isPending} asChild>
              <Button
                type="button"
                className="bg-slate-700 hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
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
