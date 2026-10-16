import { listarServicos, type ServicoMarketing } from './api';
import { useFetch } from './useFetch';

export function useServicos() {
  const { data, loading, error, retry } = useFetch<ServicoMarketing[]>(
    listarServicos,
    'Falha ao carregar serviços',
  );
  return { servicos: data, loading, error, retry };
}
