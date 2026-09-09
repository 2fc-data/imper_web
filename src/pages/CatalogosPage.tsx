import { useCallback, useEffect, useState } from 'react';
import { CatalogosOperacionais } from '../components/CatalogosOperacionais';
import {
  type EpiLookups,
  type EquipamentoLookups,
  listarLookupsEpis,
  listarLookupsEquipamentos,
  listarLookupsMateriais,
  type MaterialLookups,
} from '../lib/api';

type Tab = 'EQUIPAMENTO' | 'EPI' | 'MATERIAIS';

const TAB_LABELS: Record<Tab, string> = {
  EQUIPAMENTO: 'Equipamentos',
  EPI: 'EPIs',
  MATERIAIS: 'Materiais',
};

export function CatalogosPage() {
  const [tab, setTab] = useState<Tab>('EQUIPAMENTO');
  const [lookupsEquipamento, setLookupsEquipamento] =
    useState<EquipamentoLookups | null>(null);
  const [lookupsEpi, setLookupsEpi] = useState<EpiLookups | null>(null);
  const [lookupsMaterial, setLookupsMaterial] =
    useState<MaterialLookups | null>(null);
  const [error, setError] = useState<string | null>(null);

  const carregarEquipamento = useCallback(async () => {
    setError(null);
    try {
      setLookupsEquipamento(await listarLookupsEquipamentos());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao carregar catálogos',
      );
    }
  }, []);

  const carregarEpi = useCallback(async () => {
    setError(null);
    try {
      setLookupsEpi(await listarLookupsEpis());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao carregar catálogos',
      );
    }
  }, []);

  const carregarMaterial = useCallback(async () => {
    setError(null);
    try {
      setLookupsMaterial(await listarLookupsMateriais());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao carregar catálogos',
      );
    }
  }, []);

  useEffect(() => {
    if (tab === 'EQUIPAMENTO') carregarEquipamento();
    else if (tab === 'EPI') carregarEpi();
    else carregarMaterial();
  }, [tab, carregarEquipamento, carregarEpi, carregarMaterial]);

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

      <div className="flex gap-1 rounded-lg border bg-muted p-1">
        {(['EQUIPAMENTO', 'EPI', 'MATERIAIS'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {tab === 'EQUIPAMENTO' && (
        <CatalogosOperacionais
          modulo="EQUIPAMENTO"
          lookups={lookupsEquipamento}
          relerLookups={carregarEquipamento}
          ocultarTitulo
        />
      )}

      {tab === 'EPI' && (
        <CatalogosOperacionais
          modulo="EPI"
          lookups={lookupsEpi}
          relerLookups={carregarEpi}
          ocultarTitulo
        />
      )}

      {tab === 'MATERIAIS' && (
        <CatalogosOperacionais
          modulo="MATERIAIS"
          lookups={lookupsMaterial}
          relerLookups={carregarMaterial}
          ocultarTitulo
        />
      )}
    </div>
  );
}
