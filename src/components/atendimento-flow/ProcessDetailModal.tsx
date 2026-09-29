import React, { useRef, useState } from 'react';
import { StatusBadge } from '../ui/StatusBadge';
import { AgendarVisita, type AgendarDados, type AgendarVisitaHandle } from '../agendamento/AgendarVisita';
import { montarAcoesAtendimento, type AcaoUI } from '../../lib/proximas-acoes';
import type { AtendimentoItem, AtendimentoLogItem, StatusAtendimento } from '../../lib/api';

interface ProcessDetailModalProps {
  item: AtendimentoItem;
  logs: AtendimentoLogItem[];
  logsLoading: boolean;
  onClose: () => void;
  onStatusChange: (id: number, status: StatusAtendimento) => Promise<void>;
  onRegistrarLog: (id: number, descricao: string) => Promise<void>;
  onAgendarVisita?: (atendimentoId: number, dados: AgendarDados) => Promise<void>;
  onCriarOrcamento?: (atendimentoId: number) => void;
}

export function ProcessDetailModal({
  item,
  logs,
  logsLoading,
  onClose,
  onStatusChange,
  onRegistrarLog,
  onAgendarVisita,
  onCriarOrcamento,
}: ProcessDetailModalProps) {
  const [abaAtiva, setAbaAtiva] = useState<'geral' | 'historico' | 'agendamento'>('geral');
  const [descricaoDraft, setDescricaoDraft] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const agendarRef = useRef<AgendarVisitaHandle>(null);

  const acoes = montarAcoesAtendimento(item);

  const getInicial = (nome?: string | null) => {
    if (!nome) return 'AT';
    const partes = nome.trim().split(' ');
    return partes.length >= 2 ? (partes[0][0] + partes[1][0]).toUpperCase() : nome.slice(0, 2).toUpperCase();
  };

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
    if (!descricaoDraft.trim() && !isValid) return;

    setSalvando(true);
    try {
      if (descricaoDraft.trim()) {
        await onRegistrarLog(item.id, descricaoDraft.trim());
      }
      const agendarDados = agendarRef.current?.getDados();
      if (agendarDados && onAgendarVisita) {
        await onAgendarVisita(item.id, agendarDados);
      }
      setDescricaoDraft('');
      onClose();
    } catch (err: any) {
      setErro(err?.message || 'Erro ao salvar registro de atendimento.');
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
        onCriarOrcamento?.(item.id);
      }
    } catch (err: any) {
      setErro(err?.message || 'Erro ao executar ação.');
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
                <StatusBadge status={item.status} />
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
            Visita / Agendamento
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

            {item.descricao && (
              <div className="rounded-2xl border border-border/60 bg-background p-4 space-y-1.5 shadow-2xs">
                <span className="font-bold text-xs text-foreground uppercase tracking-wider">Descrição Inicial da Solicitação:</span>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{item.descricao}</p>
              </div>
            )}

            {/* Ações Rápidas */}
            <div className="space-y-2 pt-2">
              <span className="font-bold text-xs text-foreground uppercase tracking-wider">Próximos Passos Recomendados:</span>
              <div className="flex flex-wrap gap-2">
                {acoes.map((acao) => (
                  <button
                    key={acao.label}
                    type="button"
                    disabled={salvando}
                    onClick={() => void executarAcao(acao)}
                    className="rounded-xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground px-4 py-2 text-xs font-bold transition-all shadow-2xs disabled:opacity-50"
                  >
                    {acao.label}
                  </button>
                ))}
              </div>
            </div>
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

        {/* Conteúdo Aba Agendamento */}
        {abaAtiva === 'agendamento' && (
          <div className="space-y-4">
            <AgendarVisita ref={agendarRef} disabled={salvando} titulo="Seleção de Slots & CEP para Vistoria" />
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
            {salvando ? 'Salvando...' : 'Salvar e Concluir'}
          </button>
        </div>
      </div>
    </div>
  );
}
