import { Label } from '@radix-ui/react-label';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

import Button from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import Input from '@/components/ui/input';
import { useAddItem } from '@/features/tierlist/api/add-item';
import { useTierList } from '@/features/tierlist/hooks/use-tier-list';

export default function AddItemButton() {
  const [itemName, setItemName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState<string>('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);

  const { tierList } = useTierList();
  const { mutate, isPending } = useAddItem();

  if (!tierList) return;

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setItemName('');
        setImageUrl('');
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
      </DialogTrigger>
      <DialogContent
        disableClose={isPending}
        aria-describedby={undefined}
        className="max-w-125"
      >
        <DialogTitle>Add Item</DialogTitle>

        <form
          onSubmit={(e) => {
            e.preventDefault();

            const items = Object.values(tierList.items);
            if (items.length >= 500) {
              toast.error('Cannot have more than 500 items.');
              return;
            }
            if (items.find((i) => i.name === itemName)) {
              nameInputRef.current?.setCustomValidity(
                'Item name already in use'
              );
              nameInputRef.current?.reportValidity();
              return;
            }

            mutate(
              {
                data: {
                  name: itemName,
                  image_url: imageUrl !== '' ? imageUrl : null,
                },
              },
              {
                onSettled() {
                  setOpen(false);
                },
              }
            );
          }}
        >
          <fieldset className="mb-3 flex items-center gap-3">
            <Label htmlFor="itemName" className="w-[12ch]">
              Item Name *
            </Label>
            <Input
              id="itemName"
              name="itemName"
              type="text"
              minLength={1}
              maxLength={255}
              required
              ref={nameInputRef}
              value={itemName}
              onChange={(e) => {
                setItemName(e.target.value);
                nameInputRef.current?.setCustomValidity('');
              }}
              className="flex-1"
            />
          </fieldset>
          <fieldset className="mb-3 flex items-center gap-3">
            <Label htmlFor="imageUrl" className="w-[12ch]">
              Image URL
            </Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              type="url"
              ref={imageInputRef}
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                imageInputRef.current?.setCustomValidity('');
              }}
              className="flex-1"
            />
          </fieldset>

          <div className="flex justify-end gap-3">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-accent hover:bg-accent-light w-[6ch] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? '...' : 'Add'}
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
