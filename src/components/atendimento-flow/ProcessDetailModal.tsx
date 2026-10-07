import React, { useRef, useState } from 'react';
import { StatusBadge } from '../ui/StatusBadge';
import { AgendarVisita, type AgendarDados, type AgendarVisitaHandle } from '../agendamento/AgendarVisita';
import { acaoPresente, type AcaoUI } from '../../lib/proximas-acoes';
import type { AtendimentoItem, AtendimentoLogItem, StatusAtendimento } from '../../lib/api';

interface ProcessDetailModalProps {
  item: AtendimentoItem;
  logs: AtendimentoLogItem[];
  logsLoading: boolean;
  onClose: () => void;
  onStatusChange: (id: number, status: StatusAtendimento) => Promise<void>;
  onRegistrarLog: (id: number, descricao: string) => Promise<void>;
  onAgendarVisita?: (atendimentoId: number, dados: AgendarDados) => Promise<void>;
  onCancelarAgendamento?: (agendamentoId: number) => Promise<void>;
  onCriarOrcamento?: (atendimentoId: number) => Promise<void> | void;
}

export function ProcessDetailModal({
  item,
  logs,
  logsLoading,
  onClose,
  onStatusChange,
  onRegistrarLog,
  onAgendarVisita,
  onCancelarAgendamento,
  onCriarOrcamento,
}: ProcessDetailModalProps) {
  const [abaAtiva, setAbaAtiva] = useState<'geral' | 'historico' | 'agendamento'>('geral');
  const [descricaoDraft, setDescricaoDraft] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [avisoReagendamento, setAvisoReagendamento] = useState<string | null>(null);
  const [avisoRegistro, setAvisoRegistro] = useState<string | null>(null);
  const agendarRef = useRef<AgendarVisitaHandle>(null);

  const encerravel = acaoPresente(item, 'ENCERRAR');

  const getInicial = (nome?: string | null) => {
    if (!nome) return 'AT';
    const partes = nome.trim().split(' ');
    return partes.length >= 2 ? (partes[0][0] + partes[1][0]).toUpperCase() : nome.slice(0, 2).toUpperCase();
  };

  const agendamentoAtivo = item.agendamentos && item.agendamentos.length > 0 ? item.agendamentos[0] : null;
  const temVisitaAgendada = Boolean(agendamentoAtivo);

  const handleSalvar = async () => {
    setErro(null);
    const isAgendar = agendarRef.current?.isAgendar() ?? false;
    if (isAgendar) {
      const agendarOk = agendarRef.current?.tentarValidar() ?? false;
      if (!agendarOk) {
        setErro('Informe um CEP válido e selecione um horário disponível.');
        return;
      }
    }

    const isValid = agendarRef.current?.isValid() ?? false;
    if (!descricaoDraft.trim() && !isValid) {
      onClose();
      await onCriarOrcamento?.(item.id);
      return;
    }

    setSalvando(true);
    try {
      if (descricaoDraft.trim()) {
        await onRegistrarLog(item.id, descricaoDraft.trim());
      }
      const agendarDados = agendarRef.current?.getDados();
      if (agendarDados && onAgendarVisita) {
        if (agendamentoAtivo) {
          const dataAnterior = new Date(agendamentoAtivo.dataPrevista).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          const dataNova = new Date(agendarDados.slotIso).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          await onRegistrarLog(
            item.id,
            `Reagendamento de visita técnica: alterado de ${dataAnterior} para ${dataNova}`,
          );
        }
        await onAgendarVisita(item.id, agendarDados);
      }
      setDescricaoDraft('');
      onClose();
      await onCriarOrcamento?.(item.id);
    } catch (err: any) {
      setErro(err?.message || 'Erro ao salvar registro de atendimento.');
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarRegistro = async () => {
    setErro(null);
    setAvisoRegistro(null);
    const descricao = descricaoDraft.trim();
    if (!descricao) {
      setErro('Digite um registro para salvar.');
      return;
    }
    setSalvando(true);
    try {
      await onRegistrarLog(item.id, descricao);
      setDescricaoDraft('');
      setAvisoRegistro('Registro salvo no histórico');
    } catch (err: any) {
      setErro(err?.message || 'Erro ao salvar o registro.');
    } finally {
      setSalvando(false);
    }
  };

  const executarAcao = async (acao: AcaoUI) => {
    setErro(null);
    try {
      if (acao.status) {
        await onStatusChange(item.id, acao.status);
      } else if (acao.criarOrcamento) {
        await onCriarOrcamento?.(item.id);
      }
    } catch (err: any) {
      setErro(err?.message || 'Erro ao executar ação.');
    }
  };

  const formatarData = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleSalvarReagendamento = async () => {
    setErro(null);
    setAvisoReagendamento(null);
    const agendarOk = agendarRef.current?.tentarValidar() ?? false;
    if (!agendarOk) {
      setErro('Informe um CEP válido e selecione um horário disponível.');
      return;
    }
    const agendarDados = agendarRef.current?.getDados();
    if (!agendarDados || !onAgendarVisita) {
      setErro('Não foi possível ler o novo horário selecionado.');
      return;
    }

    setSalvando(true);
    try {
      const dataNova = formatarData(agendarDados.slotIso);
      if (agendamentoAtivo) {
        const dataAnterior = formatarData(agendamentoAtivo.dataPrevista);
        await onRegistrarLog(
          item.id,
          `Reagendamento de visita técnica: alterado de ${dataAnterior} para ${dataNova}`,
        );
        await onAgendarVisita(item.id, agendarDados);
        if (onCancelarAgendamento) {
          await onCancelarAgendamento(agendamentoAtivo.id);
        }
        setAvisoReagendamento(`Horário atualizado com sucesso: ${dataNova}`);
      } else {
        await onRegistrarLog(item.id, `Visita técnica agendada para ${dataNova}`);
        await onAgendarVisita(item.id, agendarDados);
        setAvisoReagendamento(`Visita agendada com sucesso: ${dataNova}`);
      }
    } catch (err: any) {
      setErro(err?.message || 'Erro ao salvar o novo horário.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl rounded-3xl bg-card p-6 shadow-2xl border border-border/80 space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* Header com Avatar do Cliente */}
        <div className="flex items-start justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/30 to-primary/50 font-bold text-base text-primary ring-2 ring-primary/30 shadow-md">
              {getInicial(item.user?.nome)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {item.user?.nome || `Atendimento #${item.id}`}
                </h2>
                <StatusBadge
                  status={item.status}
                  labelOverride={temVisitaAgendada && item.status === 'NOVO' ? 'Visita Técnica' : undefined}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                <span>ID: #{item.id}</span>
                <span>•</span>
                <span>Criado em: {new Date(item.createdAt).toLocaleString('pt-BR')}</span>
                <span>•</span>
                <span className="font-semibold text-primary uppercase">{item.canal}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border/60 bg-muted/40 p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Abas de Navegação Interna */}
        <div className="flex items-center gap-2 border-b border-border/50 pb-2">
          <button
            type="button"
            onClick={() => setAbaAtiva('geral')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              abaAtiva === 'geral'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            Visão Geral
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva('historico')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              abaAtiva === 'historico'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            Histórico & Logs ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva('agendamento')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              abaAtiva === 'agendamento'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {temVisitaAgendada ? 'Reagendar' : 'Visita / Agendamento'}
          </button>
        </div>

        {erro && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{erro}</span>
          </div>
        )}

        {/* Conteúdo Aba Geral */}
        {abaAtiva === 'geral' && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 rounded-2xl border border-border/60 bg-muted/30 p-4 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">Telefone de Contato:</span>
                <p className="text-foreground font-semibold text-sm">{item.user?.telefone || 'Não informado'}</p>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">E-mail:</span>
                <p className="text-foreground font-semibold text-sm">{(item.user as any)?.email || 'Não informado'}</p>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">Nível de Urgência:</span>
                <p className="text-foreground font-semibold text-sm">{item.urgencia || 'NORMAL'}</p>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">Atendente Responsável:</span>
                <p className="text-foreground font-semibold text-sm">{item.atendente?.nome || 'Sistema'}</p>
              </div>
            </div>

            {/* Card de Visita Técnica Agendada */}
            {agendamentoAtivo && (
              <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Visita Técnica Agendada
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary uppercase">
                    {agendamentoAtivo.status}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-semibold">Data e Horário Programado:</span>
                    <p className="font-bold text-foreground text-sm">
                      {new Date(agendamentoAtivo.dataPrevista).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {agendamentoAtivo.endereco && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground font-semibold">Endereço da Vistoria:</span>
                      <p className="font-semibold text-foreground text-xs leading-relaxed">
                        {agendamentoAtivo.endereco.logradouro}
                        {agendamentoAtivo.endereco.numero ? `, ${agendamentoAtivo.endereco.numero}` : ''}
                        {agendamentoAtivo.endereco.complemento ? ` (${agendamentoAtivo.endereco.complemento})` : ''}
                        {agendamentoAtivo.endereco.bairro ? ` - ${agendamentoAtivo.endereco.bairro}` : ''}
                        {agendamentoAtivo.endereco.cidade ? `, ${agendamentoAtivo.endereco.cidade}` : ''}
                        {agendamentoAtivo.endereco.estado ? `/${agendamentoAtivo.endereco.estado}` : ''}
                        {agendamentoAtivo.endereco.cep ? ` • CEP: ${agendamentoAtivo.endereco.cep}` : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {item.descricao && (
              <div className="rounded-2xl border border-border/60 bg-background p-4 space-y-1.5 shadow-2xs">
                <span className="font-bold text-xs text-foreground uppercase tracking-wider">Descrição Inicial da Solicitação:</span>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{item.descricao}</p>
              </div>
            )}
          </div>
        )}

        {/* Conteúdo Aba Histórico */}
        {abaAtiva === 'historico' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">Novo Registro no Histórico</label>
              <textarea
                rows={3}
                maxLength={1000}
                value={descricaoDraft}
                onChange={(e) => setDescricaoDraft(e.target.value)}
                placeholder="Descreva a interação ou atualização com o cliente..."
                className="w-full rounded-xl border border-input bg-background p-3 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
              {avisoRegistro && (
                <div className="rounded-xl border border-success/30 bg-success/10 p-3.5 text-xs font-medium text-success flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>{avisoRegistro}</span>
                </div>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleSalvarRegistro()}
                  disabled={salvando || !descricaoDraft.trim()}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar Registro'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Linha do Tempo (Logs)</h4>
              {logsLoading ? (
                <div className="p-4 text-center text-xs text-muted-foreground">Carregando linha do tempo...</div>
              ) : logs.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground rounded-xl border border-dashed">
                  Nenhum histórico registrado ainda.
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div key={log.id} className="relative pl-6 pb-2 border-l-2 border-primary/30 space-y-1">
                      <span className="absolute -left-[7px] top-0 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="font-bold text-foreground">
                          {log.tipo === 'STATUS' ? `Transição: ${log.statusDe} → ${log.statusPara}` : 'Nota de Atendimento'}
                        </span>
                        <span>{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                      </div>
                      {log.descricao && (
                        <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40 whitespace-pre-wrap">
                          {log.descricao}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conteúdo Aba Agendamento / Reagendar */}
        {abaAtiva === 'agendamento' && (
          <div className="space-y-4">
            {agendamentoAtivo && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-foreground">Horário Agendado Atualmente: </span>
                  <span className="text-primary font-bold">
                    {new Date(agendamentoAtivo.dataPrevista).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  Selecione um novo slot de data e horário para reagendar
                </span>
              </div>
            )}

            {avisoReagendamento && (
              <div className="rounded-xl border border-success/30 bg-success/10 p-3.5 text-xs font-medium text-success flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{avisoReagendamento}</span>
              </div>
            )}

            <AgendarVisita
              ref={agendarRef}
              disabled={salvando}
              modoReagendar={temVisitaAgendada}
              enderecoInicial={agendamentoAtivo?.endereco}
              titulo={temVisitaAgendada ? 'Reagendamento de Visita Técnica' : 'Seleção de Slots & CEP para Vistoria'}
            />

            {temVisitaAgendada && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <p className="text-xs text-muted-foreground">
                  Após selecionar o novo horário, clique em salvar para confirmar o reagendamento.
                </p>
                <button
                  type="button"
                  onClick={() => void handleSalvarReagendamento()}
                  disabled={salvando}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 shrink-0"
                >
                  {salvando ? 'Salvando...' : 'Salvar Novo Horário'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Rodapé do Modal */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/60">
          <button
            type="button"
            onClick={onClose}
            disabled={salvando}
            className="rounded-xl border border-border/80 px-4 py-2 text-xs font-bold hover:bg-muted transition-colors"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            disabled={salvando}
            className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {salvando ? 'Processando...' : 'Iniciar Orçamento'}
          </button>
          <button
            type="button"
            onClick={() =>
              void executarAcao({ label: 'Finalizar Atendimento', status: 'CONCLUIDO', tone: 'success' })
            }
            disabled={salvando || !encerravel}
            className="rounded-xl bg-success px-5 py-2 text-xs font-bold text-success-foreground shadow-md hover:bg-success/90 transition-all disabled:opacity-50"
          >
            Finalizar Atendimento
          </button>
          <button
            type="button"
            onClick={() =>
              void executarAcao({ label: 'Inativar', status: 'INATIVO', tone: 'destructive' })
            }
            disabled={salvando || !encerravel}
            className="rounded-xl bg-destructive px-5 py-2 text-xs font-bold text-destructive-foreground shadow-md hover:bg-destructive/90 transition-all disabled:opacity-50"
          >
            Inativar
          </button>
        </div>
      </div>
    </div>
  );
}
