import { Label } from '@radix-ui/react-label';
import * as Switch from '@radix-ui/react-switch';

import { useUpdateTierList } from '@/features/tierlist/api/update-tier-list';
import { useTierList } from '@/features/tierlist/hooks/use-tier-list';

export default function VotingSwitch() {
  const { tierList } = useTierList();

  const { mutate } = useUpdateTierList();

  if (!tierList) return;

  return (
    <div className="flex items-center gap-1">
      <Label
        htmlFor="isVoting"
        className="w-[13ch] text-center text-sm font-semibold"
      >
        Voting {tierList.isVoting ? 'Enabled' : 'Disabled'}
      </Label>
      <Switch.Root
        id="isVoting"
        checked={tierList.isVoting}
        onCheckedChange={(checked) => mutate({ data: { is_voting: checked } })}
        className="data-[state=checked]:bg-accent data-[state=unchecked]:bg-danger-light h-[1.75em] w-[45px] rounded-full border-2 border-gray-900 bg-slate-700 transition-colors duration-300"
      >
        <Switch.Thumb className="box-border block size-[18px] translate-x-1 rounded-full border-2 border-current transition-transform will-change-transform data-[state=checked]:translate-x-[20px]" />
      </Switch.Root>
    </div>
  );
}
