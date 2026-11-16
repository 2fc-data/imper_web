import { useCallback, useEffect, useState } from 'react';
import CatalogosOperacionais from '../components/CatalogosOperacionais';
import { CatalogosPayload, listarCatalogos } from '../lib/api';

export function CatalogosPage() {
  const [payload, setPayload] = useState<CatalogosPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const carregarCatalogos = useCallback(async () => {
    setError(null);
    try {
      const data = await listarCatalogos();
      setPayload(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao carregar catálogos',
      );
    }
  }, []);

  useEffect(() => {
    carregarCatalogos();
  }, [carregarCatalogos]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Catálogos & Parâmetros
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestão centralizada de cadastros auxiliares para equipamentos, EPIs e
          materiais.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {payload && (
        <CatalogosOperacionais
          payload={payload}
          relerLookups={carregarCatalogos}
        />
      )}
    </div>
  );
}
