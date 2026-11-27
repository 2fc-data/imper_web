import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import {
  aprovarListaCompras,
  aprovarManutencao,
  aprovarManutencaoVeiculo,
  listarListasComprasPendentesAprovacao,
  listarManutencoesPendentesAprovacao as listarManutencoesEquipamentosPendentes,
  listarManutencoesVeiculosPendentesAprovacao,
  listarNotificacoes,
  marcarNotificacaoLida,
  marcarTodasNotificacoesLidas,
  recusarListaCompras,
  recusarManutencao,
  recusarManutencaoVeiculo,
  type ListaCompraDto,
  type ManutencaoItem,
  type ManutencaoVeiculoItem,
  type NotificacaoItem,
} from '../../lib/api';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';
import {
  podeAprovarCompras,
  podeAprovarManutencao,
  podeAprovarManutencaoEquipamento,
  rotuloContador,
  totalAvisos,
} from './avisos';

export function AvisosMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [pendentes, setPendentes] = useState<ManutencaoVeiculoItem[]>([]);
  const [pendentesEquipamentos, setPendentesEquipamentos] = useState<ManutencaoItem[]>([]);
  const [pendentesCompras, setPendentesCompras] = useState<ListaCompraDto[]>([]);
  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [recusandoItem, setRecusandoItem] = useState<{
    tipo: 'veiculo' | 'equipamento' | 'compra';
    id: number;
    titulo: string;
  } | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const autorizadoFrota = podeAprovarManutencao(user);
  const autorizadoEquipamentos = podeAprovarManutencaoEquipamento(user);
  const autorizadoCompras = podeAprovarCompras(user);

  const carregarDados = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [listaPendentes, listaEquipamentos, listaCompras, listaNotifs] = await Promise.all([
        autorizadoFrota ? listarManutencoesVeiculosPendentesAprovacao().catch(() => []) : Promise.resolve([]),
        autorizadoEquipamentos ? listarManutencoesEquipamentosPendentes().catch(() => []) : Promise.resolve([]),
        autorizadoCompras ? listarListasComprasPendentesAprovacao().catch(() => []) : Promise.resolve([]),
        listarNotificacoes({ status: 'NAO_LIDA', limit: 20 }).catch(() => []),
      ]);
      setPendentes(listaPendentes);
      setPendentesEquipamentos(listaEquipamentos);
      setPendentesCompras(listaCompras);
      setNotificacoes(listaNotifs);
    } finally {
      setLoading(false);
    }
  }, [autorizadoFrota, autorizadoEquipamentos, autorizadoCompras, user]);

  useEffect(() => {
    if (user) {
      carregarDados();
    }
  }, [user, carregarDados]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  if (!user) return null;

  const total = totalAvisos(pendentes, notificacoes, pendentesEquipamentos, pendentesCompras);

  const handleAprovarVeiculo = async (id: number) => {
    setProcessandoId(`v-${id}`);
    setErroAcao(null);
    try {
      await aprovarManutencaoVeiculo(id);
      await carregarDados();
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao aprovar');
    } finally {
      setProcessandoId(null);
    }
  };

  const handleAprovarEquipamento = async (id: number) => {
    setProcessandoId(`e-${id}`);
    setErroAcao(null);
    try {
      await aprovarManutencao(id);
      await carregarDados();
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao aprovar');
    } finally {
      setProcessandoId(null);
    }
  };

  const handleAprovarCompra = async (id: number) => {
    setProcessandoId(`c-${id}`);
    setErroAcao(null);
    try {
      await aprovarListaCompras(id);
      await carregarDados();
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao aprovar');
    } finally {
      setProcessandoId(null);
    }
  };

  const confirmarRecusa = async () => {
    if (!recusandoItem) return;
    const motivo = motivoRecusa.trim();
    if (motivo.length < 5) {
      setErroAcao('O motivo deve ter pelo menos 5 caracteres.');
      return;
    }
    const procKey = `${recusandoItem.tipo[0]}-${recusandoItem.id}`;
    setProcessandoId(procKey);
    setErroAcao(null);
    try {
      if (recusandoItem.tipo === 'veiculo') {
        await recusarManutencaoVeiculo(recusandoItem.id, motivo);
      } else if (recusandoItem.tipo === 'equipamento') {
        await recusarManutencao(recusandoItem.id, motivo);
      } else {
        await recusarListaCompras(recusandoItem.id, motivo);
      }
      setRecusandoItem(null);
      setMotivoRecusa('');
      await carregarDados();
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Falha ao recusar');
    } finally {
      setProcessandoId(null);
    }
  };

  const handleClicarNotificacao = async (notif: NotificacaoItem) => {
    try {
      await marcarNotificacaoLida(notif.id);
      setNotificacoes((prev) => prev.filter((n) => n.id !== notif.id));
    } catch {
      // Ignora erro de rede silenciosamente
    }
    if (notif.link) {
      setOpen(false);
      navigate(notif.link);
    }
  };

  const handleMarcarTodasLidas = async () => {
    try {
      await marcarTodasNotificacoesLidas();
      setNotificacoes([]);
    } catch {
      // Ignora erro
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
        title="Avisos e pendências"
        aria-label="Avisos e pendências"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {total > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white shadow-xs">
            {rotuloContador(total)}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card p-4 shadow-lg animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-semibold text-sm text-foreground">Avisos e Pendências</h3>
            {notificacoes.length > 0 && (
              <button
                type="button"
                onClick={handleMarcarTodasLidas}
                className="text-xs text-primary hover:underline"
              >
                Limpar notificações
              </button>
            )}
          </div>

          {erroAcao && (
            <div className="mt-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
              {erroAcao}
            </div>
          )}

          <div className="mt-3 max-h-80 space-y-4 overflow-y-auto pr-1">
            {/* Seção Manutenções Veículos Pendentes */}
            {pendentes.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Frota — Aguardando Aprovação ({pendentes.length})
                </h4>
                <div className="space-y-2">
                  {pendentes.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border bg-muted/40 p-2.5 text-xs shadow-xs"
                    >
                      <div className="flex items-center justify-between font-medium text-foreground">
                        <span>{item.veiculo?.nome ?? 'Veículo'} ({item.veiculo?.placa})</span>
                        <span className="text-[10px] text-muted-foreground">
                          {item.tipo?.nome ?? 'Manutenção'}
                        </span>
                      </div>
                      <p className="mt-1 text-muted-foreground line-clamp-2">
                        {item.descricao}
                      </p>
                      {item.criadoPor && (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Solicitado por: {item.criadoPor.nome}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:bg-destructive/10"
                          disabled={processandoId === `v-${item.id}`}
                          onClick={() => {
                            setErroAcao(null);
                            setMotivoRecusa('');
                            setRecusandoItem({
                              tipo: 'veiculo',
                              id: item.id,
                              titulo: `${item.veiculo?.nome ?? 'Veículo'} (${item.veiculo?.placa})`,
                            });
                          }}
                        >
                          Recusar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                          disabled={processandoId === `v-${item.id}`}
                          onClick={() => handleAprovarVeiculo(item.id)}
                        >
                          {processandoId === `v-${item.id}` ? 'Aprovando...' : 'Aprovar'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seção Manutenções Equipamentos Pendentes */}
            {pendentesEquipamentos.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Equipamentos — Aguardando Aprovação ({pendentesEquipamentos.length})
                </h4>
                <div className="space-y-2">
                  {pendentesEquipamentos.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border bg-muted/40 p-2.5 text-xs shadow-xs"
                    >
                      <div className="flex items-center justify-between font-medium text-foreground">
                        <span>{item.equipamento?.codigo} — {item.equipamento?.descricao}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {item.tipo?.nome ?? 'Manutenção'}
                        </span>
                      </div>
                      <p className="mt-1 text-muted-foreground line-clamp-2">
                        {item.descricao}
                      </p>
                      {item.criadoPor && (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Solicitado por: {item.criadoPor.nome}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:bg-destructive/10"
                          disabled={processandoId === `e-${item.id}`}
                          onClick={() => {
                            setErroAcao(null);
                            setMotivoRecusa('');
                            setRecusandoItem({
                              tipo: 'equipamento',
                              id: item.id,
                              titulo: `${item.equipamento?.codigo} (${item.equipamento?.descricao})`,
                            });
                          }}
                        >
                          Recusar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                          disabled={processandoId === `e-${item.id}`}
                          onClick={() => handleAprovarEquipamento(item.id)}
                        >
                          {processandoId === `e-${item.id}` ? 'Aprovando...' : 'Aprovar'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seção Compras Pendentes */}
            {pendentesCompras.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Compras — Aguardando Aprovação ({pendentesCompras.length})
                </h4>
                <div className="space-y-2">
                  {pendentesCompras.map((item) => {
                    const rotuloTipo =
                      item.tipo === 'DESPESAS_EXTRAS'
                        ? (item.tipoDespesa?.nome ?? 'Despesas Extras')
                        : item.tipo;
                    return (
                      <div
                        key={item.id}
                        className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-2.5 text-xs transition-colors hover:bg-blue-500/10"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-foreground">
                            {rotuloTipo} — {item.setor} ({String(item.mes).padStart(2, '0')}/{item.ano})
                          </span>
                          <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                            {item.itens.length} {item.itens.length === 1 ? 'item' : 'itens'}
                          </span>
                        </div>
                        {item.enviadoPor && (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            Enviado por: {item.enviadoPor.nome}
                          </p>
                        )}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setOpen(false);
                              navigate('/compras');
                            }}
                          >
                            Ver Lista
                          </Button>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-destructive hover:bg-destructive/10"
                              disabled={processandoId === `c-${item.id}`}
                              onClick={() => {
                                setErroAcao(null);
                                setMotivoRecusa('');
                                setRecusandoItem({
                                  tipo: 'compra',
                                  id: item.id,
                                  titulo: `${rotuloTipo} - ${item.setor} (${String(item.mes).padStart(2, '0')}/${item.ano})`,
                                });
                              }}
                            >
                              Recusar
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                              disabled={processandoId === `c-${item.id}`}
                              onClick={() => handleAprovarCompra(item.id)}
                            >
                              {processandoId === `c-${item.id}` ? 'Aprovando...' : 'Aprovar'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Seção Notificações */}
            {notificacoes.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Notificações ({notificacoes.length})
                </h4>
                <div className="space-y-1.5">
                  {notificacoes.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleClicarNotificacao(notif)}
                      className="cursor-pointer rounded-lg border border-border/60 p-2 text-xs transition-colors hover:bg-muted/60"
                    >
                      <p className="font-medium text-foreground">{notif.titulo}</p>
                      <p className="mt-0.5 text-muted-foreground">{notif.mensagem}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendentes.length === 0 && pendentesEquipamentos.length === 0 && pendentesCompras.length === 0 && notificacoes.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                {loading ? 'Carregando avisos...' : 'Nenhum aviso ou pendência no momento.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Dialog para motivo de recusa */}
      <Dialog
        open={recusandoItem !== null}
        onClose={() => setRecusandoItem(null)}
        title={
          recusandoItem?.tipo === 'veiculo'
            ? 'Recusar Manutenção de Frota'
            : recusandoItem?.tipo === 'equipamento'
              ? 'Recusar Manutenção de Equipamento'
              : 'Recusar Lista de Compras'
        }
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRecusandoItem(null)}
              disabled={processandoId !== null}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmarRecusa}
              disabled={processandoId !== null || motivoRecusa.trim().length < 5}
            >
              {processandoId !== null ? 'Recusando...' : 'Confirmar Recusa'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Informe o motivo da recusa para{' '}
            <strong>{recusandoItem?.titulo}</strong>.
            O solicitante receberá uma notificação com esta justificativa.
          </p>
          <div className="space-y-1">
            <label htmlFor="motivo-recusa" className="text-xs font-medium">
              Motivo da recusa (mínimo 5 caracteres) *
            </label>
            <textarea
              id="motivo-recusa"
              rows={3}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
              placeholder="Ex.: Manutenção postergada para o próximo mês devido a restrição orçamentária."
              value={motivoRecusa}
              onChange={(e) => setMotivoRecusa(e.target.value)}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
