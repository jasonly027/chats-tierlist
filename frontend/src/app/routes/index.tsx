import { createFileRoute } from '@tanstack/react-router';

import { env } from '@/config/env';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <>
      <BallBackground />
      <main className="mx-4 flex h-screen flex-col place-content-center gap-4 sm:gap-6 md:mx-18 md:gap-8">
        <LogInButton />
        <article>
          <h1 className="text-center font-[Lexend_Deca,_Arial] text-6xl font-semibold sm:text-7xl md:text-8xl">
            Chat's TierList
          </h1>
          <h2 className="text-center max-sm:mx-13 sm:text-lg md:text-xl">
            Create a tier list for your Twitch chat to vote on!
          </h2>
        </article>
        <article className="flex flex-col items-center">
          <button
            type="button"
            className="w-fit rounded-xs bg-violet-600 p-4 text-xl font-semibold transition-colors duration-300 hover:bg-gray-50 hover:text-violet-600"
          >
            Edit Your TierList
          </button>
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
              className="w-full rounded-xs border-2 border-gray-50 px-4 py-2 text-xl transition-colors duration-300 focus:border-violet-600 focus:outline-none"
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

function LogInButton() {
  return (
    <a
      className="absolute top-4 right-4 flex flex-row items-center gap-px fill-gray-50 p-1 font-semibold transition-colors duration-300 select-none hover:fill-violet-600 hover:text-violet-600 md:text-lg"
      draggable={false}
      href={env.LOGIN_URL}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        id="mdi-login"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className="inline"
      >
        <path d="M10,17V14H3V10H10V7L15,12L10,17M10,2H19A2,2 0 0,1 21,4V20A2,2 0 0,1 19,22H10A2,2 0 0,1 8,20V18H10V20H19V4H10V6H8V4A2,2 0 0,1 10,2Z" />
      </svg>
      Log In With Twitch
    </a>
  );
}
