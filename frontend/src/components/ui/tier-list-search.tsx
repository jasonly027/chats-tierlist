import { useNavigate } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';

import { cn } from '@/utils/cn';

export interface TierListSearchBarProps {
  className?: string;
}

export default function TierListSearchBar({
  className,
}: TierListSearchBarProps) {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (name) {
      void navigate({ to: '/$name', params: { name } }).then(() => setName(''));
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'focus-within:border-accent group flex w-full items-center rounded-sm border-1 border-current transition-colors duration-300',
        className
      )}
    >
      <input
        id="streamerName"
        name="twitchChannel"
        type="text"
        placeholder="Enter Twitch Channel"
        size={1}
        className="flex-1 overflow-hidden p-1 px-2 focus:outline-0"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="group-focus-within:bg-accent w-px self-stretch bg-current duration-300" />
      <button type="submit">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="group-focus-within:stroke-accent m-1 size-6 stroke-2 duration-300"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <span className="sr-only">Search Channel</span>
      </button>
    </form>
  );
}
