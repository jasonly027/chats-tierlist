import { Link } from '@tanstack/react-router';
import { type ReactNode } from 'react';

import Background from '@/components/ui/background';
import Logo from '@/components/ui/logo';
import TierListSearchBar from '@/components/ui/tier-list-search';
import UserControl from '@/components/ui/user-control';

export interface ContentLayoutProps {
  children: ReactNode;
}

export default function ContentLayout({ children }: ContentLayoutProps) {
  return (
    <>
      <Background />
      <div className="flex flex-col">
        <NavigationBar />
        <div className="mb-24 sm:mx-[10%]">{children}</div>
      </div>
    </>
  );
}

function NavigationBar() {
  return (
    <nav className="flex w-full flex-col gap-4 border-b-1 border-gray-950 bg-gray-900 p-3 sm:flex-row sm:items-center">
      <div className="flex flex-1">
        <Link to={'/'} className="inline-block">
          <div className="bg-surface hover:bg-surface-light rounded-sm border-1 border-gray-950 p-2 transition-colors duration-300">
            <Logo size="sm" />
          </div>
        </Link>
      </div>
      <div className="flex flex-2 sm:justify-center">
        <TierListSearchBar className="max-w-96" />
      </div>
      <div className="flex flex-1 sm:justify-end">
        <UserControl />
      </div>
    </nav>
  );
}
