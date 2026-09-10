import { useEffect, useState } from 'react';
import { type CidadeAtendida, listarCidades } from './api';

export function useCidades() {
  const [cidades, setCidades] = useState<CidadeAtendida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    listarCidades()
      .then((data) => {
        if (active) setCidades(data);
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof Error ? err.message : 'Falha ao carregar cidades',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retryKey]);

  const retry = () => setRetryKey((k) => k + 1);

  return { cidades, loading, error, retry };
}
