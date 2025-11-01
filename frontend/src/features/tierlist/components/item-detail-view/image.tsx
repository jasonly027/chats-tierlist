import { Label } from '@radix-ui/react-label';
import { useRef, useState } from 'react';

import Button from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Input from '@/components/ui/input';
import Pencil from '@/components/ui/pencil';
import { useUpdateItem } from '@/features/tierlist/hooks/use-update-item';
import type { Item } from '@/features/tierlist/types/tier-list';

export default function Image({ item }: { item: Item }) {
  return (
    <div className="flex justify-center">
      <div className="relative size-50">
        {item.imageUrl ? (
          <img
            src={item.imageUrl ?? undefined}
            alt="Item Image"
            className="size-full rounded-sm object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center rounded-sm border-1 border-gray-400 text-gray-400 select-none">
            No Image Provided
          </div>
        )}

        <EditDialog item={item} />
      </div>
    </div>
  );
}

function EditDialog({ item }: { item: Item }) {
  const [input, setInput] = useState(item.imageUrl ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutate } = useUpdateItem();

  const [open, setOpen] = useState(false);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(open) => {
          setInput(item.imageUrl ?? '');
          setOpen(open);
        }}
      >
        <DialogTrigger asChild>
          <button
            type="button"
            className="hover:bg-surface-light/50 bg-surface/50 absolute top-1 right-1 rounded-full p-1 transition-colors duration-300"
          >
            <Pencil />
            <span className="sr-only">Edit Image URL</span>
          </button>
        </DialogTrigger>

        <DialogContent className="max-w-125">
          <DialogTitle>Edit Item Image</DialogTitle>
          <DialogDescription>
            Sorry! In order to reduce server costs, there is no option to upload
            image files. Please provide the URL to an already hosted image.
          </DialogDescription>

          <form
            onSubmit={(e) => {
              e.preventDefault();

              const imageUrl = input !== '' ? input : null;
              if (imageUrl !== item.imageUrl) {
                mutate({ id: item.id, data: { image_url: imageUrl } });
              }

              setOpen(false);
            }}
          >
            <fieldset className="mb-3 flex items-center gap-3">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1"
              />
            </fieldset>
            <div className="flex justify-end gap-3">
              <Button type="submit" className="bg-sky-800 hover:bg-sky-700">
                Save
              </Button>
              <DialogClose asChild>
                <Button
                  type="button"
                  className="bg-slate-700 hover:bg-slate-600"
                >
                  Cancel
                </Button>
              </DialogClose>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
