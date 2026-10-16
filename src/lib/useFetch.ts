import { useEffect, useState } from 'react';

/** Hook genérico de busca com loading/error/retry. */
export function useFetch<T>(
  fetcher: () => Promise<T>,
  errorMsg: string,
): { data: T; loading: boolean; error: string | null; retry: () => void } {
  const [data, setData] = useState<T>([] as unknown as T);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetcher()
      .then((d) => {
        if (active) setData(d);
      })
      .catch((err) => {
        if (active)
          setError(err instanceof Error ? err.message : errorMsg);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey]);

  const retry = () => setRetryKey((k) => k + 1);

  return { data, loading, error, retry };
}
