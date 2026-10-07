import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneInput } from '../components/ui/phone-input';
import { EmailInput } from '../components/ui/email-input';
import { AgendarVisita, type AgendarDados, type AgendarVisitaHandle } from '../components/agendamento/AgendarVisita';
import { CORES_STATUS, ROTULOS_STATUS } from '../lib/atendimento-status';
import { acaoPresente, montarAcoesAtendimento, type AcaoUI } from '../lib/proximas-acoes';
import { PipelineKanban } from '../components/atendimento-flow/PipelineKanban';
import { ProcessDetailModal } from '../components/atendimento-flow/ProcessDetailModal';
import { ProcessFilters } from '../components/ui/ProcessFilters';
import {
  type AtendimentoItem,
  type AtendimentoLogItem,
  atualizarAtendimento,
  atualizarStatusAgendamento,
  atualizarStatusAtendimento,
  atualizarVisita,
  buscarUsuarios,
  type CanalAtendimento,
  criarAgendamento,
  criarAtendimento,
  encaminharParaOrcamento,
  listarAtendimentos,
  listarLogsAtendimento,
  listarVisitas,
  type MeuUser,
  registrarLogAtendimento,
  type StatusAtendimento,
  type Urgencia,
} from '../lib/api';

interface AtendimentosAnalisesProps {
  atendimentos: AtendimentoItem[];
}

