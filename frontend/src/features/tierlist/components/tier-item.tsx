import type { TieredItem } from '@/features/tierlist/types/tier-list';

export interface TierItemProps {
  item: TieredItem;
}

export default function TierItem({ item }: TierItemProps) {
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
