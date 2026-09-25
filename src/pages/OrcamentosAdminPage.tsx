import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  aprovarOrcamentoAdmin,
  enviarOrcamentoAdmin,
  excluirOrcamentoAdmin,
  listarOrcamentosAdmin,
  recusarOrcamentoAdmin,
  type OrcamentoAdminItem,
} from '../lib/api';
import {
  mensagemDeErro,
  NovoOrcamentoWizard,
  pendenciasDe409,
} from '../components/orcamentos/NovoOrcamentoWizard';
import { PendenciasAprovacaoModal } from '../components/orcamentos/PendenciasAprovacaoModal';
import { RecusaOrcamentoModal } from '../components/orcamentos/RecusaOrcamentoModal';

interface OrcamentosAnalisesProps {
  orcamentos: OrcamentoAdminItem[];
}

export function OrcamentosAnalises({ orcamentos }: OrcamentosAnalisesProps) {
  const total = orcamentos.length;
  const rascunho = orcamentos.filter((o) => o.status === 'RASCUNHO').length;
  const enviados = orcamentos.filter((o) => o.status === 'ENVIADO').length;
  const aprovados = orcamentos.filter((o) => o.status === 'APROVADO').length;
  const recusados = orcamentos.filter((o) => o.status === 'RECUSADO').length;

  const valorTotalSum = orcamentos.reduce(
    (acc, o) => acc + Number(o.valorTotal || 0),
    0,
  );

  const valorAprovadoSum = orcamentos
    .filter((o) => o.status === 'APROVADO')
    .reduce((acc, o) => acc + Number(o.valorTotal || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Análises de Orçamentos
        </h2>
        <p className="text-sm text-muted-foreground">
          Métricas financeiras, conversão e visão geral dos orçamentos emitidos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Total Emitido
          </p>
          <p className="mt-2 text-2xl font-bold">
            R${' '}
            {valorTotalSum.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {total} orçamentos
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-success">Total Aprovado</p>
          <p className="mt-2 text-2xl font-bold">
            R${' '}
            {valorAprovadoSum.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {aprovados} aprovados
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-info">
            Aguardando Envio/Aprovação
          </p>
          <p className="mt-2 text-2xl font-bold">{rascunho + enviados}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {rascunho} rascunho / {enviados} enviados
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-destructive">
            Recusados / Expirados
          </p>
          <p className="mt-2 text-2xl font-bold">{recusados}</p>
        </div>
      </div>
    </div>
  );
}

interface OrcamentoListProps {
  orcamentos: OrcamentoAdminItem[];
  loading: boolean;
  busca: string;
  onBuscaChange: (v: string) => void;
  statusFiltro: string;
  onStatusFiltroChange: (v: string) => void;
  onEnviar: (id: number) => void;
  onEditar: (orcamento: OrcamentoAdminItem) => void;
  onAprovar: (id: number) => void;
  onRecusar: (orcamento: OrcamentoAdminItem) => void;
  onExcluir: (orcamento: OrcamentoAdminItem) => void;
  onVisualizar: (orcamento: OrcamentoAdminItem) => void;
}

export function OrcamentoList({
  orcamentos,
  loading,
  busca,
  onBuscaChange,
  statusFiltro,
  onStatusFiltroChange,
  onEnviar,
  onEditar,
  onAprovar,
  onRecusar,
  onExcluir,
  onVisualizar,
}: OrcamentoListProps) {
  const { user } = useAuth();
  const podeAprovar = user?.permissoes.includes('aprovar_os') ?? false;
  const acaoClasses = (tom: 'neutro' | 'info' | 'sucesso' | 'perigo') =>
    tom === 'info'
      ? 'rounded-md border border-info/30 bg-info/10 px-2.5 py-1 text-xs font-medium text-info hover:bg-info/20 transition-colors'
      : tom === 'sucesso'
        ? 'rounded-md border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success hover:bg-success/20 transition-colors'
        : tom === 'perigo'
          ? 'rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors'
          : 'rounded-md border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Lista de Orçamentos
          </h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os orçamentos da empresa e seus status.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por código ou atendimento..."
            value={busca}
            onChange={(e) => onBuscaChange(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <select
          value={statusFiltro}
          onChange={(e) => onStatusFiltroChange(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Todos os status</option>
          <option value="RASCUNHO">RASCUNHO</option>
          <option value="ENVIADO">ENVIADO</option>
          <option value="APROVADO">APROVADO</option>
          <option value="RECUSADO">RECUSADO</option>
          <option value="EXPIRADO">EXPIRADO</option>
          <option value="CANCELADO">CANCELADO</option>
        </select>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Atendimento</th>
              <th className="px-4 py-3">Valor Total</th>
              <th className="px-4 py-3">Atividades</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Validade</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Carregando orçamentos...
                </td>
              </tr>
            ) : orcamentos.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Nenhum orçamento encontrado.
                </td>
              </tr>
            ) : (
              orcamentos.map((item) => {
                const editavel =
                  item.status === 'RASCUNHO' || item.status === 'ENVIADO';
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-primary/10 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {item.codigo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {item.atendimento?.user?.nome ||
                          item.user?.nome ||
                          'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      R${' '}
                      {Number(item.valorTotal).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item._count?.atividades ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        title={
                          item.status === 'RECUSADO' && item.motivoRejeicao
                            ? item.motivoRejeicao
                            : undefined
                        }
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.status === 'RASCUNHO'
                            ? 'bg-muted text-muted-foreground'
                            : item.status === 'ENVIADO'
                              ? 'bg-info/15 text-info dark:bg-info/20 dark:text-info'
                              : item.status === 'APROVADO'
                                ? 'bg-success/15 text-success dark:bg-success/20 dark:text-success'
                                : item.status === 'RECUSADO' ||
                                    item.status === 'CANCELADO'
                                  ? 'bg-destructive/15 text-destructive dark:bg-destructive/20 dark:text-destructive'
                                  : 'bg-warning/15 text-warning dark:bg-warning/20 dark:text-warning'
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.status === 'RECUSADO' && item.motivoRejeicao ? (
                        <p
                          className="mt-1 max-w-[16rem] truncate text-xs text-muted-foreground"
                          title={item.motivoRejeicao}
                        >
                          {item.motivoRejeicao}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(item.validade).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onVisualizar(item)}
                          className={acaoClasses('neutro')}
                        >
                          Visualizar
                        </button>
                        {editavel ? (
                          <button
                            type="button"
                            onClick={() => onEditar(item)}
                            className={acaoClasses('neutro')}
                          >
                            Editar
                          </button>
                        ) : null}
                        {item.status === 'RASCUNHO' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onEnviar(item.id)}
                              className={acaoClasses('info')}
                            >
                              Enviar
                            </button>
                            <button
                              type="button"
                              onClick={() => onExcluir(item)}
                              className={acaoClasses('perigo')}
                            >
                              Excluir
                            </button>
                          </>
                        ) : null}
                        {editavel && podeAprovar ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onAprovar(item.id)}
                              className={acaoClasses('sucesso')}
                            >
                              Aprovar
                            </button>
                            <button
                              type="button"
                              onClick={() => onRecusar(item)}
                              className={acaoClasses('perigo')}
                            >
                              Recusar
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface OrcamentosAdminPageProps {
  initialView?: 'analises' | 'lista' | 'novo';
  onNavegar?: (view: 'analises' | 'lista' | 'novo') => void;
  atendimentoInicial?: number | null;
}

export function OrcamentosAdminPage({
  initialView = 'lista',
  onNavegar,
  atendimentoInicial = null,
}: OrcamentosAdminPageProps) {
  const [orcamentos, setOrcamentos] = useState<OrcamentoAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [orcamentoSelecionado, setOrcamentoSelecionado] =
    useState<OrcamentoAdminItem | null>(null);
  const [orcamentoEdicao, setOrcamentoEdicao] =
    useState<OrcamentoAdminItem | null>(null);
  const [recusaAlvo, setRecusaAlvo] = useState<OrcamentoAdminItem | null>(
    null,
  );
  const [pendencias, setPendencias] = useState<string[] | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const mudarView = (novaView: 'analises' | 'lista' | 'novo') => {
    if (onNavegar) onNavegar(novaView);
  };

  const carregarOrcamentos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listarOrcamentosAdmin({
        status: statusFiltro || undefined,
        q: busca || undefined,
      });
      setOrcamentos(data);
    } catch (err) {
      console.error('Erro ao listar orçamentos:', err);
    } finally {
      setLoading(false);
    }
  }, [busca, statusFiltro]);

  useEffect(() => {
    carregarOrcamentos();
  }, [carregarOrcamentos]);

  const tratarErroAcao = (err: unknown, prefixo: string) => {
    const p = pendenciasDe409(err);
    if (p) {
      setPendencias(p);
      return;
    }
    setErroAcao(`${prefixo}: ${mensagemDeErro(err)}`);
  };

  const handleEnviar = async (id: number) => {
    try {
      await enviarOrcamentoAdmin(id);
      await carregarOrcamentos();
    } catch (err) {
      tratarErroAcao(err, 'Falha ao enviar');
    }
  };

  const handleAprovar = async (id: number) => {
    try {
      await aprovarOrcamentoAdmin(id);
      await carregarOrcamentos();
    } catch (err) {
      tratarErroAcao(err, 'Falha ao aprovar');
    }
  };

  const handleRecusar = async (motivo: string) => {
    if (!recusaAlvo) return;
    const alvo = recusaAlvo;
    setRecusaAlvo(null);
    try {
      await recusarOrcamentoAdmin(alvo.id, motivo);
      await carregarOrcamentos();
    } catch (err) {
      tratarErroAcao(err, 'Falha ao recusar');
    }
  };

  const handleExcluir = async (orcamento: OrcamentoAdminItem) => {
    const ok = window.confirm(
      `Excluir o orçamento ${orcamento.codigo}? Esta ação não pode ser desfeita.`,
    );
    if (!ok) return;
    try {
      await excluirOrcamentoAdmin(orcamento.id);
      await carregarOrcamentos();
    } catch (err) {
      tratarErroAcao(err, 'Falha ao excluir');
    }
  };

  const handleEditar = (orcamento: OrcamentoAdminItem) => {
    setErroAcao(null);
    setOrcamentoEdicao(orcamento);
    mudarView('novo');
  };

  const fecharWizard = () => {
    setOrcamentoEdicao(null);
    setErroAcao(null);
    mudarView('lista');
  };

  return (
    <div className="p-6">
      {erroAcao ? (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erroAcao}
        </div>
      ) : null}

      {initialView === 'analises' && (
        <OrcamentosAnalises orcamentos={orcamentos} />
      )}
      {initialView === 'lista' && (
        <OrcamentoList
          orcamentos={orcamentos}
          loading={loading}
          busca={busca}
          onBuscaChange={setBusca}
          statusFiltro={statusFiltro}
          onStatusFiltroChange={setStatusFiltro}
          onEnviar={handleEnviar}
          onEditar={handleEditar}
          onAprovar={handleAprovar}
          onRecusar={(o) => setRecusaAlvo(o)}
          onExcluir={handleExcluir}
          onVisualizar={(orcamento) => setOrcamentoSelecionado(orcamento)}
        />
      )}
      {initialView === 'novo' && (
        <div className="max-w-3xl space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {orcamentoEdicao
                ? `Editar Orçamento #${orcamentoEdicao.codigo}`
                : 'Novo Orçamento'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {orcamentoEdicao
                ? 'Ajuste as etapas do orçamento e use as ações do passo final para salvar e transicionar.'
                : 'Preencha cliente, cobertura, precificação e ficha para gerar a proposta.'}
            </p>
          </div>
          <NovoOrcamentoWizard
            orcamentoEdicao={orcamentoEdicao ?? undefined}
            atendimentoTravado={
              orcamentoEdicao ? null : atendimentoInicial
            }
            onSalvo={() => {
              fecharWizard();
              carregarOrcamentos();
            }}
            onCancel={fecharWizard}
          />
        </div>
      )}

      {/* Modal de Visualização */}
      {orcamentoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-card p-5 shadow-lg space-y-4 border">
            <h3 className="text-lg font-bold">
              Orçamento #{orcamentoSelecionado.codigo}
            </h3>
            <div className="text-sm space-y-2 text-muted-foreground">
              <p>
                <strong className="text-foreground">Atendimento:</strong>{' '}
                {orcamentoSelecionado.atendimento?.user?.nome ||
                  orcamentoSelecionado.user?.nome ||
                  'N/A'}
              </p>
              <p>
                <strong className="text-foreground">Status:</strong>{' '}
                {orcamentoSelecionado.status}
              </p>
              {orcamentoSelecionado.status === 'RECUSADO' &&
              orcamentoSelecionado.motivoRejeicao ? (
                <p>
                  <strong className="text-foreground">Motivo da recusa:</strong>{' '}
                  {orcamentoSelecionado.motivoRejeicao}
                </p>
              ) : null}
              <p>
                <strong className="text-foreground">Valor Total:</strong> R${' '}
                {Number(orcamentoSelecionado.valorTotal).toLocaleString(
                  'pt-BR',
                  { minimumFractionDigits: 2 },
                )}
              </p>
              <p>
                <strong className="text-foreground">Validade:</strong>{' '}
                {new Date(orcamentoSelecionado.validade).toLocaleDateString(
                  'pt-BR',
                )}
              </p>
              <p>
                <strong className="text-foreground">Atividades:</strong>{' '}
                {orcamentoSelecionado._count?.atividades ?? '—'}
              </p>
              <p>
                <strong className="text-foreground">Observações:</strong>{' '}
                {orcamentoSelecionado.observacoes ||
                  'Nenhuma observação registrada.'}
              </p>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setOrcamentoSelecionado(null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <PendenciasAprovacaoModal
        aberto={pendencias !== null}
        pendencias={pendencias ?? undefined}
        onFechar={() => setPendencias(null)}
      />
      <RecusaOrcamentoModal
        aberto={recusaAlvo !== null}
        onConfirmar={handleRecusar}
        onFechar={() => setRecusaAlvo(null)}
      />
    </div>
  );
}
