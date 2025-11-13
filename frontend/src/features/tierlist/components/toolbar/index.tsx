import AddItemButton from '@/features/tierlist/components/toolbar/add-item-button';
import AddTierButton from '@/features/tierlist/components/toolbar/add-tier-button';
import ClearVotesButton from '@/features/tierlist/components/toolbar/clear-votes-button';
import FocusStatus from '@/features/tierlist/components/toolbar/focus-status';
import HardEditButton from '@/features/tierlist/components/toolbar/hard-edit-button';
import ResetButton from '@/features/tierlist/components/toolbar/reset-button';
import VotingSwitch from '@/features/tierlist/components/toolbar/voting-switch';
import { useTierList } from '@/features/tierlist/hooks/use-tier-list';

export default function Toolbar() {
  const { channel, isOwner, tierList } = useTierList();

  if (!isOwner) {
    return (
      <div className="bg-surface flex flex-wrap items-center gap-5 p-3 font-semibold">
        <div className="flex items-center">
          <a
            href={`https://www.twitch.tv/${channel?.name}`}
            target="_blank"
            className="hover:text-accent-light flex items-center gap-1 hover:underline"
          >
            <img
              src={channel?.imageUrl}
              alt="Channel Icon"
              className="inline-block size-6 object-cover"
            />
            {channel?.displayName}
          </a>
          's TierList
        </div>
        {tierList?.focus && (
          <div>
            Focused:{' '}
            <span className="bg-accent rounded-sm border-1 border-gray-900 p-1 text-sm font-semibold">
              {tierList.focus}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="bg-surface flex flex-wrap items-center gap-3 p-3">
        <AddTierButton />
        <AddItemButton />
        <HardEditButton />
        <VotingSwitch />
        <FocusStatus />
        <ClearVotesButton />
        <ResetButton />
      </div>
    </>
  );
}
