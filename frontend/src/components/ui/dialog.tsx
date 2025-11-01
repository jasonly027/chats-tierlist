import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/utils/cn';

export const Dialog = DialogPrimitive.Root;

export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogClose = DialogPrimitive.Close;

const DialogPortal = DialogPrimitive.Portal;

export function DialogTitle({
  className,
  ...props
}: ComponentPropsWithRef<typeof DialogPrimitive.DialogTitle>) {
  return (
    <DialogPrimitive.Title
      className={cn('mb-3 text-lg font-bold', className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentPropsWithRef<typeof DialogPrimitive.DialogDescription>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-muted mb-3', className)}
      {...props}
    />
  );
}

type DialogContentProps = ComponentPropsWithRef<
  typeof DialogPrimitive.DialogContent
> & { disableClose?: boolean };

export function DialogContent({
  disableClose,
  onInteractOutside,
  onEscapeKeyDown,
  className,
  children,
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogPrimitive.Overlay className="data-[state=open]:animate-fadeIn fixed inset-0 grid place-items-center overflow-y-auto bg-black/30">
        <DialogPrimitive.Content
          onInteractOutside={(e) => {
            onInteractOutside?.(e);

            if (disableClose) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            onEscapeKeyDown?.(e);

            if (disableClose) {
              e.preventDefault();
            }
          }}
          className={cn(
            'bg-surface relative w-[90vw] rounded-sm border-1 border-black p-4',
            className
          )}
          {...props}
        >
          {children}

          <DialogClose
            disabled={disableClose}
            className="hover:bg-surface-light absolute top-2 right-2 rounded-full p-px transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
              <span className="sr-only">Close Window</span>
            </svg>
          </DialogClose>
        </DialogPrimitive.Content>
      </DialogPrimitive.Overlay>
    </DialogPortal>
  );
}
