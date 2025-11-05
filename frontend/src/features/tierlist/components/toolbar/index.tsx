import AddItemButton from '@/features/tierlist/components/toolbar/add-item-button';
import AddTierButton from '@/features/tierlist/components/toolbar/add-tier-button';
import HardEditButton from '@/features/tierlist/components/toolbar/hard-edit-button';
import ResetVotesButton from '@/features/tierlist/components/toolbar/reset-votes-button';

export default function Toolbar() {
  return (
    <>
      <div className="bg-surface flex flex-wrap items-center gap-3 p-3">
        <AddTierButton />
        <AddItemButton />
        <HardEditButton />
        <ResetVotesButton />
      </div>
    </>
  );
}
