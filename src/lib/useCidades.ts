import { useEffect, useState } from 'react';
import { type CidadeAtendida, listarCidades } from './api';

export function useCidades() {
  const [cidades, setCidades] = useState<CidadeAtendida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
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
  }, []);

  return { cidades, loading, error };
}
