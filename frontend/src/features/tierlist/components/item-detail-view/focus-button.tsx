import Button from '@/components/ui/button';
import { useUpdateTierList } from '@/features/tierlist/api/update-tier-list';
import { useTierList } from '@/features/tierlist/hooks/use-tier-list';

export interface FocusButtonProps {
  itemName: string;
}

export default function FocusButton({ itemName }: FocusButtonProps) {
  const { mutate } = useUpdateTierList();

  const { tierList } = useTierList();

  if (!tierList) return;

  const isFocused = itemName === tierList.focus;

  return (
    <Button
      className="w-[10ch] text-sm"
      onClick={() => mutate({ data: { focus: isFocused ? null : itemName } })}
    >
      {isFocused ? 'Unfocus' : 'Focus'}
    </Button>
  );
}
