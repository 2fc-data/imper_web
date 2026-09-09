import { Fragment, useCallback, useEffect, useState } from 'react';
import {
  type AtendimentoItem,
  agendarVisita,
  cancelarVisita,
  listarAtendimentos,
  listarUsuarios,
  listarVisitas,
  type ResultadoVisita,
  realizarVisitaV2,
  type StatusVisita,
  type Urgencia,
  type Usuario,
  type VisitaItem,
} from '../lib/api';

const rotulosStatus: Record<StatusVisita, string> = {
  AGENDADA: 'Agendada',
  REALIZADA: 'Realizada',
  CANCELADA: 'Cancelada',
};

const corStatus: Record<StatusVisita, string> = {
  AGENDADA: 'border-info/40 text-info',
  REALIZADA: 'border-success/40 text-success',
  CANCELADA: 'border-destructive/40 text-destructive',
};

const rotulosResultado: Record<ResultadoVisita, string> = {
  SEM_ACAO: 'Sem ação necessária',
  ORCAMENTO_NECESSARIO: 'Orçamento necessário',
  OBRA_NECESSARIA: 'Obra necessária',
  CLIENTE_AUSENTE: 'Cliente ausente',
};

const rotulosUrgencia: Record<Urgencia, string> = {
  NORMAL: 'Normal',
  URGENTE: 'Urgente',
  URGENTISSIMO: 'Urgentíssimo',
};

function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR');
}

interface VisitasAnalisesProps {
  visitas: VisitaItem[];
}

