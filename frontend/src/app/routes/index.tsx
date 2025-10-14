import { createFileRoute } from '@tanstack/react-router';

import Background from '@/components/ui/background';
import TierListSearchBar from '@/components/ui/tier-list-search';
import UserControl from '@/components/ui/user-control';
import { useUser } from '@/hooks/use-user';

export const Route = createFileRoute('/')({
  component: IndexComponent,
});

function IndexComponent() {
  return (
    <>
      <Background />
      <div className="absolute top-5 right-5">
        <UserControl />
      </div>
      <main className="mx-4 flex min-h-screen flex-col place-content-center gap-4 sm:gap-6 md:mx-18 md:gap-8">
        <article>
          <h1 className="text-center font-[Lexend_Deca,_Arial] text-6xl font-semibold sm:text-7xl md:text-8xl">
            Chat's TierList
          </h1>
          <h2 className="text-center max-sm:mx-13 sm:text-lg md:text-xl">
            Create a tier list for your Twitch chat to vote on!
          </h2>
        </article>
        <article className="flex flex-col items-center">
          <EditTierListButton />
          <div className="mt-2 mb-1 text-lg font-semibold text-gray-400">
            or
          </div>
          <div className="w-full max-w-64 sm:max-w-96">
            <label
              htmlFor="streamerName"
              className="mb-1 ml-1 block font-semibold"
            >
              View a TierList
            </label>
            <TierListSearchBar className="sm:text-lg md:text-xl" />
          </div>
        </article>
      </main>
    </>
  );
}

function EditTierListButton() {
  const { user, logIn, isLoading } = useUser();

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={() => {
        if (user) {
          //
        } else {
          logIn();
        }
      }}
      className="bg-accent hover:text-accent w-[18ch] rounded-xs p-4 text-xl font-semibold transition-colors duration-300 hover:bg-gray-50"
    >
      {isLoading ? 'Loading...' : 'Edit Your TierList'}
    </button>
  );
}
