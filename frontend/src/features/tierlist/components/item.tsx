import type { Item } from '@/features/tierlist/types/tier-list';

export interface ItemProps {
  item: Item;
}

export default function Item({ item }: ItemProps) {
  return (
    <div
      className="relative flex size-24 items-end justify-end bg-cover bg-center"
      style={{
        backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined,
      }}
    >
      <span className="line-clamp-4 bg-black/50 text-center text-sm">
        {item.name}
      </span>
    </div>
  );
}
