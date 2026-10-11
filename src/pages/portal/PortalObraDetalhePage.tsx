import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import type {
  EnderecoPortal,
  ObraPortalDetalhe,
} from '../../lib/api';
import { obterObraPortal } from '../../lib/api';
import {
  progressoObra,
  statusAtividadePortal,
} from './PortalObrasPage';

function formatarMoeda(valor: string | number): string {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatarEndereco(endereco: EnderecoPortal | null): string {
  if (!endereco) return '—';
  const partes = [endereco.logradouro, endereco.numero].filter(Boolean);
  const cidadeUf = [endereco.cidade, endereco.estado]
    .filter(Boolean)
    .join('/');
  return [partes.join(', '), endereco.bairro, cidadeUf]
    .filter(Boolean)
    .join(' — ');
}

function resumoProgresso(obra: ObraPortalDetalhe): React.ReactNode {
  const { concluidas, total, percentual } = progressoObra(obra);
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percentual}%` }}
        />
      </div>
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        {concluidas}/{total} atividades ({Math.round(percentual)}%)
      </span>
    </div>
  );
}

export default function PortalObraDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const numeroId = Number(id);
  const [obra, setObra] = useState<ObraPortalDetalhe | null>(null);
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
    obterObraPortal(numeroId)
      .then((dados) => {
        if (active) setObra(dados);
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
    return <Navigate to="/portal/obras" replace />;
  }

  const etapas = obra ? [...obra.etapas].sort((a, b) => a.ordem - b.ordem) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        to="/portal/obras"
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← Voltar para obras
      </Link>

      {loading && (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      )}

      {!loading && naoEncontrado && (
        <div className="space-y-3 rounded-md bg-destructive/10 px-3 py-3 text-sm text-destructive">
          <p>Obra não encontrada.</p>
          <Link to="/portal/obras" className="font-medium underline">
            Voltar para obras
          </Link>
        </div>
      )}

      {!loading && error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {!loading && !error && !naoEncontrado && obra && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold">{obra.codigo}</h1>
            <StatusBadge status={obra.status} />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <span className="text-muted-foreground">Valor contratado: </span>
                <span className="font-semibold">
                  {formatarMoeda(obra.valorContratado)}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Urgência: </span>
                {obra.urgencia || '—'}
              </p>
              <p>
                <span className="text-muted-foreground">Endereço: </span>
                {formatarEndereco(obra.endereco)}
              </p>
              <div>
                <div className="mb-1 text-muted-foreground">Progresso</div>
                {resumoProgresso(obra)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Etapas e atividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              {etapas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma etapa cadastrada.
                </p>
              ) : (
                <ol className="space-y-3">
                  {etapas.map((etapa) => (
                    <li
                      key={etapa.id}
                      className="rounded-md border bg-background p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-foreground">
                          {etapa.ordem}. {etapa.nome}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {etapa.atividades.length} atividades
                        </span>
                      </div>
                      {etapa.atividades.length > 0 && (
                        <ul className="mt-2 space-y-1 border-t pt-2">
                          {[...etapa.atividades]
                            .sort((a, b) => a.ordem - b.ordem)
                            .map((atividade) => (
                              <li
                                key={atividade.id}
                                className="flex flex-wrap items-center justify-between gap-2 text-xs"
                              >
                                <span className="text-muted-foreground">
                                  • {atividade.descricao}
                                </span>
                                <StatusBadge
                                  status={statusAtividadePortal(atividade)}
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
