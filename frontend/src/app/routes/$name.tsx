import { createFileRoute, useParams } from '@tanstack/react-router';

import ContentLayout from '@/components/layout/content-layout';
import { getTierListOptions } from '@/features/tierlist/api/get-tier-list';
import TierListView from '@/features/tierlist/components/tier-list-view';
import { TierListProvider } from '@/features/tierlist/providers/tier-list-provider';
import { queryClient } from '@/lib/react-query';

export const Route = createFileRoute('/$name')({
  component: TierListComponent,
  loader: (ctx) =>
    queryClient.ensureQueryData({
      ...getTierListOptions(ctx.params.name),
    }),
});

function TierListComponent() {
  const { name } = useParams({ from: '/$name' });

  return (
    <ContentLayout>
      <TierListProvider name={name}>
        <TierListView />
      </TierListProvider>
    </ContentLayout>
  );
}
