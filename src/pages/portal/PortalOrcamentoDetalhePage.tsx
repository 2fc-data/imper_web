import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import type { OrcamentoAdminDetalhe } from '../../lib/api';
import { obterOrcamentoPortal } from '../../lib/api';

function formatarMoeda(valor: string | number): string {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export default function PortalOrcamentoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const numeroId = Number(id);
  const [orcamento, setOrcamento] = useState<OrcamentoAdminDetalhe | null>(
    null,
  );
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
    obterOrcamentoPortal(numeroId)
      .then((dados) => {
        if (active) setOrcamento(dados);
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
    return <Navigate to="/portal/orcamentos" replace />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        to="/portal/orcamentos"
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← Voltar para orçamentos
      </Link>

      {loading && (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      )}

      {!loading && naoEncontrado && (
        <div className="space-y-3 rounded-md bg-destructive/10 px-3 py-3 text-sm text-destructive">
          <p>Orçamento não encontrado.</p>
          <Link to="/portal/orcamentos" className="font-medium underline">
            Voltar para orçamentos
          </Link>
        </div>
      )}

      {!loading && error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {!loading && !error && !naoEncontrado && orcamento && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold">{orcamento.codigo}</h1>
            <StatusBadge status={orcamento.status} />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Valor total: </span>
                <span className="font-semibold">
                  {formatarMoeda(orcamento.valorTotal)}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Validade: </span>
                {formatarData(orcamento.validade)}
              </p>
              <p>
                <span className="text-muted-foreground">Urgência: </span>
                {orcamento.urgencia ?? '—'}
              </p>
              <p>
                <span className="text-muted-foreground">Criado em: </span>
                {new Date(orcamento.createdAt).toLocaleString('pt-BR')}
              </p>
              {orcamento.observacoes && (
                <p>
                  <span className="text-muted-foreground">Observações: </span>
                  <span className="whitespace-pre-wrap">
                    {orcamento.observacoes}
                  </span>
                </p>
              )}
            </CardContent>
          </Card>

          {orcamento.motivoRejeicao && (
            <div className="rounded-md bg-destructive/10 px-3 py-3 text-sm text-destructive">
              <span className="font-medium">Motivo da recusa: </span>
              {orcamento.motivoRejeicao}
            </div>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Atividades ({orcamento.atividades.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orcamento.atividades.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma atividade.
                </p>
              ) : (
                <ul className="space-y-2">
                  {orcamento.atividades.map((atividade) => (
                    <li
                      key={atividade.id}
                      className="space-y-1 rounded-md border bg-background p-2.5 text-sm"
                    >
                      <div className="font-medium text-foreground">
                        {atividade.descricao}
                      </div>
                      {atividade.materiais.length > 0 && (
                        <ul className="space-y-0.5 text-xs text-muted-foreground">
                          {atividade.materiais.map((material) => (
                            <li key={material.materialId}>
                              • {material.material?.nome ?? 'Material'} —{' '}
                              {Number(material.quantidade)} un.
                            </li>
                          ))}
                        </ul>
                      )}
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
