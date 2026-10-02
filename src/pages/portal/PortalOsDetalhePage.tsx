import { useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import type { EtapaPortal, OsPortalDetalhe } from '../../lib/api';
import { obterOsPortal } from '../../lib/api';

function formatarMoeda(valor: string | number): string {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR');
}

function resumoProgresso(os: OsPortalDetalhe): ReactNode {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${os.progresso}%` }}
        />
      </div>
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        {os.etapasConcluidas}/{os.totalEtapas} etapas ({os.progresso}%)
      </span>
    </div>
  );
}

export default function PortalOsDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const numeroId = Number(id);
  const [os, setOs] = useState<OsPortalDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(numeroId) || numeroId <= 0) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    obterOsPortal(numeroId)
      .then((dados) => {
        if (active) setOs(dados);
      })
      .catch((err) => {
        if (!active) return;
        const status = (err as { status?: number }).status;
        if (status === 404) {
          setNaoEncontrado(true);
        } else {
          setError(err instanceof Error ? err.message : 'Erro ao carregar');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [numeroId]);

  if (!Number.isFinite(numeroId) || numeroId <= 0) {
    return <Navigate to="/portal/os" replace />;
  }

  const etapas = os ? [...os.etapas].sort((a, b) => a.ordem - b.ordem) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        to="/portal/os"
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← Voltar para ordens de serviço
      </Link>

      {loading && (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      )}

      {!loading && naoEncontrado && (
        <div className="space-y-3 rounded-md bg-destructive/10 px-3 py-3 text-sm text-destructive">
          <p>Ordem de serviço não encontrada.</p>
          <Link to="/portal/os" className="font-medium underline">
            Voltar para ordens de serviço
          </Link>
        </div>
      )}

      {!loading && error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {!loading && !error && !naoEncontrado && os && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold">{os.codigo}</h1>
            <StatusBadge status={os.status} />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <span className="text-muted-foreground">Valor total: </span>
                <span className="font-semibold">
                  {formatarMoeda(os.valorTotal)}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">
                  Início previsto:{' '}
                </span>
                {formatarData(os.dataInicioPrevista)}
              </p>
              <p>
                <span className="text-muted-foreground">Técnico: </span>
                {os.tecnicoResponsavel?.nome ?? '—'}
              </p>
              <p>
                <span className="text-muted-foreground">Endereço: </span>
                {os.endereco ?? '—'}
              </p>
              <div>
                <div className="mb-1 text-muted-foreground">Progresso</div>
                {resumoProgresso(os)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Etapas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {etapas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma etapa cadastrada.
                </p>
              ) : (
                <ol className="space-y-3">
                  {etapas.map((etapa: EtapaPortal) => (
                    <li
                      key={etapa.id}
                      className="rounded-md border bg-background p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-foreground">
                          {etapa.ordem}. {etapa.nome}
                        </span>
                        <StatusBadge status={etapa.status} size="sm" />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Início: {formatarData(etapa.dataInicioReal)} — Fim:{' '}
                        {formatarData(etapa.dataFimReal)}
                      </div>
                      {etapa.atividadesOS.length > 0 && (
                        <ul className="mt-2 space-y-1 border-t pt-2">
                          {etapa.atividadesOS.map((atividade) => (
                            <li
                              key={atividade.id}
                              className="flex flex-wrap items-center justify-between gap-2 text-xs"
                            >
                              <span className="text-muted-foreground">
                                • {atividade.catalogoAtividade?.nome ?? '—'}
                              </span>
                              <StatusBadge
                                status={atividade.status}
                                size="sm"
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
