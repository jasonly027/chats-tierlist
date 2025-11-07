import ChatterPicker from '@/features/tierlist/components/item-detail-view/chatter-picker';
import DeleteButton from '@/features/tierlist/components/item-detail-view/delete-button';
import FocusButton from '@/features/tierlist/components/item-detail-view/focus-button';
import Image from '@/features/tierlist/components/item-detail-view/image';
import Title from '@/features/tierlist/components/item-detail-view/title';
import Votes from '@/features/tierlist/components/item-detail-view/votes';
import type { Item, TieredItem } from '@/features/tierlist/types/tier-list';

export interface ItemDetailViewProps {
  item?: Item | TieredItem;
}

export default function ItemDetailView({ item }: ItemDetailViewProps) {
  if (!item) {
    return (
      <div className="min-h-51 p-3">
        <h2 className="text-muted text-center text-lg font-bold">
          Select an item
        </h2>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col justify-center gap-3 p-4">
        <Title item={item} />
        <Image item={item} />
        <div className="flex items-center justify-center gap-1">
          <FocusButton itemName={item.name} />
          <DeleteButton itemId={item.id} />
        </div>
        {'stats' in item ? (
          <>
            <Votes item={item} />
            <ChatterPicker stats={item.stats} votes={item.votes} />
          </>
        ) : (
          <p className="text-muted text-center">
            No votes for this item at the moment...
          </p>
        )}
      </div>
    </>
  );
}
