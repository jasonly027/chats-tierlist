import type { TieredItem } from '@/features/tierlist/types/tier-list';

export interface TierItemProps {
  item: TieredItem;
}

export default function TierItem({ item }: TierItemProps) {
  return (
    <div
      className="relative flex size-20 justify-center bg-cover bg-center"
      style={{
        backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined,
      }}
    >
      <span className="bg-black/50 text-center text-xs">{item.name}</span>
    </div>
  );
}