export function AtendimentosAnalises({
  atendimentos,
}: AtendimentosAnalisesProps) {
  const total = atendimentos.length;
  const novos = atendimentos.filter((c) => c.status === 'NOVO').length;
  const emAndamento = atendimentos.filter(
    (c) => c.status === 'EM_ANDAMENTO',
  ).length;
  const concluidos = atendimentos.filter(
    (c) => c.status === 'CONCLUIDO',
  ).length;
  const inativos = atendimentos.filter((c) => c.status === 'INATIVO').length;

  const porCanal = atendimentos.reduce(
    (acc, c) => {
      acc[c.canal] = (acc[c.canal] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Análises & Métricas Operacionais
        </h2>
        <p className="text-sm text-muted-foreground">
          Visão geral da taxa de conversão, volume por estágio e canais de entrada.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur-md p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Geral
            </span>
            <span className="p-1.5 rounded-lg bg-muted text-foreground">
              📊
            </span>
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-foreground">{total}</p>
          <p className="text-[11px] text-muted-foreground">Oportunidades em carteira</p>
        </div>

        <div className="rounded-2xl border border-info/30 bg-info/5 backdrop-blur-md p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-info">
              Novos Leads
            </span>
            <span className="p-1.5 rounded-lg bg-info/10 text-info">
              🆕
            </span>
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-info">{novos}</p>
          <p className="text-[11px] text-info/80">Aguardando 1º contato</p>
        </div>

        <div className="rounded-2xl border border-primary/30 bg-primary/5 backdrop-blur-md p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Em Atendimento
            </span>
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              ⚡
            </span>
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-primary">{emAndamento}</p>
          <p className="text-[11px] text-primary/80">Visitas ou orçamentos</p>
        </div>

        <div className="rounded-2xl border border-success/30 bg-success/5 backdrop-blur-md p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-success">
              Concluídos
            </span>
            <span className="p-1.5 rounded-lg bg-success/10 text-success">
              ✅
            </span>
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-success">{concluidos}</p>
          <p className="text-[11px] text-success/80">Obras e serviços entregues</p>
        </div>

        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 backdrop-blur-md p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-destructive">
              Inativos
            </span>
            <span className="p-1.5 rounded-lg bg-destructive/10 text-destructive">
              ⏸
            </span>
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-destructive">{inativos}</p>
          <p className="text-[11px] text-destructive/80">Cancelados ou arquivados</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur-md p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-foreground tracking-tight">Distribuição por Canal de Atendimento</h3>
        <div className="space-y-3">
          {Object.entries(porCanal).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum dado registrado.
            </p>
          ) : (
            Object.entries(porCanal).map(([canal, qtd]) => {
              const perc = total ? Math.round((qtd / total) * 100) : 0;
              return (
                <div key={canal} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-foreground">
                    <span>{canal}</span>
                    <span>
                      {qtd} ({perc}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500 rounded-full"
                      style={{ width: `${perc}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

interface AtendimentoListProps {
  atendimentos: AtendimentoItem[];
  loading: boolean;
  busca: string;
  onBuscaChange: (v: string) => void;
  statusFiltro: string;
  onStatusFiltroChange: (v: string) => void;
  criadoDe: string;
  onCriadoDeChange: (v: string) => void;
  criadoAte: string;
  onCriadoAteChange: (v: string) => void;
  atualizadoDe: string;
  onAtualizadoDeChange: (v: string) => void;
  atualizadoAte: string;
  onAtualizadoAteChange: (v: string) => void;
  onStatusChange: (
    id: number,
    status: StatusAtendimento,
  ) => Promise<void> | void;
  onCarregarLogs: (id: number) => Promise<AtendimentoLogItem[]>;
  onRegistrarLog: (id: number, descricao: string) => Promise<void>;
  onAgendarVisita?: (atendimentoId: number, dados: AgendarDados) => Promise<void>;
  onEncaminhar?: (id: number) => Promise<void> | void;
  onToggleVisitaSolicitada?: (
    id: number,
    visitaSolicitada: boolean,
  ) => Promise<void> | void;
  onCriarOrcamento?: (id: number) => void;
}

export function AtendimentoList({
  atendimentos,
  loading,
  busca,
  onBuscaChange,
  statusFiltro,
  onStatusFiltroChange,
  criadoDe,
  onCriadoDeChange,
  criadoAte,
  onCriadoAteChange,
  atualizadoDe,
  onAtualizadoDeChange,
  atualizadoAte,
  onAtualizadoAteChange,
  onStatusChange,
  onCarregarLogs,
  onRegistrarLog,
  onAgendarVisita,
  onEncaminhar,
  onToggleVisitaSolicitada,
  onCriarOrcamento,
}: AtendimentoListProps) {
  const [expandidoId, setExpandidoId] = useState<number | null>(null);
  const [logs, setLogs] = useState<AtendimentoLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [descricaoDraft, setDescricaoDraft] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const agendarRef = useRef<AgendarVisitaHandle>(null);

  const classesBotaoAcao = (tone: AcaoUI['tone']) =>
    ({
      primary:
        'bg-primary text-primary-foreground shadow hover:bg-primary/90',
      outline:
        'border text-foreground hover:bg-primary/10 hover:text-primary',
      success: 'bg-success text-success-foreground hover:bg-success/90',
      destructive:
        'border border-destructive/40 text-destructive hover:bg-destructive/10',
      muted: 'border text-muted-foreground hover:bg-primary/10',
    })[tone];

  const executarAcao = async (item: AtendimentoItem, acao: AcaoUI) => {
    if (acao.nota) return;
    setErroSalvar(null);
    try {
      if (acao.status) {
        await onStatusChange(item.id, acao.status);
      } else if (acao.encaminhar) {
        await onEncaminhar?.(item.id);
      } else if (acao.criarOrcamento) {
        onCriarOrcamento?.(item.id);
      }
    } catch (err) {
      console.error('Erro ao executar ação do atendimento:', err);
      setErroSalvar(
        err instanceof Error ? err.message : 'Erro ao executar ação.',
      );
    }
  };

  const alternarExpandido = async (id: number) => {
    setErroSalvar(null);
    if (expandidoId === id) {
      setExpandidoId(null);
      setLogs([]);
      setDescricaoDraft('');
      return;
    }
    setExpandidoId(id);
    setDescricaoDraft('');
    setLogsLoading(true);
    setLogs([]);
    try {
      setLogs(await onCarregarLogs(id));
    } catch (err) {
      console.error('Erro ao carregar logs do atendimento:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const salvarLog = async (atendimento: AtendimentoItem) => {
    setErroSalvar(null);
    const isAgendar = agendarRef.current?.isAgendar() ?? false;

    if (isAgendar) {
      const agendarOk = agendarRef.current?.tentarValidar() ?? false;
      if (!agendarOk) {
        setErroSalvar('Informe um CEP válido e selecione um horário disponível.');
        return;
      }
    }

    const isValid = agendarRef.current?.isValid() ?? false;
    if (!descricaoDraft.trim() && !isValid) return;

    setSalvando(true);
    try {
      if (descricaoDraft.trim()) {
        await onRegistrarLog(atendimento.id, descricaoDraft.trim());
      }
      const agendarDados = agendarRef.current?.getDados();
      if (agendarDados && onAgendarVisita) {
        await onAgendarVisita(atendimento.id, agendarDados);
      }
      setLogs(await onCarregarLogs(atendimento.id));
      setDescricaoDraft('');
      fecharExpandido();
    } catch (err) {
      console.error('Erro ao registrar atendimento:', err);
      setErroSalvar(
        err instanceof Error ? err.message : 'Erro ao salvar atendimento.',
      );
    } finally {
      setSalvando(false);
    }
  };

  const fecharExpandido = () => {
    setExpandidoId(null);
    setLogs([]);
    setDescricaoDraft('');
    setErroSalvar(null);
  };

  return (
    <div className="space-y-4">
      {/* Tabela de atendimentos */}
      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">Prioridade</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Carregando atendimentos...
                </td>
              </tr>
            ) : atendimentos.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Nenhum atendimento encontrado.
                </td>
              </tr>
            ) : (
              atendimentos.map((item) => (
                <Fragment key={item.id}>
                  <tr className="hover:bg-primary/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {item.user?.nome ?? `Atendimento #${item.id}`}
                      </div>
                      {item.atendente && (
                        <div className="text-xs text-muted-foreground">
                          Atendente: {item.atendente.nome}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.user?.telefone ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${item.urgencia === 'URGENTISSIMO'
                          ? 'bg-destructive/15 text-destructive'
                          : item.urgencia === 'URGENTE'
                            ? 'bg-warning/15 text-warning'
                            : 'bg-muted text-muted-foreground'
                          }`}
                      >
                        {item.urgencia ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CORES_STATUS[item.status] ?? CORES_STATUS.INATIVO}`}
                      >
                        {ROTULOS_STATUS[item.status] ?? item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => alternarExpandido(item.id)}
                        className="rounded-md border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        {expandidoId === item.id ? '▾ Fechar' : '▸ Atendimento'}
                      </button>
                    </td>
                  </tr>
                  {expandidoId === item.id && (
                    <tr className="bg-primary/10">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="space-y-3">
                          {item.descricao && (
                            <div className="rounded-md border bg-background p-2.5 text-xs">
                              <span className="font-semibold text-foreground">Descrição:</span>{' '}
                              <span className="text-muted-foreground whitespace-pre-wrap">
                                {item.descricao}
                              </span>
                            </div>
                          )}
                          <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.visitaSolicitada}
                              disabled={salvando}
                              onChange={(e) => {
                                const novo = e.target.checked;
                                setErroSalvar(null);
                                Promise.resolve(
                                  onToggleVisitaSolicitada?.(item.id, novo),
                                ).catch((err: unknown) => {
                                  console.error(
                                    'Erro ao atualizar visita solicitada:',
                                    err,
                                  );
                                  setErroSalvar(
                                    err instanceof Error
                                      ? err.message
                                      : 'Erro ao atualizar visita solicitada.',
                                  );
                                });
                              }}
                              className="h-3.5 w-3.5 rounded border-input"
                            />
                            Visita solicitada
                          </label>
                          <div className="text-sm font-semibold text-foreground">
                            Histórico de Atendimento
                          </div>
                          {logsLoading ? (
                            <p className="text-xs text-muted-foreground">
                              Carregando histórico...
                            </p>
                          ) : logs.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              Nenhum registro ainda.
                            </p>
                          ) : (
                            <ul className="space-y-2">
                              {logs.map((l) => (
                                <li
                                  key={l.id}
                                  className="rounded-md border bg-background p-2.5 text-xs space-y-1"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium text-foreground">
                                      {l.tipo === 'STATUS' ? (
                                        <>
                                          Status: {l.statusDe} → {l.statusPara}
                                        </>
                                      ) : (
                                        'Atendimento'
                                      )}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {new Date(l.createdAt).toLocaleString(
                                        'pt-BR',
                                      )}
                                    </span>
                                  </div>
                                  {l.tipo === 'TEXTO' && l.descricao && (
                                    <p className="text-muted-foreground whitespace-pre-wrap">
                                      {l.descricao}
                                    </p>
                                  )}
                                  <div className="text-muted-foreground">
                                    por {l.atendente?.nome ?? 'Sistema'}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">
                              Registrar atendimento
                            </label>
                            <textarea
                              rows={3}
                              maxLength={1000}
                              value={descricaoDraft}
                              onChange={(e) =>
                                setDescricaoDraft(e.target.value)
                              }
                              placeholder="Descreva o atendimento realizado..."
                              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                            {acaoPresente(item, 'CRIAR_AGENDAMENTO') &&
                              onAgendarVisita && (
                                <AgendarVisita
                                  ref={agendarRef}
                                  disabled={salvando}
                                  titulo="Horários Disponíveis"
                                />
                              )}
                            {erroSalvar && (
                              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                                {erroSalvar}
                              </div>
                            )}
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-foreground">
                                Próximas ações
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {montarAcoesAtendimento(item).map((acao) => (
                                  <button
                                    key={acao.label}
                                    type="button"
                                    disabled={acao.nota || salvando}
                                    title={
                                      acao.nota
                                        ? 'Registrar visita a partir do agendamento'
                                        : undefined
                                    }
                                    onClick={() => void executarAcao(item, acao)}
                                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${classesBotaoAcao(acao.tone)}`}
                                  >
                                    {acao.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => salvarLog(item)}
                                disabled={salvando}
                                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors disabled:opacity-50"
                              >
                                {salvando ? 'Salvando...' : 'Salvar'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface NovoAtendimentoFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const campoInput =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
const campoLabel = 'text-xs font-semibold text-foreground';

export function NovoAtendimentoForm({
  onSuccess,
  onCancel,
}: NovoAtendimentoFormProps) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [descricao, setDescricao] = useState('');
  const [canal, setCanal] = useState<CanalAtendimento | ''>('LOJA');
  const [urgencia, setUrgencia] = useState<Urgencia | ''>('NORMAL');
  const agendarFormRef = useRef<AgendarVisitaHandle>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [sugestoes, setSugestoes] = useState<MeuUser[]>([]);
  const [buscandoUsuarios, setBuscandoUsuarios] = useState(false);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [userIdSelecionado, setUserIdSelecionado] = useState<
    number | null
  >(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nomeContainerRef = useRef<HTMLDivElement | null>(null);

  async function buscarUsuariosPorNome(valor: string) {
    const q = valor.trim();
    if (q.length < 3) {
      setDropdownAberto(false);
      setSugestoes([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setBuscandoUsuarios(true);
      setDropdownAberto(true);
      try {
        const data = await buscarUsuarios(q);
        console.log('buscarUsuarios:', q, '→', data.length, 'resultados', data);
        setSugestoes(data);
      } catch (err) {
        console.error('Erro ao buscar usuarios:', err);
        setSugestoes([]);
      } finally {
        setBuscandoUsuarios(false);
      }
    }, 300);
  }

  function selecionarUsuario(usuario: MeuUser) {
    setUserIdSelecionado(usuario.id);
    setNome(usuario.nome);
    if (usuario.telefone) setTelefone(usuario.telefone);
    if (usuario.email) setEmail(usuario.email);
    if (usuario.cpfCnpj) setCpf(usuario.cpfCnpj);
    setDropdownAberto(false);
    setSugestoes([]);
  }

  useEffect(() => {
    function fecharFora(event: MouseEvent) {
      if (
        nomeContainerRef.current &&
        !nomeContainerRef.current.contains(event.target as Node)
      ) {
        setDropdownAberto(false);
      }
    }
    document.addEventListener('mousedown', fecharFora);
    return () => {
      document.removeEventListener('mousedown', fecharFora);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canal || !urgencia) {
      setErro('Preencha Canal e Prioridade.');
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      const agendarDados = agendarFormRef.current?.getDados();
      const atendimentoCriado = await criarAtendimento({
        userId: userIdSelecionado ?? undefined,
        userName: nome,
        userTelefone: telefone,
        userEmail: email || undefined,
        userCpfCnpj: cpf || undefined,
        descricao: descricao || undefined,
        canal,
        urgencia,
        visitaSolicitada: agendarDados != null,
      });

      if (agendarDados) {
        await criarAgendamento({
          userId: atendimentoCriado.user?.id ?? userIdSelecionado ?? 0,
          atendimentoId: atendimentoCriado.id,
          tipo: 'VISITA' as const,
          dataPrevista: new Date(agendarDados.slotIso).toISOString(),
          enderecoNovo: {
            logradouro: agendarDados.endereco || undefined,
            numero: agendarDados.numero || undefined,
            complemento: agendarDados.complemento || undefined,
            bairro: agendarDados.bairro || undefined,
            cidade: agendarDados.cidade || undefined,
            estado: agendarDados.estado || undefined,
            cep: agendarDados.cep || undefined,
          },
        });
      }

      onSuccess();
    } catch (err: any) {
      setErro(err?.message || 'Falha ao cadastrar atendimento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Novo Atendimento</h2>
        <p className="text-sm text-muted-foreground">
          Registre uma nova interação ou atendimento a um cliente.
        </p>
      </div>

      {erro && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
          {erro}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border bg-card p-5 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={campoLabel}>Nome *</label>
            <div className="relative" ref={nomeContainerRef}>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  setUserIdSelecionado(null);
                  buscarUsuariosPorNome(e.target.value);
                }}
                className={campoInput}
                placeholder="Nome do cliente"
              />
              {dropdownAberto && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border bg-background shadow-md">
                  {buscandoUsuarios ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      Buscando...
                    </p>
                  ) : sugestoes.length === 0 ? (
                    <div className="px-3 py-2.5 text-sm text-muted-foreground">
                      <p>Nenhum cliente encontrado. Preencha os campos abaixo para cadastrar.</p>
                    </div>
                  ) : (
                    <ul className="py-1">
                      {sugestoes.map((usuario) => (
                        <li key={usuario.id}>
                          <button
                            type="button"
                            onClick={() => selecionarUsuario(usuario)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <div className="font-medium">{usuario.nome}</div>
                            <div className="text-xs text-muted-foreground">
                              {usuario.telefone ||
                                usuario.email ||
                                usuario.cpfCnpj ||
                                'Sem contato'}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Digite 3 letras para buscar um cliente cadastrado e preencher
              automaticamente.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className={campoLabel}>Telefone *</label>
            <PhoneInput
              required
              value={telefone}
              onChange={setTelefone}
              className={campoInput}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={campoLabel}>E-mail</label>
            <EmailInput
              value={email}
              onChange={setEmail}
              className={campoInput}
            />
          </div>
          <div className="space-y-1.5">
            <label className={campoLabel}>CPF/CNPJ</label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className={campoInput}
              placeholder="000.000.000-00"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className={campoLabel}>Canal *</label>
            <select
              value={canal}
              onChange={(e) => setCanal(e.target.value as CanalAtendimento | '')}
              required
              className={campoInput}
            >
              <option value="FORMULARIO">FORMULÁRIO</option>
              <option value="LOJA">LOJA</option>
              <option value="TELEFONE">TELEFONE</option>
              <option value="WHATSAPP">WHATSAPP</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={campoLabel}>Prioridade *</label>
            <select
              value={urgencia}
              onChange={(e) => setUrgencia(e.target.value as Urgencia | '')}
              required
              className={campoInput}
            >
              <option value="">Selecione...</option>
              <option value="NORMAL">NORMAL</option>
              <option value="URGENTE">URGENTE</option>
              <option value="URGENTISSIMO">URGENTÍSSIMO</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={campoLabel}>Descrição</label>
          <textarea
            rows={3}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className={campoInput}
            placeholder="Detalhes da solicitação..."
          />
        </div>

        <div className="pt-1">
          <AgendarVisita
            ref={agendarFormRef}
            disabled={loading}
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Atendimento'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface AtendimentosAdminPageProps {
  initialView?: 'analises' | 'lista' | 'novo';
  onNavegar?: (view: 'analises' | 'lista' | 'novo') => void;
}

export function AtendimentosAdminPage({
  initialView = 'lista',
  onNavegar,
}: AtendimentosAdminPageProps) {
  const navigate = useNavigate();
  const [modoVisao, setModoVisao] = useState<'kanban' | 'tabela'>('kanban');
  const [atendimentos, setAtendimentos] = useState<AtendimentoItem[]>([]);
  const [atendimentosTodos, setAtendimentosTodos] = useState<AtendimentoItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [criadoDe, setCriadoDe] = useState('');
  const [criadoAte, setCriadoAte] = useState('');
  const [atualizadoDe, setAtualizadoDe] = useState('');
  const [atualizadoAte, setAtualizadoAte] = useState('');
  const [itemSelecionadoModal, setItemSelecionadoModal] =
    useState<AtendimentoItem | null>(null);
  const [logsModal, setLogsModal] = useState<AtendimentoLogItem[]>([]);
  const [logsModalLoading, setLogsModalLoading] = useState(false);

  const mudarView = (novaView: 'analises' | 'lista' | 'novo') => {
    if (onNavegar) onNavegar(novaView);
  };

  const carregarAtendimentos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listarAtendimentos({
        status: statusFiltro || undefined,
        q: busca || undefined,
        criadoDe: criadoDe || undefined,
        criadoAte: criadoAte || undefined,
        atualizadoDe: atualizadoDe || undefined,
        atualizadoAte: atualizadoAte || undefined,
      });
      setAtendimentos(data);
    } catch (err) {
      console.error('Erro ao listar atendimentos:', err);
    } finally {
      setLoading(false);
    }
  }, [busca, statusFiltro, criadoDe, criadoAte, atualizadoDe, atualizadoAte]);

  const carregarTodosAtendimentos = useCallback(async () => {
    try {
      const data = await listarAtendimentos();
      setAtendimentosTodos(data);
    } catch (err) {
      console.error('Erro ao listar todos os atendimentos:', err);
    }
  }, []);

  useEffect(() => {
    carregarAtendimentos();
  }, [carregarAtendimentos]);

  useEffect(() => {
    carregarTodosAtendimentos();
  }, [carregarTodosAtendimentos]);

  const handleStatusInline = async (id: number, status: StatusAtendimento) => {
    try {
      await atualizarStatusAtendimento(id, status);
      await Promise.all([carregarAtendimentos(), carregarTodosAtendimentos()]);
    } catch (err) {
      console.error('Erro ao atualizar status do atendimento:', err);
      throw err;
    }
  };

  const handleEncaminhar = async (id: number) => {
    await encaminharParaOrcamento(id);
    await Promise.all([carregarAtendimentos(), carregarTodosAtendimentos()]);
  };

  const handleToggleVisita = async (id: number, visitaSolicitada: boolean) => {
    await atualizarAtendimento(id, { visitaSolicitada });
    await Promise.all([carregarAtendimentos(), carregarTodosAtendimentos()]);
  };

  const handleCriarOrcamento = async (id: number) => {
    try {
      const visitas = await listarVisitas({ atendimentoId: id });
      let visitaRealizada = visitas.some((v) => v.status === 'REALIZADA');

      if (!visitaRealizada) {
        const pendente = visitas.find((v) => v.status === 'AGENDADA');
        if (pendente) {
          await atualizarVisita(pendente.id, { status: 'REALIZADA' });
          visitaRealizada = true;
        }
      }

      if (!visitaRealizada) {
        await atualizarAtendimento(id, { visitaSolicitada: false });
      }

      await encaminharParaOrcamento(id);
      await Promise.all([carregarAtendimentos(), carregarTodosAtendimentos()]);
      navigate(`/orcamentos?view=novo&atendimentoId=${id}`);
    } catch (err) {
      console.error('Erro ao iniciar orçamento:', err);
      throw err;
    }
  };

  const handleCarregarLogs = (id: number) => listarLogsAtendimento(id);

  const handleRegistrarLog = async (id: number, descricao: string) => {
    await registrarLogAtendimento(id, descricao);
    await Promise.all([carregarAtendimentos(), carregarTodosAtendimentos()]);
    if (itemSelecionadoModal?.id === id) {
      try {
        const logsData = await listarLogsAtendimento(id);
        setLogsModal(logsData);
      } catch (refreshErr) {
        console.error('Erro ao atualizar logs do modal:', refreshErr);
      }
    }
  };

  const handleAgendarVisita = async (atendimentoId: number, dados: AgendarDados) => {
    const atendimento = atendimentos.find((a) => a.id === atendimentoId);
    const userId = atendimento?.user?.id ?? atendimento?.userId;
    if (!userId) {
      throw new Error('Atendimento sem cliente vinculado. Não é possível agendar.');
    }
    try {
      if (!atendimento?.visitaSolicitada) {
        await atualizarAtendimento(atendimentoId, { visitaSolicitada: true });
      }
      const payload = {
        userId,
        atendimentoId,
        tipo: 'VISITA' as const,
        dataPrevista: new Date(dados.slotIso).toISOString(),
        enderecoNovo: {
          logradouro: dados.endereco || undefined,
          numero: dados.numero || undefined,
          complemento: dados.complemento || undefined,
          bairro: dados.bairro || undefined,
          cidade: dados.cidade || undefined,
          estado: dados.estado || undefined,
          cep: dados.cep || undefined,
        },
      };
      await criarAgendamento(payload);
      await Promise.all([carregarAtendimentos(), carregarTodosAtendimentos()]);
      if (itemSelecionadoModal?.id === atendimentoId) {
        try {
          const fresco = await listarAtendimentos();
          const atualizado = fresco.find((a) => a.id === atendimentoId);
          if (atualizado) setItemSelecionadoModal(atualizado);
          const logsData = await listarLogsAtendimento(atendimentoId);
          setLogsModal(logsData);
        } catch (refreshErr) {
          console.error('Erro ao atualizar dados do modal:', refreshErr);
        }
      }
    } catch (err: unknown) {
      console.error('[handleAgendarVisita] error:', err);
      if (err instanceof Error) throw err;
      throw new Error('Erro ao agendar visita técnica.');
    }
  };

  const handleCancelarAgendamento = async (agendamentoId: number) => {
    await atualizarStatusAgendamento(agendamentoId, 'CANCELADO');
  };

  const handleAbrirModal = async (item: AtendimentoItem) => {
    setItemSelecionadoModal(item);
    setLogsModalLoading(true);
    try {
      const logsData = await handleCarregarLogs(item.id);
      setLogsModal(logsData);
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
    } finally {
      setLogsModalLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {initialView === 'analises' && (
        <AtendimentosAnalises atendimentos={atendimentosTodos} />
      )}
      {initialView === 'lista' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Funil Operacional de Atendimento
              </h2>
              <p className="text-sm text-muted-foreground">
                Gerenciamento unificado de leads, visitas, orçamentos e ordens de serviço.
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-lg border bg-muted p-1">
              <button
                type="button"
                onClick={() => setModoVisao('kanban')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  modoVisao === 'kanban'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Kanban (Funil)
              </button>
              <button
                type="button"
                onClick={() => setModoVisao('tabela')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  modoVisao === 'tabela'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Tabela
              </button>
            </div>
          </div>

          <ProcessFilters
            busca={busca}
            onBuscaChange={setBusca}
            statusFiltro={statusFiltro}
            onStatusFiltroChange={setStatusFiltro}
            opcoesStatus={[
              { value: 'NOVO', label: 'NOVO' },
              { value: 'EM_ANDAMENTO', label: 'EM ANDAMENTO' },
              { value: 'ORCAMENTAMENTO', label: 'EM ORÇAMENTO' },
              { value: 'CONCLUIDO', label: 'CONCLUÍDO' },
              { value: 'INATIVO', label: 'INATIVO' },
            ]}
            dataDe={criadoDe}
            onDataDeChange={setCriadoDe}
            dataAte={criadoAte}
            onDataAteChange={setCriadoAte}
          />

          {modoVisao === 'kanban' ? (
            <PipelineKanban
              items={
                (busca || statusFiltro || criadoDe || criadoAte || atualizadoDe || atualizadoAte)
                  ? atendimentos
                  : atendimentosTodos
              }
              loading={loading}
              onSelectCard={handleAbrirModal}
            />
          ) : (
            <AtendimentoList
              atendimentos={atendimentos}
              loading={loading}
              busca={busca}
              onBuscaChange={setBusca}
              statusFiltro={statusFiltro}
              onStatusFiltroChange={setStatusFiltro}
              criadoDe={criadoDe}
              onCriadoDeChange={setCriadoDe}
              criadoAte={criadoAte}
              onCriadoAteChange={setCriadoAte}
              atualizadoDe={atualizadoDe}
              onAtualizadoDeChange={setAtualizadoDe}
              atualizadoAte={atualizadoAte}
              onAtualizadoAteChange={setAtualizadoAte}
              onStatusChange={handleStatusInline}
              onCarregarLogs={handleCarregarLogs}
              onRegistrarLog={handleRegistrarLog}
              onAgendarVisita={handleAgendarVisita}
              onEncaminhar={handleEncaminhar}
              onToggleVisitaSolicitada={handleToggleVisita}
              onCriarOrcamento={handleCriarOrcamento}
            />
          )}
        </div>
      )}
      {initialView === 'novo' && (
        <NovoAtendimentoForm
          onSuccess={() => {
            mudarView('lista');
            Promise.all([carregarAtendimentos(), carregarTodosAtendimentos()]);
          }}
          onCancel={() => mudarView('lista')}
        />
      )}

      {itemSelecionadoModal && (
        <ProcessDetailModal
          item={itemSelecionadoModal}
          logs={logsModal}
          logsLoading={logsModalLoading}
          onClose={() => setItemSelecionadoModal(null)}
          onStatusChange={handleStatusInline}
          onRegistrarLog={handleRegistrarLog}
          onAgendarVisita={handleAgendarVisita}
          onCancelarAgendamento={handleCancelarAgendamento}
          onCriarOrcamento={handleCriarOrcamento}
        />
      )}
    </div>
  );
}