export function VisitasAnalises({ visitas }: VisitasAnalisesProps) {
  const total = visitas.length;
  const agendadas = visitas.filter((v) => v.status === 'AGENDADA').length;
  const realizadas = visitas.filter((v) => v.status === 'REALIZADA').length;
  const canceladas = visitas.filter((v) => v.status === 'CANCELADA').length;
  const comOrcamento = visitas.filter((v) => v.necessitaOrcamento).length;
  const comObra = visitas.filter((v) => v.necessitaObra).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Análises de Visitas
        </h2>
        <p className="text-sm text-muted-foreground">
          Visão geral do andamento das visitas técnicas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Total de Visitas
          </p>
          <p className="mt-2 text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-info">Agendadas</p>
          <p className="mt-2 text-2xl font-bold">{agendadas}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-success">Realizadas</p>
          <p className="mt-2 text-2xl font-bold">{realizadas}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-destructive">Canceladas</p>
          <p className="mt-2 text-2xl font-bold">{canceladas}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-warning">
            Com orçamento pendente
          </p>
          <p className="mt-2 text-2xl font-bold">{comOrcamento}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
        <h3 className="font-semibold text-base">Desdobramentos das visitas</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-background p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Necessita orçamento
            </p>
            <p className="mt-1 text-lg font-bold">{comOrcamento}</p>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Necessita obra
            </p>
            <p className="mt-1 text-lg font-bold">{comObra}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface VisitasListProps {
  visitas: VisitaItem[];
  loading: boolean;
  statusFiltro: string;
  onStatusFiltroChange: (v: string) => void;
  onCancelar: (id: number) => void;
  onRealizar: (id: number) => void;
}

export function VisitasList({
  visitas,
  loading,
  statusFiltro,
  onStatusFiltroChange,
  onCancelar,
  onRealizar,
}: VisitasListProps) {
  const [expandidoId, setExpandidoId] = useState<number | null>(null);
  const [busca, setBusca] = useState('');

  const alternarExpandido = (id: number) => {
    setExpandidoId(expandidoId === id ? null : id);
  };

  const filtrados = visitas.filter((item) => {
    if (!busca.trim()) return true;
    const alvo = [
      item.atendimento?.cliente?.nome ?? '',
      item.atendimento?.descricao ?? '',
      item.tecnico?.nome ?? '',
      item.relatorio ?? '',
      item.constatacao ?? '',
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
          <h2 className="text-xl font-bold tracking-tight">Lista de Visitas</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe as visitas técnicas agendadas aos clientes.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por cliente, descrição ou técnico..."
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
          <option value="AGENDADA">AGENDADA</option>
          <option value="REALIZADA">REALIZADA</option>
          <option value="CANCELADA">CANCELADA</option>
        </select>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Técnico</th>
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
                  Carregando visitas...
                </td>
              </tr>
            ) : filtrados.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Nenhuma visita encontrada.
                </td>
              </tr>
            ) : (
              filtrados.map((item) => (
                <Fragment key={item.id}>
                  <tr className="hover:bg-primary/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {item.atendimento?.cliente?.nome ??
                          `Visita #${item.id}`}
                      </div>
                      {item.urgencia && (
                        <div className="text-xs text-muted-foreground">
                          {rotulosUrgencia[item.urgencia]}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[240px]">
                      <span className="line-clamp-2">
                        {item.atendimento?.descricao ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.tecnico?.nome ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatarData(item.dataPrevista)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-md border px-2 py-1 text-xs font-medium ${corStatus[item.status]}`}
                      >
                        {rotulosStatus[item.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => alternarExpandido(item.id)}
                          className="rounded-md border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          {expandidoId === item.id ? '▾ Fechar' : '▸ Detalhes'}
                        </button>
                        {item.status === 'AGENDADA' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onRealizar(item.id)}
                              className="rounded-md bg-success px-2.5 py-1 text-xs font-medium text-success-foreground hover:bg-success/90 transition-colors"
                            >
                              Realizar
                            </button>
                            <button
                              type="button"
                              onClick={() => onCancelar(item.id)}
                              className="rounded-md border border-destructive/40 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
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
                            {item.atendimento?.id && (
                              <p className="text-muted-foreground">
                                <span className="font-medium text-foreground">
                                  Atendimento:
                                </span>{' '}
                                #{item.atendimento.id}
                              </p>
                            )}
                            {item.resultado && (
                              <p className="text-muted-foreground">
                                <span className="font-medium text-foreground">
                                  Resultado:
                                </span>{' '}
                                {rotulosResultado[item.resultado]}
                              </p>
                            )}
                            {item.relatorio && (
                              <p className="text-muted-foreground whitespace-pre-wrap">
                                <span className="font-medium text-foreground">
                                  Relatório:
                                </span>{' '}
                                {item.relatorio}
                              </p>
                            )}
                            {item.constatacao && (
                              <p className="text-muted-foreground whitespace-pre-wrap">
                                <span className="font-medium text-foreground">
                                  Constatação:
                                </span>{' '}
                                {item.constatacao}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="font-semibold text-foreground text-sm">
                              Desdobramentos
                            </div>
                            <p className="text-muted-foreground">
                              <span className="font-medium text-foreground">
                                Necessita orçamento:
                              </span>{' '}
                              {item.necessitaOrcamento ? 'Sim' : 'Não'}
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-medium text-foreground">
                                Necessita obra:
                              </span>{' '}
                              {item.necessitaObra ? 'Sim' : 'Não'}
                            </p>
                            {typeof item._count?.orcamentos === 'number' && (
                              <p className="text-muted-foreground">
                                <span className="font-medium text-foreground">
                                  Orçamentos gerados:
                                </span>{' '}
                                {item._count.orcamentos}
                              </p>
                            )}
                            {item.endereco && (
                              <>
                                <div className="font-semibold text-foreground text-sm pt-2">
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
                              </>
                            )}
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

interface AgendarVisitaFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const campoInput =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
const campoLabel = 'text-xs font-semibold text-foreground';

export function AgendarVisitaForm({
  onSuccess,
  onCancel,
}: AgendarVisitaFormProps) {
  const [atendimentoId, setAtendimentoId] = useState('');
  const [tecnicoId, setTecnicoId] = useState('');
  const [dataPrevista, setDataPrevista] = useState('');
  const [urgencia, setUrgencia] = useState<Urgencia>('NORMAL');

  const [atendimentos, setAtendimentos] = useState<AtendimentoItem[]>([]);
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarAtendimentos()
      .then((data) => setAtendimentos(data))
      .catch((err) => console.error('Erro ao listar atendimentos:', err));
    listarUsuarios()
      .then((data) => {
        const papeisValidos = ['TECNICO', 'ADMIN', 'SUPERVISOR'];
        setTecnicos(data.filter((u) => papeisValidos.includes(u.papel)));
      })
      .catch((err) => console.error('Erro ao listar técnicos:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    try {
      if (!atendimentoId) {
        throw new Error('Selecione o atendimento.');
      }
      await agendarVisita({
        atendimentoId: Number(atendimentoId),
        tecnicoId: tecnicoId ? Number(tecnicoId) : undefined,
        dataPrevista: dataPrevista
          ? new Date(dataPrevista).toISOString()
          : undefined,
        urgencia,
      });
      onSuccess();
    } catch (err: any) {
      setErro(err?.message || 'Falha ao agendar visita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Agendar Visita</h2>
        <p className="text-sm text-muted-foreground">
          Vincule uma visita técnica a um atendimento.
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
          <label className={campoLabel}>Atendimento *</label>
          <select
            required
            value={atendimentoId}
            onChange={(e) => setAtendimentoId(e.target.value)}
            className={campoInput}
          >
            <option value="">Selecione um atendimento...</option>
            {atendimentos.map((a) => (
              <option key={a.id} value={a.id}>
                #{a.id} — {a.cliente?.nome ?? 'Sem cliente'} —{' '}
                {a.descricao?.slice(0, 60) ?? 'Sem descrição'}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={campoLabel}>Técnico</label>
            <select
              value={tecnicoId}
              onChange={(e) => setTecnicoId(e.target.value)}
              className={campoInput}
            >
              <option value="">Não definido</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={campoLabel}>Urgência</label>
            <select
              value={urgencia}
              onChange={(e) => setUrgencia(e.target.value as Urgencia)}
              className={campoInput}
            >
              <option value="NORMAL">Normal</option>
              <option value="URGENTE">Urgente</option>
              <option value="URGENTISSIMO">Urgentíssimo</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={campoLabel}>Data e hora prevista</label>
          <input
            type="datetime-local"
            value={dataPrevista}
            onChange={(e) => setDataPrevista(e.target.value)}
            className={campoInput}
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
            {loading ? 'Agendando...' : 'Agendar Visita'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface RealizarVisitaFormProps {
  visita: VisitaItem;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RealizarVisitaForm({
  visita,
  onSuccess,
  onCancel,
}: RealizarVisitaFormProps) {
  const [relatorio, setRelatorio] = useState('');
  const [urgencia, setUrgencia] = useState<Urgencia>(
    visita.urgencia ?? 'NORMAL',
  );
  const [resultado, setResultado] = useState<ResultadoVisita>('SEM_ACAO');
  const [constatacao, setConstatacao] = useState('');
  const [necessitaOrcamento, setNecessitaOrcamento] = useState(false);
  const [necessitaObra, setNecessitaObra] = useState(false);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    try {
      await realizarVisitaV2(visita.id, {
        relatorio: relatorio || undefined,
        urgencia,
        resultado,
        constatacao: constatacao || undefined,
        necessitaOrcamento,
        necessitaObra,
      });
      onSuccess();
    } catch (err: any) {
      setErro(err?.message || 'Falha ao registrar visita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Realizar Visita #{visita.id}
        </h2>
        <p className="text-sm text-muted-foreground">
          Registre o relatório e o resultado da visita técnica.
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
          <label className={campoLabel}>Relatório *</label>
          <textarea
            required
            rows={4}
            value={relatorio}
            onChange={(e) => setRelatorio(e.target.value)}
            className={campoInput}
            placeholder="Descreva o que foi realizado na visita..."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={campoLabel}>Resultado</label>
            <select
              value={resultado}
              onChange={(e) => setResultado(e.target.value as ResultadoVisita)}
              className={campoInput}
            >
              <option value="SEM_ACAO">Sem ação necessária</option>
              <option value="ORCAMENTO_NECESSARIO">Orçamento necessário</option>
              <option value="OBRA_NECESSARIA">Obra necessária</option>
              <option value="CLIENTE_AUSENTE">Cliente ausente</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={campoLabel}>Urgência</label>
            <select
              value={urgencia}
              onChange={(e) => setUrgencia(e.target.value as Urgencia)}
              className={campoInput}
            >
              <option value="NORMAL">Normal</option>
              <option value="URGENTE">Urgente</option>
              <option value="URGENTISSIMO">Urgentíssimo</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={campoLabel}>Constatação</label>
          <textarea
            rows={3}
            value={constatacao}
            onChange={(e) => setConstatacao(e.target.value)}
            className={campoInput}
            placeholder="O que foi constatado no local..."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={necessitaOrcamento}
              onChange={(e) => setNecessitaOrcamento(e.target.checked)}
              className="h-4 w-4"
            />
            Necessita orçamento
          </label>
          <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={necessitaObra}
              onChange={(e) => setNecessitaObra(e.target.checked)}
              className="h-4 w-4"
            />
            Necessita obra
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors"
          >
            Voltar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-success px-4 py-2 text-sm font-medium text-success-foreground shadow hover:bg-success/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Confirmar Realização'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface VisitasAdminPageProps {
  initialView?: 'analises' | 'lista' | 'agendar' | 'realizar';
  onNavegar?: (view: 'analises' | 'lista' | 'agendar' | 'realizar') => void;
}

export function VisitasAdminPage({
  initialView = 'lista',
  onNavegar,
}: VisitasAdminPageProps) {
  const [visitas, setVisitas] = useState<VisitaItem[]>([]);
  const [visitasTodos, setVisitasTodos] = useState<VisitaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [visitaRealizar, setVisitaRealizar] = useState<VisitaItem | null>(null);

  const mudarView = (
    novaView: 'analises' | 'lista' | 'agendar' | 'realizar',
  ) => {
    if (onNavegar) onNavegar(novaView);
  };

  const carregarVisitas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listarVisitas({
        status: (statusFiltro || undefined) as StatusVisita | undefined,
      });
      setVisitas(data);
    } catch (err) {
      console.error('Erro ao listar visitas:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFiltro]);

  const carregarTodasVisitas = useCallback(async () => {
    try {
      const data = await listarVisitas();
      setVisitasTodos(data);
    } catch (err) {
      console.error('Erro ao listar todas as visitas:', err);
    }
  }, []);

  useEffect(() => {
    carregarVisitas();
  }, [carregarVisitas]);

  useEffect(() => {
    carregarTodasVisitas();
  }, [carregarTodasVisitas]);

  const handleCancelar = async (id: number) => {
    if (!window.confirm('Cancelar esta visita?')) return;
    try {
      await cancelarVisita(id);
      await Promise.all([carregarVisitas(), carregarTodasVisitas()]);
    } catch (err) {
      console.error('Erro ao cancelar visita:', err);
    }
  };

  const handleRealizar = async (id: number) => {
    const alvo = visitas.find((v) => v.id === id);
    if (alvo) {
      setVisitaRealizar(alvo);
      mudarView('realizar');
    }
  };

  return (
    <div className="p-6">
      {initialView === 'analises' && <VisitasAnalises visitas={visitasTodos} />}
      {initialView === 'lista' && (
        <VisitasList
          visitas={visitas}
          loading={loading}
          statusFiltro={statusFiltro}
          onStatusFiltroChange={setStatusFiltro}
          onCancelar={handleCancelar}
          onRealizar={handleRealizar}
        />
      )}
      {initialView === 'agendar' && (
        <AgendarVisitaForm
          onSuccess={() => {
            mudarView('lista');
            Promise.all([carregarVisitas(), carregarTodasVisitas()]);
          }}
          onCancel={() => mudarView('lista')}
        />
      )}
      {initialView === 'realizar' && visitaRealizar && (
        <RealizarVisitaForm
          visita={visitaRealizar}
          onSuccess={() => {
            mudarView('lista');
            setVisitaRealizar(null);
            Promise.all([carregarVisitas(), carregarTodasVisitas()]);
          }}
          onCancel={() => mudarView('lista')}
        />
      )}
    </div>
  );
}
