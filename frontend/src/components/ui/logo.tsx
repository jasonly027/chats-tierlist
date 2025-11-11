import type { ClassNameValue } from 'tailwind-merge';

import { cn } from '@/utils/cn';

const sizes = {
  sm: 'size-6',
  md: 'size-9',
  lg: 'size-12',
} as const satisfies Record<string, ClassNameValue>;

export interface LogoProps {
  size?: keyof typeof sizes;
  className?: string;
}

export default function Logo({ size = 'md', className }: LogoProps) {
  return (
    <svg
      width="28"
      height="41"
      viewBox="0 0 28 41"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizes[size], className)}
    >
      <g clipPath="url(#clip0_5_8)">
        <path
          d="M27 7V26.4141L20.4141 33H14.3379L5.51855 38.3545L4 39.2773V33H1V7H27Z"
          fill="black"
          stroke="#A242FC"
          strokeWidth="2"
        />
        <rect x="5" y="25" width="4" height="4" rx="1" fill="#7FFF7F" />
        <rect x="12" y="25" width="4" height="4" rx="1" fill="#7FFF7F" />
        <path
          d="M21.5858 25H20C19.4477 25 19 25.4477 19 26V27.5858C19 28.4767 20.0771 28.9229 20.7071 28.2929L22.2929 26.7071C22.9229 26.0771 22.4767 25 21.5858 25Z"
          fill="#7FFF7F"
        />
        <rect x="5" y="18" width="4" height="4" rx="1" fill="#FFFF7F" />
        <rect x="12" y="18" width="4" height="4" rx="1" fill="#FFFF7F" />
        <rect x="5" y="11" width="4" height="4" rx="1" fill="#FF7F7F" />
        <rect x="12" y="11" width="4" height="4" rx="1" fill="#FF7F7F" />
        <rect x="19" y="11" width="4" height="4" rx="1" fill="#FF7F7F" />
      </g>
      <defs>
        <clipPath id="clip0_5_8">
          <rect width="28" height="41" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
