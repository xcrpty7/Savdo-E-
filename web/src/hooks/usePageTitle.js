import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | Savdo-E`;
    }
    return () => {
      document.title = 'Savdo-E';
    };
  }, [title]);
}
