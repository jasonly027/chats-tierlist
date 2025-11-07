import AddItemButton from '@/features/tierlist/components/toolbar/add-item-button';
import AddTierButton from '@/features/tierlist/components/toolbar/add-tier-button';
import ClearVotesButton from '@/features/tierlist/components/toolbar/clear-votes-button';
import FocusStatus from '@/features/tierlist/components/toolbar/focus-status';
import HardEditButton from '@/features/tierlist/components/toolbar/hard-edit-button';
import VotingSwitch from '@/features/tierlist/components/toolbar/voting-switch';

export default function Toolbar() {
  return (
    <>
      <div className="bg-surface flex flex-wrap items-center gap-3 p-3">
        <AddTierButton />
        <AddItemButton />
        <HardEditButton />
        <VotingSwitch />
        <FocusStatus />
        <ClearVotesButton />
      </div>
    </>
  );
}
