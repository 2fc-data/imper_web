import { useEffect, useState } from 'react';
import { listarServicos, type ServicoMarketing } from './api';

export function useServicos() {
  const [servicos, setServicos] = useState<ServicoMarketing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listarServicos()
      .then((data) => {
        if (active) setServicos(data);
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof Error ? err.message : 'Falha ao carregar serviços',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { servicos, loading, error };
}
