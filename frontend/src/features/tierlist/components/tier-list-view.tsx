import ContentEditable from 'react-contenteditable';

import Logo from '@/components/ui/logo';
import { useTierList } from '@/features/tierlist/api/get-tier-list';
import type { Tier } from '@/features/tierlist/types/tier-list';
import { useUpdateTier } from '@/lib/gen/endpoints/tier-list/tier-list';

export default function TierListView({ name }: { name: string }) {
  const { data: tierList, isLoading } = useTierList({ name });

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Logo className="animate-spin" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  return (
    <>
      <div>
        {tierList?.tiers.map((tier) => (
          <TierListRow key={tier.name} tier={tier} />
        ))}
      </div>
    </>
  );
}

export interface TierListRowProps {
  tier: Tier;
}

function TierListRow({ tier }: TierListRowProps) {
  const updateTierMutation = useUpdateTier();

  return (
    <div className="flex flex-row">
      <ContentEditable
        html={tier.name}
        onChange={(e) => {
          const newName = e.target.value;

          updateTierMutation.mutate({
            name: tier.name,
            data: { name: newName },
          });
          tier.name = newName;
        }}
        style={{ backgroundColor: tier.color }}
        className="flex min-h-24 w-24 items-center justify-center text-center wrap-anywhere"
      />
    </div>
  );
}
