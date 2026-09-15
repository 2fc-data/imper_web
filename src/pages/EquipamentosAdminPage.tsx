import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { ItemForm, type ItemFormData } from '../components/ItemForm';
import { RecordsFilter } from '../components/RecordsFilter';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  atualizarEquipamento,
  criarEquipamento,
  type EquipamentoInput,
  type EquipamentoItem,
  type EquipamentoLookups,
  excluirEquipamento,
  listarEquipamentos,
  listarLookupsEquipamentos,
} from '../lib/api';
import {
  formatarData,
  formatarValor,
  fromLocalDateTime,
  toLocalDateTime,
} from '../lib/datetime';
import { cn } from '../lib/utils';

function BadgeAtivoEquipamento({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium',
        ativo
          ? 'bg-emerald-500/10 text-emerald-600'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  );
}

type ViewAtiva = 'analises' | 'lista' | 'novo';

interface EquipamentosAdminPageProps {
  viewAtiva: ViewAtiva;
  onNavegar: (view: ViewAtiva) => void;
}

interface EquipamentosAnalisesProps {
  equipamentos: EquipamentoItem[];
}

function EquipamentosAnalises({ equipamentos }: EquipamentosAnalisesProps) {
  const total = equipamentos.length;
  const ativos = equipamentos.filter((e) => e.ativo).length;
  const inativos = equipamentos.filter((e) => !e.ativo).length;
  const retirados = equipamentos.filter((e) => e.responsavel != null).length;
  const valorTotal = equipamentos.reduce(
    (acc, e) => acc + (e.valorAquisicao ?? 0),
    0,
  );

  const porCategoria = equipamentos.reduce(
    (acc, e) => {
      const nome = e.categoria?.nome ?? 'Sem categoria';
      acc[nome] = (acc[nome] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const porStatus = equipamentos.reduce(
    (acc, e) => {
      const nome = e.status?.nome ?? 'Sem status';
      acc[nome] = (acc[nome] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  function Barras({ dados }: { dados: Record<string, number> }) {
    return (
      <div className="space-y-2">
        {Object.entries(dados).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum dado registrado.
          </p>
        ) : (
          Object.entries(dados).map(([nome, qtd]) => {
            const perc = total ? Math.round((qtd / total) * 100) : 0;
            return (
              <div key={nome} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span>{nome}</span>
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
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Análises de Equipamentos
        </h2>
        <p className="text-sm text-muted-foreground">
          Visão geral do patrimônio, conservação e movimentações.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border bg-card p-4 shadow-sm lg:col-span-1">
          <p className="text-xs font-medium text-muted-foreground">Total</p>
          <p className="mt-2 text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-success">Ativos</p>
          <p className="mt-2 text-2xl font-bold">{ativos}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Inativos</p>
          <p className="mt-2 text-2xl font-bold">{inativos}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-warning">Em retirada</p>
          <p className="mt-2 text-2xl font-bold">{retirados}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm lg:col-span-1">
          <p className="text-xs font-medium text-muted-foreground">
            Valor total
          </p>
          <p className="mt-2 text-2xl font-bold">{formatarValor(valorTotal)}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
        <h3 className="font-semibold text-base">Distribuição por Categoria</h3>
        <Barras dados={porCategoria} />
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
        <h3 className="font-semibold text-base">Distribuição por Status</h3>
        <Barras dados={porStatus} />
      </div>
    </div>
  );
}

const emptyForm: ItemFormData = {
  codigo: '',
  numeroPatrimonio: undefined,
  descricao: '',
  modelo: undefined,
  numeroSerie: undefined,
  marcaId: undefined,
  categoriaId: undefined,
  subcategoriaId: undefined,
  localizacaoId: undefined,
  fornecedorId: undefined,
  unidadeMedidaId: undefined,
  statusId: 0,
  estadoConservacaoId: undefined,
  dataAquisicao: undefined,
  valorAquisicao: undefined,
  dataGarantia: undefined,
  observacoes: undefined,
};

export default function EquipamentosAdminPage({
  viewAtiva,
  onNavegar,
}: EquipamentosAdminPageProps) {
  const [equipamentos, setEquipamentos] = useState<EquipamentoItem[]>([]);
  const [lookups, setLookups] = useState<EquipamentoLookups | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | ''>('');
  const [itensPorPagina, setItensPorPagina] = useState(25);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState<EquipamentoItem | null>(null);
  const [form, setForm] = useState<ItemFormData>(emptyForm);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<number | null>(
    null,
  );
  const [excluindo, setExcluindo] = useState<number | null>(null);

  const carregarTodos = useCallback(async () => {
    setError(null);
    try {
      const [eqs, cats] = await Promise.all([
        listarEquipamentos(),
        listarLookupsEquipamentos(),
      ]);
      setEquipamentos(eqs);
      setLookups(cats);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao carregar equipamentos',
      );
    }
  }, []);

  useEffect(() => {
    carregarTodos();
  }, [carregarTodos]);

  async function recarregarEquipamentos() {
    try {
      const lista = await listarEquipamentos();
      setEquipamentos(lista);
    } catch {
      /* mantém a lista atual */
    }
  }

  function comecarEdicao(e: EquipamentoItem) {
    setEditando(e);
    setForm({
      codigo: e.codigo,
      numeroPatrimonio: e.numeroPatrimonio ?? undefined,
      descricao: e.descricao,
      modelo: e.modelo ?? undefined,
      numeroSerie: e.numeroSerie ?? undefined,
      marcaId: e.marcaId ?? undefined,
      categoriaId: e.categoriaId ?? undefined,
      subcategoriaId: e.subcategoriaId ?? undefined,
      localizacaoId: e.localizacaoId ?? undefined,
      fornecedorId: e.fornecedorId ?? undefined,
      unidadeMedidaId: e.unidadeMedidaId ?? undefined,
      statusId: e.statusId,
      estadoConservacaoId: e.estadoConservacaoId ?? undefined,
      dataAquisicao: toLocalDateTime(e.dataAquisicao),
      valorAquisicao: e.valorAquisicao ?? undefined,
      dataGarantia: toLocalDateTime(e.dataGarantia),
      observacoes: e.observacoes ?? undefined,
    });
    setError(null);
  }

  function cancelarEdicao() {
    setEditando(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: EquipamentoInput = {
        codigo: form.codigo,
        numeroPatrimonio: form.numeroPatrimonio || undefined,
        descricao: form.descricao || '',
        modelo: form.modelo || undefined,
        numeroSerie: form.numeroSerie || undefined,
        marcaId: form.marcaId,
        categoriaId: form.categoriaId,
        subcategoriaId: form.subcategoriaId,
        localizacaoId: form.localizacaoId,
        fornecedorId: form.fornecedorId,
        unidadeMedidaId: form.unidadeMedidaId,
        statusId: form.statusId || 0,
        estadoConservacaoId: form.estadoConservacaoId,
        dataAquisicao: fromLocalDateTime(form.dataAquisicao ?? ''),
        valorAquisicao: form.valorAquisicao,
        dataGarantia: fromLocalDateTime(form.dataGarantia ?? ''),
        observacoes: form.observacoes || undefined,
      };
      if (editando) {
        const atualizado = await atualizarEquipamento(editando.id, payload);
        setEquipamentos((prev) =>
          prev.map((x) => (x.id === atualizado.id ? atualizado : x)),
        );
        cancelarEdicao();
      } else {
        const criado = await criarEquipamento(payload);
        setEquipamentos((prev) => [criado, ...prev]);
        cancelarEdicao();
        onNavegar('lista');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao salvar equipamento',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtivo(e: EquipamentoItem) {
    setError(null);
    try {
      const atualizado = await atualizarEquipamento(e.id, { ativo: !e.ativo });
      setEquipamentos((prev) =>
        prev.map((x) => (x.id === atualizado.id ? atualizado : x)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao atualizar equipamento',
      );
    }
  }

  async function handleExcluir(id: number) {
    setExcluindo(id);
    setError(null);
    try {
      await excluirEquipamento(id);
      setEquipamentos((prev) => prev.filter((x) => x.id !== id));
      setConfirmandoExclusao(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao excluir equipamento',
      );
    } finally {
      setExcluindo(null);
    }
  }

  const formulario = (
    <ItemForm
      tipo="EQUIPAMENTO"
      editando={!!editando}
      saving={saving}
      form={form}
      setForm={setForm}
      lookups={lookups}
      onSubmit={handleSubmit}
      onCancel={() => {
        cancelarEdicao();
        if (viewAtiva === 'novo') onNavegar('lista');
      }}
    />
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Gestão de Equipamentos
        </h1>
        <p className="text-sm text-muted-foreground">
          Cadastro, patrimônio e controle de retiradas dos equipamentos.
        </p>
      </header>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {viewAtiva === 'analises' && (
        <EquipamentosAnalises equipamentos={equipamentos} />
      )}

      {(viewAtiva === 'novo' || editando) && formulario}

      {viewAtiva === 'lista' && !editando && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar por código, descrição ou patrimônio..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <select
              value={categoriaFiltro}
              onChange={(e) =>
                setCategoriaFiltro(e.target.value ? Number(e.target.value) : '')
              }
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">TODAS AS CATEGORIAS</option>
              {(lookups?.categorias ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {(() => {
            const filtrados = equipamentos.filter(
              (e) =>
                (!categoriaFiltro || e.categoriaId === categoriaFiltro) &&
                (!busca ||
                  `${e.codigo} ${e.descricao} ${e.numeroPatrimonio ?? ''}`
                    .toLowerCase()
                    .includes(busca.toLowerCase())),
            );
            const paginados =
              itensPorPagina > 0
                ? filtrados.slice(0, itensPorPagina)
                : filtrados;
            return (
              <>
                <div className="flex items-center justify-between gap-4">
                  <RecordsFilter
                    value={itensPorPagina}
                    onChange={setItensPorPagina}
                    total={filtrados.length}
                  />
                </div>

                <div className="space-y-3">
                  {paginados.map((e) => {
                    return (
                      <Card key={e.id}>
                        <CardHeader className="pb-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <CardTitle className="text-base">
                                {e.descricao}
                              </CardTitle>
                              <BadgeAtivoEquipamento ativo={e.ativo} />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {e.status?.nome}
                            </span>
                          </div>
                          <CardDescription className="text-sm">
                            {e.numeroPatrimonio || ''}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="text-xs text-muted-foreground">
                            {e.marca && <span>Marca: {e.marca.nome} · </span>}
                            {e.categoria && <span>{e.categoria.nome}</span>}
                            {e.subcategoria && (
                              <span> / {e.subcategoria.nome}</span>
                            )}
                            {e.localizacao && (
                              <span> · {e.localizacao.nome}</span>
                            )}
                            {e.estadoConservacao && (
                              <span> · {e.estadoConservacao.nome}</span>
                            )}
                            {e.dataAquisicao && (
                              <span>
                                {' '}
                                · Aquisição: {formatarData(e.dataAquisicao)}
                              </span>
                            )}
                            {e.valorAquisicao != null && (
                              <span> · {formatarValor(e.valorAquisicao)}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => comecarEdicao(e)}
                            >
                              Editar
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={excluindo === e.id}
                              onClick={() => handleToggleAtivo(e)}
                            >
                              {e.ativo ? 'Desativar' : 'Ativar'}
                            </Button>
                            {confirmandoExclusao === e.id ? (
                              <>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  disabled={excluindo === e.id}
                                  onClick={() => handleExcluir(e.id)}
                                >
                                  {excluindo === e.id
                                    ? 'Excluindo...'
                                    : 'Confirmar exclusão'}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setConfirmandoExclusao(null)}
                                >
                                  Cancelar
                                </Button>
                              </>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setConfirmandoExclusao(e.id)}
                              >
                                Excluir
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {!error && filtrados.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum equipamento encontrado.
                    </p>
                  )}
                </div>
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
