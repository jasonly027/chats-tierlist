import { createFileRoute, useParams } from '@tanstack/react-router';

import ContentLayout from '@/components/layout/content-layout';
import TierListView from '@/features/tierlist/components/tier-list-view';

export const Route = createFileRoute('/$name')({
  component: TierListComponent,
});

function TierListComponent() {
  const { name } = useParams({ from: '/$name' });

  return (
    <ContentLayout>
      <TierListView name={name} />
    </ContentLayout>
  );
}
