import Logo from '@/components/ui/logo';
import TierRow from '@/features/tierlist/components/tier-row';
import { useTierList } from '@/features/tierlist/hooks/use-tier-list';

export default function TierListView() {
  const { tierList, isLoading } = useTierList();

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
      <div className="flex w-full flex-col">
        {tierList?.tiers.map((tier, idx) => (
          <TierRow key={idx} tier={tier} />
        ))}
      </div>
    </>
  );
}
