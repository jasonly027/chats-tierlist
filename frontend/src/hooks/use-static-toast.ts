import { useMemo, useRef } from 'react';
import toast, { type ToastOptions } from 'react-hot-toast';

export function useStaticToast(
  kind?: 'success' | 'error' | 'custom' | 'loading'
) {
  const toastId = useRef<string>(null);

  return useMemo(() => {
    const toastFn = kind ? toast[kind] : toast;

    const clearToast = () => {
      if (toastId.current) {
        toast.dismiss(toastId.current);
        toastId.current = null;
      }
    };

    const setToast = (text: string, options?: ToastOptions) => {
      clearToast();
      toastId.current = toastFn(text, { duration: Infinity, ...options });
    };

    return {
      setToast,
      clearToast,
    };
  }, [kind]);
}
