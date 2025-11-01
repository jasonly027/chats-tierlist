import type { Item } from '@/features/tierlist/types/tier-list';

export interface ItemThumbProps {
  item: Item;
}

export default function ItemThumb({ item }: ItemThumbProps) {
  const hasImage = item.imageUrl;

  return (
    <div
      style={{
        backgroundImage: hasImage ? `url(${item.imageUrl})` : undefined,
        justifyContent: hasImage ? 'end' : 'center',
        alignItems: hasImage ? 'end' : 'center',
      }}
      className="relative flex size-24 items-end justify-end border-r-1 border-gray-950 bg-gray-700 bg-cover bg-center select-text"
    >
      <span
        className={`${hasImage ? 'bg-black/50' : ''} line-clamp-4 text-center text-sm font-semibold wrap-anywhere`}
      >
        {item.name}
      </span>
    </div>
  );
}
