import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import {
  type AtendimentoItem,
  type AtendimentoLogItem,
  atualizarStatusAtendimento,
  buscarClientes,
  type CanalAtendimento,
  criarAtendimento,
  listarAtendimentos,
  listarLogsAtendimento,
  type MeuCliente,
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

  const porMotivo = atendimentos.reduce(
    (acc, c) => {
      acc[c.motivo] = (acc[c.motivo] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Análises de Atendimentos
        </h2>
        <p className="text-sm text-muted-foreground">
          Visão geral do volume, status e canais dos atendimentos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Total de Atendimentos
          </p>
          <p className="mt-2 text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-info">Novos</p>
          <p className="mt-2 text-2xl font-bold">{novos}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-primary">Em Andamento</p>
          <p className="mt-2 text-2xl font-bold">{emAndamento}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-success">Concluídos</p>
          <p className="mt-2 text-2xl font-bold">{concluidos}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-destructive">Inativos</p>
          <p className="mt-2 text-2xl font-bold">{inativos}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-base">Distribuição por Canal</h3>
          <div className="space-y-2">
            {Object.entries(porCanal).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum dado registrado.
              </p>
            ) : (
              Object.entries(porCanal).map(([canal, qtd]) => {
                const perc = total ? Math.round((qtd / total) * 100) : 0;
                return (
                  <div key={canal} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{canal}</span>
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
          <h3 className="font-semibold text-base">Distribuição por Motivo</h3>
          <div className="space-y-2">
            {Object.entries(porMotivo).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum dado registrado.
              </p>
            ) : (
              Object.entries(porMotivo).map(([motivo, qtd]) => {
                const perc = total ? Math.round((qtd / total) * 100) : 0;
                return (
                  <div key={motivo} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{motivo}</span>
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
  onStatusChange: (id: number, status: StatusAtendimento) => void;
  onCarregarLogs: (id: number) => Promise<AtendimentoLogItem[]>;
  onRegistrarLog: (id: number, descricao: string) => Promise<void>;
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
}: AtendimentoListProps) {
  const [expandidoId, setExpandidoId] = useState<number | null>(null);
  const [logs, setLogs] = useState<AtendimentoLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [descricaoDraft, setDescricaoDraft] = useState('');
  const [salvando, setSalvando] = useState(false);

  const alternarExpandido = async (id: number) => {
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

  const salvarLog = async (id: number) => {
    if (!descricaoDraft.trim()) return;
    setSalvando(true);
    try {
      await onRegistrarLog(id, descricaoDraft.trim());
      setLogs(await onCarregarLogs(id));
      setDescricaoDraft('');
    } catch (err) {
      console.error('Erro ao registrar atendimento:', err);
    } finally {
      setSalvando(false);
    }
  };

  const fecharExpandido = () => {
    setExpandidoId(null);
    setLogs([]);
    setDescricaoDraft('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Lista de Atendimentos
          </h2>
          <p className="text-sm text-muted-foreground">
            Gerencie todas as interações e atendimentos recebidos.
          </p>
        </div>
      </div>

      {/* Barra de busca e filtros */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar por nome, cliente ou descrição..."
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
            <option value="">TODOS</option>
            <option value="NOVO">NOVO</option>
            <option value="EM_ANDAMENTO">EM ANDAMENTO</option>
            <option value="CONCLUIDO">CONCLUÍDO</option>
            <option value="INATIVO">INATIVO</option>
          </select>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              Cadastro:
            </span>
            <input
              type="date"
              value={criadoDe}
              onChange={(e) => onCriadoDeChange(e.target.value)}
              className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <span className="text-xs text-muted-foreground">até</span>
            <input
              type="date"
              value={criadoAte}
              onChange={(e) => onCriadoAteChange(e.target.value)}
              className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              Atualização:
            </span>
            <input
              type="date"
              value={atualizadoDe}
              onChange={(e) => onAtualizadoDeChange(e.target.value)}
              className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <span className="text-xs text-muted-foreground">até</span>
            <input
              type="date"
              value={atualizadoAte}
              onChange={(e) => onAtualizadoAteChange(e.target.value)}
              className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Tabela de atendimentos */}
      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">Canal / Motivo</th>
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
                        {item.cliente?.nome ?? `Atendimento #${item.id}`}
                      </div>
                      {item.atendente && (
                        <div className="text-xs text-muted-foreground">
                          Atendente: {item.atendente.nome}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.cliente?.telefone ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-semibold">{item.canal}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.motivo}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          onStatusChange(
                            item.id,
                            e.target.value as StatusAtendimento,
                          )
                        }
                        className={`cursor-pointer rounded-md border bg-background px-2 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors ${
                          item.status === 'NOVO'
                            ? 'border-info/40 text-info'
                            : item.status === 'EM_ANDAMENTO'
                              ? 'border-primary/40 text-primary'
                              : item.status === 'CONCLUIDO'
                                ? 'border-success/40 text-success'
                                : item.status === 'INATIVO'
                                  ? 'border-destructive/40 text-destructive'
                                  : 'border-input text-muted-foreground'
                        }`}
                      >
                        <option value="NOVO">NOVO</option>
                        <option value="EM_ANDAMENTO">EM ANDAMENTO</option>
                        <option value="CONCLUIDO">CONCLUÍDO</option>
                        <option value="INATIVO">INATIVO</option>
                      </select>
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
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={fecharExpandido}
                                className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => salvarLog(item.id)}
                                disabled={salvando || !descricaoDraft.trim()}
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
  const [descricao, setDescricao] = useState('');
  const [canal, setCanal] = useState<CanalAtendimento>('WHATSAPP');
  const [motivo, setMotivo] = useState('DUVIDA');
  const [urgencia, setUrgencia] = useState<Urgencia>('NORMAL');
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [cepValido, setCepValido] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [sugestoes, setSugestoes] = useState<MeuCliente[]>([]);
  const [buscandoClientes, setBuscandoClientes] = useState(false);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [clienteIdSelecionado, setClienteIdSelecionado] = useState<
    number | null
  >(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nomeContainerRef = useRef<HTMLDivElement | null>(null);

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
    setNome(cliente.nome);
    if (cliente.telefone) setTelefone(cliente.telefone);
    if (cliente.email) setEmail(cliente.email);
    if (cliente.endereco) setEndereco(cliente.endereco);
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

  async function buscarCep(digitos: string) {
    if (!/^\d{8}$/.test(digitos)) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.erro) {
        setErro('CEP não encontrado. Verifique e tente novamente.');
        setCepValido(false);
        return;
      }
      setErro(null);
      setCepValido(true);
      setEndereco(data.logradouro ?? '');
      setBairro(data.bairro ?? '');
      setCidade(data.localidade ?? '');
      setEstado(data.uf ?? '');
    } catch {
      setCepValido(false);
      setErro('Não foi possível consultar o CEP. Tente novamente.');
    }
  }

  function formatarCep(valor: string) {
    const digitos = valor.replace(/\D/g, '').slice(0, 8);
    if (digitos.length > 5) return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
    return digitos;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    try {
      await criarAtendimento({
        clienteId: clienteIdSelecionado ?? undefined,
        nome,
        telefone,
        email: email || undefined,
        descricao: descricao || undefined,
        canal,
        motivo,
        urgencia,
        enderecoNovo: {
          logradouro: endereco || undefined,
          numero: numero || undefined,
          complemento: complemento || undefined,
          bairro: bairro || undefined,
          cidade: cidade || undefined,
          estado: estado || undefined,
          cep: cep || undefined,
        },
      });
      onSuccess();
    } catch (err: any) {
      setErro(err?.message || 'Falha ao cadastrar atendimento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
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
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      Nenhum cliente encontrado
                    </p>
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
              Digite 3 letras para buscar um cliente cadastrado e preencher
              automaticamente.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className={campoLabel}>Telefone *</label>
            <input
              type="text"
              required
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className={campoInput}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={campoLabel}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={campoInput}
              placeholder="voce@empresa.com"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className={campoLabel}>Canal</label>
            <select
              value={canal}
              onChange={(e) => setCanal(e.target.value as CanalAtendimento)}
              className={campoInput}
            >
              <option value="WHATSAPP">WHATSAPP</option>
              <option value="FORMULARIO">FORMULÁRIO</option>
              <option value="LOJA">LOJA</option>
              <option value="TELEFONE">TELEFONE</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={campoLabel}>Motivo</label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className={campoInput}
            >
              <option value="DUVIDA">DÚVIDA</option>
              <option value="AGENDAR_AVALIACAO_ORCAMENTO">
                AGENDAR AVALIAÇÃO DE ORÇAMENTO
              </option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={campoLabel}>Urgência</label>
            <select
              value={urgencia}
              onChange={(e) => setUrgencia(e.target.value as Urgencia)}
              className={campoInput}
            >
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

        <div className="space-y-1.5">
          <label className={campoLabel}>CEP (Local da visita técnica)</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => {
              const valor = formatarCep(e.target.value);
              setCep(valor);
              if (valor.replace(/\D/g, '').length === 8) {
                buscarCep(valor.replace(/\D/g, ''));
              }
            }}
            className={campoInput}
          />
          <p className="text-xs text-muted-foreground">
            Ao informar o CEP, preenchemos endereço, bairro, cidade e UF
            automaticamente.
          </p>
        </div>

        {cepValido && (
          <>
            <div className="space-y-1.5">
              <label className={campoLabel}>Endereço</label>
              <input
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className={campoInput}
                placeholder="Rua, avenida..."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_120px]">
              <div className="space-y-1.5">
                <label className={campoLabel}>Bairro</label>
                <input
                  type="text"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className={campoInput}
                  placeholder="Bairro"
                />
              </div>
              <div className="space-y-1.5">
                <label className={campoLabel}>Cidade</label>
                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className={campoInput}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-1.5">
                <label className={campoLabel}>UF</label>
                <input
                  type="text"
                  maxLength={2}
                  value={estado}
                  onChange={(e) => setEstado(e.target.value.toUpperCase())}
                  className={campoInput}
                  placeholder="UF"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className={campoLabel}>Número</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className={campoInput}
                  placeholder="Número"
                />
              </div>
              <div className="space-y-1.5">
                <label className={campoLabel}>Complemento</label>
                <input
                  type="text"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  className={campoInput}
                  placeholder="Apto, bloco..."
                />
              </div>
            </div>
          </>
        )}

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
    }
  };

  const handleCarregarLogs = (id: number) => listarLogsAtendimento(id);

  const handleRegistrarLog = async (id: number, descricao: string) => {
    await registrarLogAtendimento(id, descricao);
    await Promise.all([carregarAtendimentos(), carregarTodosAtendimentos()]);
  };

  return (
    <div className="p-6">
      {initialView === 'analises' && (
        <AtendimentosAnalises atendimentos={atendimentosTodos} />
      )}
      {initialView === 'lista' && (
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
        />
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
    </div>
  );
}
