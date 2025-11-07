import { useState } from 'react';

import Button from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Trash from '@/components/ui/trash';
import { useDeleteItem } from '@/features/tierlist/api/delete-item';

export interface DeleteItemButtonProps {
  itemId: string;
}

export default function DeleteButton({ itemId }: DeleteItemButtonProps) {
  const [open, setOpen] = useState(false);

  const { mutate } = useDeleteItem();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-1 text-sm">
          <Trash />
          <span className="sr-only">Delete Item</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-75">
        <DialogTitle>Delete Item</DialogTitle>
        <DialogDescription>
          Do you want to permanently delete this item from the tier list?
        </DialogDescription>

        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={() => {
              mutate({ id: itemId });
              setOpen(false);
            }}
            className="bg-danger hover:bg-danger-light"
          >
            Delete
          </Button>
          <DialogClose asChild>
            <Button>Cancel</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
