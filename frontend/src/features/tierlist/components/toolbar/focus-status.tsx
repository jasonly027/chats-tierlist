import { Label } from '@radix-ui/react-label';

import Button from '@/components/ui/button';
import Cross from '@/components/ui/cross';
import { useUpdateTierList } from '@/features/tierlist/api/update-tier-list';
import { useTierList } from '@/features/tierlist/hooks/use-tier-list';

export default function FocusStatus() {
  const { tierList } = useTierList();

  const { mutate } = useUpdateTierList();

  if (!tierList || tierList.focus === null) return;

  return (
    <div className="text-sm font-semibold">
      <Label htmlFor="removeFocus" onClick={(e) => e.preventDefault()}>
        Focused:
      </Label>
      <Button
        id="removeFocus"
        type="button"
        onClick={() => mutate({ data: { focus: null } })}
        className="bg-accent hover:bg-accent ml-1 inline-flex items-center gap-1 py-1 pr-1 pl-1.5"
      >
        {tierList.focus}
        <div>
          <Cross className="size-5" />
          <span className="sr-only">Remove focus</span>
        </div>
      </Button>
    </div>
  );
}
