import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import type { OrcamentoAdminDetalhe } from '../../lib/api';
import {
  aprovarOrcamentoPortal,
  obterOrcamentoPortal,
  recusarOrcamentoPortal,
} from '../../lib/api';
import { brl, formatarData } from '../../lib/format';

export default function PortalOrcamentoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const numeroId = Number(id);
  const [orcamento, setOrcamento] = useState<OrcamentoAdminDetalhe | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [processando, setProcessando] = useState<'aprovar' | 'recusar' | null>(null);
  const [acaoErro, setAcaoErro] = useState<string | null>(null);
  const [recusaAberta, setRecusaAberta] = useState(false);
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [obraCriada, setObraCriada] = useState<{ id: number; codigo: string } | null>(null);

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

  async function handleAprovar() {
    if (!orcamento) return;
    setProcessando('aprovar');
    setAcaoErro(null);
    try {
      const res = await aprovarOrcamentoPortal(orcamento.id);
      setOrcamento((prev) => (prev ? { ...prev, status: 'APROVADO' } : prev));
      setObraCriada(res.obra);
      setRecusaAberta(false);
    } catch (err) {
      setAcaoErro(err instanceof Error ? err.message : 'Falha ao aprovar orçamento');
    } finally {
      setProcessando(null);
    }
  }

  async function handleConfirmarRecusa() {
    if (!orcamento) return;
    setProcessando('recusar');
    setAcaoErro(null);
    try {
      const atualizado = await recusarOrcamentoPortal(orcamento.id, motivoRecusa);
      setOrcamento(atualizado);
      setRecusaAberta(false);
      setMotivoRecusa('');
    } catch (err) {
      setAcaoErro(err instanceof Error ? err.message : 'Falha ao recusar orçamento');
    } finally {
      setProcessando(null);
    }
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{orcamento.codigo}</h1>
              <StatusBadge status={orcamento.status} />
            </div>

            {orcamento.status === 'ENVIADO' && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={processando !== null}
                  onClick={() => {
                    setAcaoErro(null);
                    setRecusaAberta((prev) => !prev);
                  }}
                >
                  Recusar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={processando !== null}
                  onClick={handleAprovar}
                >
                  {processando === 'aprovar' ? 'Aprovando...' : 'Aprovar'}
                </Button>
              </div>
            )}
          </div>

          {acaoErro && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {acaoErro}
            </p>
          )}

          {obraCriada && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              <span>
                Orçamento aprovado! A obra <strong>{obraCriada.codigo}</strong> foi gerada e iniciará na data e horário estabelecidos.
              </span>
              <Link
                to={`/portal/obras/${obraCriada.id}`}
                className="font-medium underline"
              >
                Ver obra →
              </Link>
            </div>
          )}

          {orcamento.status === 'ENVIADO' && recusaAberta && (
            <Card className="border-destructive/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-destructive">
                  Recusar orçamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Se desejar, descreva o motivo da recusa ou o que gostaria de ajustar (opcional).
                </p>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={motivoRecusa}
                  onChange={(e) => setMotivoRecusa(e.target.value)}
                  placeholder="Descreva o motivo (opcional)..."
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={processando !== null}
                    onClick={() => {
                      setRecusaAberta(false);
                      setMotivoRecusa('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={processando !== null}
                    onClick={handleConfirmarRecusa}
                  >
                    {processando === 'recusar' ? 'Recusando...' : 'Confirmar recusa'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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
                  {brl(orcamento.valorTotal)}
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
                        {atividade.titulo ? (
                          <div className="text-xs font-bold uppercase tracking-wide text-foreground">
                            {atividade.titulo}
                          </div>
                        ) : null}
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
