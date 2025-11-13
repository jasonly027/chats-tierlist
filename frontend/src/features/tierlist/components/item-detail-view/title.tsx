import { Label } from '@radix-ui/react-label';
import { useEffect, useRef, useState } from 'react';

import Pencil from '@/components/ui/pencil';
import { useUpdateItem } from '@/features/tierlist/api/update-item';
import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import type { Item } from '@/features/tierlist/types/tier-list';
import { useStaticToast } from '@/hooks/use-static-toast';

export interface TitleProps {
  item: Item;
}

export default function Title({ item }: TitleProps) {
  const [name, setName, canOverwrite] = useDeferredText(item.name);

  const { tierList, isOwner } = useTierList();

  const { mutate } = useUpdateItem();

  const { setToast, clearToast } = useStaticToast('error');

  return (
    <div className="flex flex-row items-center justify-between gap-1">
      <input
        id="itemName"
        name="itemName"
        size={1}
        maxLength={255}
        value={name}
        onChange={(e) => {
          const newName = e.target.value;

          setName(newName);

          if (newName === '') {
            setToast('Item name cannot be empty');
          } else if (
            Object.values(tierList?.items ?? {}).find(
              (i) => i.name === newName && i.id !== item.id
            )
          ) {
            setToast('Item name already in use');
          } else {
            clearToast();
          }
        }}
        onFocus={() => (canOverwrite.current = false)}
        onBlur={() => {
          canOverwrite.current = true;

          if (name === item.name) return;
          if (
            name !== '' &&
            !Object.values(tierList?.items ?? {}).find(
              (i) => i.name === name && i.id !== item.id
            )
          ) {
            mutate({ id: item.id, data: { name } });
          } else {
            setName(item.name);
          }

          clearToast();
        }}
        disabled={!isOwner}
        className="ml-7 flex-1 text-center text-lg font-bold text-ellipsis"
      />
      {isOwner && (
        <Label
          htmlFor="itemName"
          className="hover:bg-surface-light cursor-pointer rounded-full p-1"
        >
          <Pencil />
          <span className="sr-only">Edit Item Name</span>
        </Label>
      )}
    </div>
  );
}

function useDeferredText(value: string) {
  const [text, setText] = useState(value);
  const canOverwrite = useRef(true);

  useEffect(
    function refreshOnNewValue() {
      if (canOverwrite.current) {
        // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
        setText(value);
      }
    },
    [value]
  );

  return [text, setText, canOverwrite] as const;
}
