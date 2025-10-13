import { createFileRoute } from '@tanstack/react-router';

import Background from '@/components/layout/background';
import UserControl from '@/components/ui/user-control';

export const Route = createFileRoute('/$name')({
  component: TierListComponent,
});

function TierListComponent() {
  return (
    <>
      <Background />
      <NavigationBar />
    </>
  );
}

function NavigationBar() {
  return (
    <nav className="flex w-full flex-col justify-between gap-4 bg-gray-900 p-3 sm:flex-row sm:items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        className="size-8 stroke-gray-50"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
        />
      </svg>
      <SearchBar />
      <UserControl />
    </nav>
  );
}

function SearchBar() {
  return (
    <div className="focus-within:border-accent group flex max-w-140 flex-1 items-center rounded-sm border-1 border-gray-300 transition-colors duration-300">
      <input
        type="text"
        placeholder="View a different channel"
        size={1}
        className="text-semibold flex-1 overflow-hidden px-2 py-1 text-lg focus:outline-0"
      />
      <div className="group-focus-within:bg-accent w-px self-stretch bg-gray-300 duration-300" />
      <button type="button">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="group-focus-within:stroke-accent m-1 size-6 stroke-gray-300 stroke-2 duration-300"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      </button>
    </div>
  );
}
