import Button from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';
import { useUser } from '@/hooks/use-user';
import type { User } from '@/types/api';

export default function UserControl() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <Skeleton className="h-8 w-39" />;
  }

  if (!user) {
    return <LogInButton />;
  }

  return <User user={user} />;
}

function LogInButton() {
  const { logIn } = useUser();

  return (
    <Button
      className="flex flex-row items-center gap-px border-1 border-gray-950"
      type="button"
      onClick={logIn}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        stroke="currentColor"
        fill="currentColor"
        viewBox="0 0 24 24"
        className="size-4"
      >
        <path d="M10,17V14H3V10H10V7L15,12L10,17M10,2H19A2,2 0 0,1 21,4V20A2,2 0 0,1 19,22H10A2,2 0 0,1 8,20V18H10V20H19V4H10V6H8V4A2,2 0 0,1 10,2Z" />
      </svg>
      <span className="truncate text-sm">Log In With Twitch</span>
    </Button>
  );
}

interface UserProps {
  user: User;
}

function User({ user }: UserProps) {
  const { logOut } = useUser();

  return (
    <div className="flex flex-row items-center justify-center gap-2 font-semibold sm:text-lg">
      <img
        src={user.imageUrl}
        className="size-7 rounded-full select-none"
        draggable="false"
      />
      <div>{user.displayName}</div>
      <div className="w-px self-stretch bg-current select-none" />
      <button
        type="button"
        onClick={logOut}
        className="hover:text-accent transition-colors duration-300"
      >
        Log Out
      </button>
    </div>
  );
}
