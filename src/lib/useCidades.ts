import { type CidadeAtendida, listarCidades } from './api';
import { useFetch } from './useFetch';

export function useCidades() {
  const { data, loading, error, retry } = useFetch<CidadeAtendida[]>(
    listarCidades,
    'Falha ao carregar cidades',
  );
  return { cidades: data, loading, error, retry };
}
