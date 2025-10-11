import { createFileRoute } from '@tanstack/react-router';

import UserControl from '@/components/ui/user-control';
import { useUser } from '@/hooks/use-user';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <>
      <BallBackground />
      <main className="mx-4 flex h-screen flex-col place-content-center gap-4 sm:gap-6 md:mx-18 md:gap-8">
        <UserControl />
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
            <input
              className="focus:border-accent w-full rounded-xs border-2 border-gray-50 px-4 py-2 text-xl transition-colors duration-300 focus:outline-none"
              id="streamerName"
              type="text"
              placeholder="Twitch Channel Name"
            />
          </div>
        </article>
      </main>
    </>
  );
}

function BallBackground() {
  return (
    <div className="ballsContainer absolute -z-50">
      <div className="redBall top-[10vh] left-[20vw]"></div>
      <div className="greenBall top-[20vh] left-[50vw]"></div>
      <div className="yellowBall top-[65vh] left-[30vw]"></div>
    </div>
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
