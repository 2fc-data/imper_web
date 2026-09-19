import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  type AgendamentoItem,
  atualizarStatusAgendamento,
  buscarClientes,
  criarAgendamento,
  listarAgendamentos,
  listarUsuarios,
  type MeuCliente,
  removerAgendamento,
  type StatusAgendamento,
  type TipoAgendamento,
  type Usuario,
} from '../lib/api';
import { SlotPicker } from '../components/disponibilidade/SlotPicker';

const rotulosTipo: Record<TipoAgendamento, string> = {
  VISITA: 'Visita',
  ORCAMENTO: 'Orçamento',
  RETORNO: 'Retorno',
  REUNIAO: 'Reunião',
};

const rotulosStatus: Record<StatusAgendamento, string> = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  REALIZADO: 'Realizado',
  CANCELADO: 'Cancelado',
  NAO_COMPARECEU: 'Não compareceu',
};

const corStatus: Record<StatusAgendamento, string> = {
  PENDENTE: 'border-warning/40 text-warning',
  CONFIRMADO: 'border-info/40 text-info',
  REALIZADO: 'border-success/40 text-success',
  CANCELADO: 'border-destructive/40 text-destructive',
  NAO_COMPARECEU: 'border-destructive/40 text-destructive',
};

function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR');
}

interface AgendamentosAnalisesProps {
  agendamentos: AgendamentoItem[];
}

