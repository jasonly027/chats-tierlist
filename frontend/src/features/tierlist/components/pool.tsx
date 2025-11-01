import type { Dispatch, SetStateAction } from 'react';

import ItemThumb from '@/features/tierlist/components/item-thumb';
import type { Item } from '@/features/tierlist/types/tier-list';

export interface PoolProps {
  items: Item[];
  setDetailedItemId: Dispatch<SetStateAction<string | undefined>>;
}

export default function Pool({ items, setDetailedItemId }: PoolProps) {
  return (
    <>
      <div className="flex flex-wrap">
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => setDetailedItemId(item.id)}
          >
            <ItemThumb key={item.id} item={item} />
          </button>
        ))}
      </div>
    </>
  );
}
