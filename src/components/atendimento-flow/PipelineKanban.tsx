import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../ui/StatusBadge';
import type { AtendimentoItem } from '../../lib/api';

export interface PipelineStage {
  id: string;
  titulo: string;
  descricao: string;
  corHeader: string;
  badgeBg: string;
  icone: React.ReactNode;
}

export const COLUNAS_PADRAO: PipelineStage[] = [
  {
    id: 'NOVO',
    titulo: 'Novos Leads',
    descricao: 'Solicitações recentes de contato',
    corHeader: 'border-t-info text-info',
    badgeBg: 'bg-info/10 text-info border-info/30',
    icone: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
  },
  {
    id: 'VISITA_AGENDADA',
    titulo: 'Visita Agendada',
    descricao: 'Vistoria técnica agendada',
    corHeader: 'border-t-primary text-primary',
    badgeBg: 'bg-primary/10 text-primary border-primary/30',
    icone: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: 'ORCAMENTAMENTO',
    titulo: 'Orçamentos',
    descricao: 'Cálculo de materiais & mão de obra',
    corHeader: 'border-t-warning text-warning',
    badgeBg: 'bg-warning/10 text-warning border-warning/30',
    icone: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    id: 'OS_EXECUCAO',
    titulo: 'OS em Execução',
    descricao: 'Obra e aplicação em andamento',
    corHeader: 'border-t-success text-success',
    badgeBg: 'bg-success/10 text-success border-success/30',
    icone: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    id: 'CONCLUIDO',
    titulo: 'Concluídos',
    descricao: 'Entregues e arquivados',
    corHeader: 'border-t-muted-foreground text-muted-foreground',
    badgeBg: 'bg-muted text-muted-foreground border-border',
    icone: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
];

interface PipelineKanbanProps {
  items: AtendimentoItem[];
  loading?: boolean;
  onSelectCard: (item: AtendimentoItem) => void;
  onNovoAtendimento?: () => void;
  /**
   * Mesmo fluxo do botão "Iniciar Orçamento" do modal (card Visita Agendada):
   * visita realizada + encaminhar p/ orçamento + abrir o wizard de novo
   * orçamento com os dados do atendimento.
   */
  onCriarOrcamento?: (id: number) => Promise<void> | void;
}

export function PipelineKanban({
  items,
  loading = false,
  onSelectCard,
  onCriarOrcamento,
}: PipelineKanbanProps) {
  const navigate = useNavigate();
  const agruparItensPorEstagio = (estagioId: string): AtendimentoItem[] => {
    return items.filter((item) => {
      const temAgendamento =
        item.visitaSolicitada ||
        (item.agendamentos && item.agendamentos.length > 0) ||
        (item._count?.agendamentos ?? 0) > 0;

      if (estagioId === 'NOVO') {
        return item.status === 'NOVO' && !temAgendamento;
      }
      if (estagioId === 'VISITA_AGENDADA') {
        return (
          temAgendamento &&
          (item.status === 'NOVO' || item.status === 'EM_ANDAMENTO')
        );
      }
      if (estagioId === 'ORCAMENTAMENTO') {
        return item.status === 'ORCAMENTAMENTO';
      }
      if (estagioId === 'OS_EXECUCAO') {
        return item.status === 'EM_ANDAMENTO' && !temAgendamento;
      }
      if (estagioId === 'CONCLUIDO') {
        return item.status === 'CONCLUIDO' || item.status === 'INATIVO';
      }
      return false;
    });
  };

  const getInicial = (nome?: string | null) => {
    if (!nome) return 'AT';
    const partes = nome.trim().split(' ');
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nome.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5 overflow-x-auto pb-4">
        {COLUNAS_PADRAO.map((coluna) => {
          const cards = agruparItensPorEstagio(coluna.id);
          return (
            <div
              key={coluna.id}
              className={`flex flex-col rounded-2xl border bg-card/60 backdrop-blur-md p-3.5 shadow-sm border-t-4 ${coluna.corHeader} min-w-[280px] transition-all`}
            >
              {/* Header da Coluna */}
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded-lg border ${coluna.badgeBg}`}>
                    {coluna.icone}
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-foreground tracking-tight flex items-center gap-1.5">
                      {coluna.titulo}
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {coluna.descricao}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${coluna.badgeBg}`}>
                  {cards.length}
                </span>
              </div>

              {/* Lista de Cards */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[680px] pr-1 scrollbar-thin">
                {loading ? (
                  <div className="flex flex-col items-center justify-center p-8 space-y-2">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-xs text-muted-foreground">Carregando...</span>
                  </div>
                ) : cards.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-xs text-muted-foreground">
                    <svg className="h-8 w-8 text-muted-foreground/40 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Nenhum atendimento neste estágio</span>
                  </div>
                ) : (
                  cards.map((item) => {
                    const inicial = getInicial(item.user?.nome);
                    const abrirOrcamentos = coluna.id === 'ORCAMENTAMENTO';
                    return (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (abrirOrcamentos) {
                            if (onCriarOrcamento) {
                              void Promise.resolve(
                                onCriarOrcamento(item.id),
                              ).catch((err) => {
                                console.error(
                                  'Erro ao iniciar orçamento pelo kanban:',
                                  err,
                                );
                              });
                              return;
                            }
                            navigate(
                              `/orcamentos?view=novo&atendimentoId=${item.id}`,
                            );
                            return;
                          }
                          onSelectCard(item);
                        }}
                        className="group relative cursor-pointer rounded-xl border border-border/70 bg-card p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg space-y-3"
                      >
                        {/* Top Bar Card */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/40 font-bold text-xs text-primary ring-2 ring-primary/20">
                              {inicial}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                {item.user?.nome || `Atendimento #${item.id}`}
                              </h4>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                #{item.id} • {item.canal}
                              </span>
                            </div>
                          </div>
                          <StatusBadge
                            status={item.status}
                            size="sm"
                            labelOverride={coluna.id === 'VISITA_AGENDADA' ? 'Visita Agendada' : undefined}
                          />
                        </div>

                        {/* Contato & Detalhes */}
                        {item.user?.telefone && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <svg className="h-3.5 w-3.5 text-primary/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                            </svg>
                            <span>{item.user.telefone}</span>
                          </div>
                        )}

                        {item.descricao && (
                          <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/40 p-2 rounded-lg border border-border/40 font-normal leading-relaxed">
                            {item.descricao}
                          </p>
                        )}

                        {/* Footer Card */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {item.urgencia && item.urgencia !== 'NORMAL' && (
                              <span className="rounded-md bg-destructive/10 border border-destructive/20 px-1.5 py-0.5 text-[10px] font-bold text-destructive">
                                {item.urgencia}
                              </span>
                            )}
                            <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                              Abrir →
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