export function AgendamentosAnalises({
  agendamentos,
}: AgendamentosAnalisesProps) {
  const total = agendamentos.length;
  const pendentes = agendamentos.filter((a) => a.status === 'PENDENTE').length;
  const confirmados = agendamentos.filter(
    (a) => a.status === 'CONFIRMADO',
  ).length;
  const realizados = agendamentos.filter(
    (a) => a.status === 'REALIZADO',
  ).length;
  const cancelados = agendamentos.filter(
    (a) => a.status === 'CANCELADO',
  ).length;

  const porTipo = agendamentos.reduce(
    (acc, a) => {
      acc[a.tipo] = (acc[a.tipo] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const porStatus = agendamentos.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Análises de Agendamentos
        </h2>
        <p className="text-sm text-muted-foreground">
          Visão geral do volume e status dos agendamentos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Total de Agendamentos
          </p>
          <p className="mt-2 text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-warning">Pendentes</p>
          <p className="mt-2 text-2xl font-bold">{pendentes}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-info">Confirmados</p>
          <p className="mt-2 text-2xl font-bold">{confirmados}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-success">Realizados</p>
          <p className="mt-2 text-2xl font-bold">{realizados}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-destructive">Cancelados</p>
          <p className="mt-2 text-2xl font-bold">{cancelados}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-base">Distribuição por Tipo</h3>
          <div className="space-y-2">
            {Object.entries(porTipo).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum dado registrado.
              </p>
            ) : (
              Object.entries(porTipo).map(([tipo, qtd]) => {
                const perc = total ? Math.round((qtd / total) * 100) : 0;
                return (
                  <div key={tipo} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>
                        {rotulosTipo[tipo as TipoAgendamento] ?? tipo}
                      </span>
                      <span>
                        {qtd} ({perc}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-primary/40 overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${perc}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-base">Distribuição por Status</h3>
          <div className="space-y-2">
            {Object.entries(porStatus).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum dado registrado.
              </p>
            ) : (
              Object.entries(porStatus).map(([status, qtd]) => {
                const perc = total ? Math.round((qtd / total) * 100) : 0;
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>
                        {rotulosStatus[status as StatusAgendamento] ?? status}
                      </span>
                      <span>
                        {qtd} ({perc}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-primary/40 overflow-hidden">
                      <div
                        className="h-full bg-warning transition-all"
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
    </div>
  );
}

interface AgendamentoListProps {
  agendamentos: AgendamentoItem[];
  loading: boolean;
  statusFiltro: string;
  onStatusFiltroChange: (v: string) => void;
  tipoFiltro: string;
  onTipoFiltroChange: (v: string) => void;
  onStatusChange: (id: number, status: StatusAgendamento) => void;
  onRemover: (id: number) => void;
}

export function AgendamentoList({
  agendamentos,
  loading,
  statusFiltro,
  onStatusFiltroChange,
  tipoFiltro,
  onTipoFiltroChange,
  onStatusChange,
  onRemover,
}: AgendamentoListProps) {
  const [expandidoId, setExpandidoId] = useState<number | null>(null);
  const [busca, setBusca] = useState('');

  const alternarExpandido = (id: number) => {
    setExpandidoId(expandidoId === id ? null : id);
  };

  const filtrados = agendamentos.filter((item) => {
    if (!busca.trim()) return true;
    const alvo = [
      item.cliente?.nome ?? '',
      item.atendimento?.descricao ?? '',
      item.user?.nome ?? '',
      item.observacoes ?? '',
      item.endereco?.logradouro ?? '',
      item.endereco?.bairro ?? item.endereco?.cidade ?? '',
    ]
      .join(' ')
      .toLowerCase();
    return alvo.includes(busca.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Lista de Agendamentos
          </h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe e gerencie os agendamentos com clientes.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por cliente, endereço ou observações..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <select
          value={statusFiltro}
          onChange={(e) => onStatusFiltroChange(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">TODOS OS STATUS</option>
          <option value="PENDENTE">PENDENTE</option>
          <option value="CONFIRMADO">CONFIRMADO</option>
          <option value="REALIZADO">REALIZADO</option>
          <option value="CANCELADO">CANCELADO</option>
          <option value="NAO_COMPARECEU">NÃO COMPARECEU</option>
        </select>
        <select
          value={tipoFiltro}
          onChange={(e) => onTipoFiltroChange(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">TODOS OS TIPOS</option>
          <option value="VISITA">VISITA</option>
          <option value="ORCAMENTO">ORÇAMENTO</option>
          <option value="RETORNO">RETORNO</option>
          <option value="REUNIAO">REUNIÃO</option>
        </select>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Profissional</th>
              <th className="px-4 py-3">Data Prevista</th>
              <th className="px-4 py-3">Status</th>
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
                  Carregando agendamentos...
                </td>
              </tr>
            ) : filtrados.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Nenhum agendamento encontrado.
                </td>
              </tr>
            ) : (
              filtrados.map((item) => (
                <Fragment key={item.id}>
                  <tr className="hover:bg-primary/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {item.cliente?.nome ?? `Agendamento #${item.id}`}
                      </div>
                      {item.cliente?.telefone && (
                        <div className="text-xs text-muted-foreground">
                          {item.cliente.telefone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold">
                      {rotulosTipo[item.tipo] ?? item.tipo}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.user?.nome ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatarData(item.dataPrevista)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          onStatusChange(
                            item.id,
                            e.target.value as StatusAgendamento,
                          )
                        }
                        className={`cursor-pointer rounded-md border bg-background px-2 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors ${corStatus[item.status] ??
                          'border-input text-muted-foreground'
                          }`}
                      >
                        <option value="PENDENTE">PENDENTE</option>
                        <option value="CONFIRMADO">CONFIRMADO</option>
                        <option value="REALIZADO">REALIZADO</option>
                        <option value="CANCELADO">CANCELADO</option>
                        <option value="NAO_COMPARECEU">NÃO COMPARECEU</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => alternarExpandido(item.id)}
                        className="rounded-md border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        {expandidoId === item.id ? '▾ Fechar' : '▸ Detalhes'}
                      </button>
                    </td>
                  </tr>
                  {expandidoId === item.id && (
                    <tr className="bg-primary/10">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2 text-xs">
                            <div className="font-semibold text-foreground text-sm">
                              Informações
                            </div>
                            <p className="text-muted-foreground">
                              <span className="font-medium text-foreground">
                                Prevista:
                              </span>{' '}
                              {formatarData(item.dataPrevista)}
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-medium text-foreground">
                                Realizada:
                              </span>{' '}
                              {formatarData(item.dataRealizada)}
                            </p>
                            {item.atendimento && (
                              <p className="text-muted-foreground">
                                <span className="font-medium text-foreground">
                                  Atendimento:
                                </span>{' '}
                                #{item.atendimento.id} —{' '}
                                {item.atendimento.descricao}
                              </p>
                            )}
                            {item.observacoes && (
                              <p className="text-muted-foreground whitespace-pre-wrap">
                                <span className="font-medium text-foreground">
                                  Observações:
                                </span>{' '}
                                {item.observacoes}
                              </p>
                            )}
                          </div>
                          {item.endereco && (
                            <div className="space-y-2 text-xs">
                              <div className="font-semibold text-foreground text-sm">
                                Endereço
                              </div>
                              <p className="text-muted-foreground">
                                {item.endereco.logradouro}
                                {item.endereco.numero
                                  ? `, ${item.endereco.numero}`
                                  : ''}
                              </p>
                              {(item.endereco.bairro ||
                                item.endereco.cidade) && (
                                  <p className="text-muted-foreground">
                                    {[
                                      item.endereco.bairro,
                                      item.endereco.cidade,
                                      item.endereco.estado,
                                    ]
                                      .filter(Boolean)
                                      .join(' — ')}
                                  </p>
                                )}
                            </div>
                          )}
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => onRemover(item.id)}
                            className="rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            Excluir agendamento
                          </button>
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

interface NovoAgendamentoFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const campoInput =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
const campoLabel = 'text-xs font-semibold text-foreground';

export function NovoAgendamentoForm({
  onSuccess,
  onCancel,
}: NovoAgendamentoFormProps) {
  const [nomeCliente, setNomeCliente] = useState('');
  const [clienteIdSelecionado, setClienteIdSelecionado] = useState<
    number | null
  >(null);
  const [userId, setUserId] = useState('');
  const [tipo, setTipo] = useState<TipoAgendamento>('VISITA');
  const [dataPrevista, setDataPrevista] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [sugestoes, setSugestoes] = useState<MeuCliente[]>([]);
  const [buscandoClientes, setBuscandoClientes] = useState(false);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nomeContainerRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarUsuarios()
      .then((data) => {
        const papeisValidos = ['ADMIN', 'SUPERVISOR', 'ATENDENTE', 'TECNICO'];
        const profissionais = data.filter((u) =>
          papeisValidos.includes(u.papel),
        );
        setUsuarios(profissionais);
      })
      .catch((err) => console.error('Erro ao listar usuários:', err));
  }, []);

  async function buscarClientesPorNome(valor: string) {
    const q = valor.trim();
    if (q.length < 3) {
      setDropdownAberto(false);
      setSugestoes([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setBuscandoClientes(true);
      setDropdownAberto(true);
      try {
        const data = await buscarClientes(q);
        setSugestoes(data);
      } catch {
        setSugestoes([]);
      } finally {
        setBuscandoClientes(false);
      }
    }, 300);
  }

  function selecionarCliente(cliente: MeuCliente) {
    setClienteIdSelecionado(cliente.id);
    setNomeCliente(cliente.nome);
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
    setLoading(true);
    setErro(null);
    try {
      if (!clienteIdSelecionado) {
        throw new Error('Selecione um cliente cadastrado.');
      }
      await criarAgendamento({
        clienteId: clienteIdSelecionado,
        userId: userId ? Number(userId) : undefined,
        tipo,
        dataPrevista: new Date(dataPrevista).toISOString(),
        observacoes: observacoes || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setErro(err?.message || 'Falha ao criar agendamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Novo Agendamento</h2>
        <p className="text-sm text-muted-foreground">
          Agende uma visita, orçamento, retorno ou reunião com um cliente.
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
        <div className="space-y-1.5">
          <label className={campoLabel}>Cliente *</label>
          <div className="relative" ref={nomeContainerRef}>
            <input
              type="text"
              required
              value={nomeCliente}
              onChange={(e) => {
                setNomeCliente(e.target.value);
                setClienteIdSelecionado(null);
                buscarClientesPorNome(e.target.value);
              }}
              className={campoInput}
              placeholder="Nome do cliente"
            />
            {dropdownAberto && (
              <div className="absolute z-20 mt-1 w-full rounded-lg border bg-background shadow-md">
                {buscandoClientes ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    Buscando...
                  </p>
                ) : sugestoes.length === 0 ? (
                  <div className="px-3 py-2.5 text-sm text-muted-foreground space-y-1.5">
                    <p>Nenhum cliente encontrado</p>
                    <Link
                      to="/usuarios?view=novo"
                      onClick={() => setDropdownAberto(false)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      ➕ Ir para Cadastro de Usuário
                    </Link>
                  </div>
                ) : (
                  <ul className="py-1">
                    {sugestoes.map((cliente) => (
                      <li key={cliente.id}>
                        <button
                          type="button"
                          onClick={() => selecionarCliente(cliente)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <div className="font-medium">{cliente.nome}</div>
                          <div className="text-xs text-muted-foreground">
                            {cliente.telefone ||
                              cliente.email ||
                              cliente.cpfCnpj ||
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
            Digite 3 letras para buscar um cliente cadastrado.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={campoLabel}>Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoAgendamento)}
              className={campoInput}
            >
              <option value="VISITA">Visita</option>
              <option value="ORCAMENTO">Orçamento</option>
              <option value="RETORNO">Retorno</option>
              <option value="REUNIAO">Reunião</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={campoLabel}>Profissional responsável</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className={campoInput}
            >
              <option value="">Não definido</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={campoLabel}>Data e hora prevista *</label>
          <SlotPicker
            value={dataPrevista}
            onChange={setDataPrevista}
          />
        </div>

        <div className="space-y-1.5">
          <label className={campoLabel}>Observações</label>
          <textarea
            rows={3}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className={campoInput}
            placeholder="Detalhes do agendamento..."
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
            {loading ? 'Salvando...' : 'Salvar Agendamento'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface AgendamentosAdminPageProps {
  initialView?: 'analises' | 'lista' | 'novo';
  onNavegar?: (view: 'analises' | 'lista' | 'novo') => void;
}

export function AgendamentosAdminPage({
  initialView = 'lista',
  onNavegar,
}: AgendamentosAdminPageProps) {
  const { user } = useAuth();
  const [agendamentos, setAgendamentos] = useState<AgendamentoItem[]>([]);
  const [agendamentosTodos, setAgendamentosTodos] = useState<AgendamentoItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');

  const mudarView = (novaView: 'analises' | 'lista' | 'novo') => {
    if (onNavegar) onNavegar(novaView);
  };

  const carregarAgendamentos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listarAgendamentos({
        status: (statusFiltro || undefined) as StatusAgendamento | undefined,
        tipo: (tipoFiltro || undefined) as TipoAgendamento | undefined,
      });
      setAgendamentos(data);
    } catch (err) {
      console.error('Erro ao listar agendamentos:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFiltro, tipoFiltro]);

  const carregarTodosAgendamentos = useCallback(async () => {
    try {
      const data = await listarAgendamentos();
      setAgendamentosTodos(data);
    } catch (err) {
      console.error('Erro ao listar todos os agendamentos:', err);
    }
  }, []);

  useEffect(() => {
    carregarAgendamentos();
  }, [carregarAgendamentos]);

  useEffect(() => {
    carregarTodosAgendamentos();
  }, [carregarTodosAgendamentos]);

  const handleStatusInline = async (id: number, status: StatusAgendamento) => {
    try {
      const alvo = agendamentos.find((a) => a.id === id);
      const dataRealizada =
        status === 'REALIZADO' && !alvo?.dataRealizada
          ? new Date().toISOString()
          : undefined;
      await atualizarStatusAgendamento(id, status, dataRealizada);
      await Promise.all([carregarAgendamentos(), carregarTodosAgendamentos()]);
    } catch (err) {
      console.error('Erro ao atualizar status do agendamento:', err);
    }
  };

  const handleRemover = async (id: number) => {
    if (!window.confirm('Excluir este agendamento?')) return;
    try {
      await removerAgendamento(id);
      await Promise.all([carregarAgendamentos(), carregarTodosAgendamentos()]);
    } catch (err) {
      console.error('Erro ao excluir agendamento:', err);
    }
  };

  return (
    <div className="p-6">
      {initialView === 'analises' && (
        <AgendamentosAnalises agendamentos={agendamentosTodos} />
      )}
      {initialView === 'lista' && (
        <AgendamentoList
          agendamentos={agendamentos}
          loading={loading}
          statusFiltro={statusFiltro}
          onStatusFiltroChange={setStatusFiltro}
          tipoFiltro={tipoFiltro}
          onTipoFiltroChange={setTipoFiltro}
          onStatusChange={handleStatusInline}
          onRemover={handleRemover}
        />
      )}
      {initialView === 'novo' && (
        <NovoAgendamentoForm
          onSuccess={() => {
            mudarView('lista');
            Promise.all([carregarAgendamentos(), carregarTodosAgendamentos()]);
          }}
          onCancel={() => mudarView('lista')}
        />
      )}
    </div>
  );
}
