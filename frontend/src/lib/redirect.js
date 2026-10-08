import { useSearchParams } from 'react-router-dom';

// Reads the "next" page from the URL, but only allows paths inside this site.
export function useNextPath() {
  const [params] = useSearchParams();
  const next = params.get('next');
  const safe = next && next.startsWith('/') && !next.startsWith('//') ? next : null;
  return { next: safe, suffix: safe ? `?next=${encodeURIComponent(safe)}` : '' };
}
