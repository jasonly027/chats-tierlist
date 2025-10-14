import Logo from '@/components/ui/logo';
import { useTierList } from '@/features/tierlist/api/get-tier-list';

export default function TierListView({ name }: { name: string }) {
  const { data, isLoading } = useTierList({ name });

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
      <div></div>
    </>
  );
}
