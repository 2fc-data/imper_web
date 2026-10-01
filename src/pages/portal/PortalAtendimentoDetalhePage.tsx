import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import type { AtendimentoPortalDetalhe } from '../../lib/api';
import { obterAtendimentoPortal } from '../../lib/api';
import { ROTULOS_STATUS } from '../../lib/atendimento-status';

function rotuloStatus(status: string): string {
  return (
    ROTULOS_STATUS[status as keyof typeof ROTULOS_STATUS] ?? status
  );
}

export default function PortalAtendimentoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const numeroId = Number(id);
  const [atendimento, setAtendimento] =
    useState<AtendimentoPortalDetalhe | null>(null);
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
    obterAtendimentoPortal(numeroId)
      .then((dados) => {
        if (active) setAtendimento(dados);
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
    return <Navigate to="/portal/atendimentos" replace />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        to="/portal/atendimentos"
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← Voltar para atendimentos
      </Link>

      {loading && (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      )}

      {!loading && naoEncontrado && (
        <div className="space-y-3 rounded-md bg-destructive/10 px-3 py-3 text-sm text-destructive">
          <p>Atendimento não encontrado.</p>
          <Link to="/portal/atendimentos" className="font-medium underline">
            Voltar para atendimentos
          </Link>
        </div>
      )}

      {!loading && error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {!loading && !error && !naoEncontrado && atendimento && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold">
              Atendimento #{atendimento.id}
            </h1>
            <StatusBadge
              status={atendimento.status}
              labelOverride={rotuloStatus(atendimento.status)}
            />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Dados gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Descrição: </span>
                {atendimento.descricao ?? '—'}
              </p>
              <p>
                <span className="text-muted-foreground">Canal: </span>
                {atendimento.canal}
              </p>
              <p>
                <span className="text-muted-foreground">Urgência: </span>
                {atendimento.urgencia ?? '—'}
              </p>
              <p>
                <span className="text-muted-foreground">Cliente: </span>
                {atendimento.user?.nome ?? '—'}
                {atendimento.user?.telefone
                  ? ` (${atendimento.user.telefone})`
                  : ''}
              </p>
              <p>
                <span className="text-muted-foreground">Criado em: </span>
                {new Date(atendimento.createdAt).toLocaleString('pt-BR')}
              </p>
              <p>
                <span className="text-muted-foreground">
                  Atualizado em:{' '}
                </span>
                {new Date(atendimento.updatedAt).toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              {atendimento.logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum registro ainda.
                </p>
              ) : (
                <ul className="space-y-2">
                  {atendimento.logs.map((log) => (
                    <li
                      key={log.id}
                      className="space-y-1 rounded-md border bg-background p-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">
                          {log.tipo === 'STATUS'
                            ? `Status: ${rotuloStatus(log.statusDe ?? '—')} → ${rotuloStatus(log.statusPara ?? '—')}`
                            : 'Atendimento'}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      {log.tipo === 'TEXTO' && log.descricao && (
                        <p className="whitespace-pre-wrap text-muted-foreground">
                          {log.descricao}
                        </p>
                      )}
                      <div className="text-muted-foreground">
                        por {log.atendente?.nome ?? 'Sistema'}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
