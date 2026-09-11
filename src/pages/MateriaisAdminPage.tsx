import { type FormEvent, useCallback, useEffect, useState } from 'react';
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
  atualizarMaterial,
  criarMaterial,
  detalharMaterial,
  listarLookupsMateriais,
  listarMateriais,
  type MaterialInput,
  type MaterialItem,
  type MaterialLookups,
  type MaterialMovimentoItem,
  registrarEntradaMaterial,
  registrarSaidaMaterial,
  type StatusMaterial,
  type TipoMovimento,
  type UnidadeMedida,
} from '../lib/api';
import { formatarData, formatarValor } from '../lib/datetime';
import { cn } from '../lib/utils';



function toNum(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isNaN(n) ? 0 : n;
}

function saldoDe(m: MaterialItem): number {
  return toNum(m.saldo?.saldo);
}

function abaixoDoMinimo(m: MaterialItem): boolean {
  return (
    m.status === 'ATIVO' &&
    m.quantidadeMinima !== null &&
    saldoDe(m) < m.quantidadeMinima
  );
}

const emptyForm = {
  nome: '',
  categoriaId: '' as number | '',
  unidadeId: '' as number | '',
  quantidadeMinima: '',
  custoUnitario: '',
  status: 'ATIVO' as StatusMaterial,
};

type MaterialFormData = typeof emptyForm;

function numOuNull(v: string): number | null {
  const n = Number(v.trim().replace(',', '.'));
  return v.trim() === '' || Number.isNaN(n) ? null : n;
}

function BadgeStatus({ status }: { status: StatusMaterial }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium',
        status === 'ATIVO'
          ? 'bg-primary/10 text-primary'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {status === 'ATIVO' ? 'Ativo' : 'Inativo'}
    </span>
  );
}

function BadgeSaldo({
  valor,
  destaque,
}: {
  valor: number;
  destaque?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        destaque
          ? 'bg-destructive/10 text-destructive'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {destaque && '⚠'}
      {valor} un.
    </span>
  );
}

interface MateriaisAnalisesProps {
  materiais: MaterialItem[];
}

export function MateriaisAnalises({ materiais }: MateriaisAnalisesProps) {
  const total = materiais.length;
  const saldoTotal = materiais.reduce((acc, m) => acc + saldoDe(m), 0);
  const semEstoque = materiais.filter((m) => saldoDe(m) === 0).length;
  const abaixoMinimo = materiais.filter(abaixoDoMinimo).length;
  const valorEstoque = materiais.reduce(
    (acc, m) => acc + toNum(m.custoUnitario) * saldoDe(m),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Análises de Materiais
        </h2>
        <p className="text-sm text-muted-foreground">
          Situação do estoque, saldo e valor dos materiais operacionais.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Total de Itens
          </p>
          <p className="mt-2 text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Saldo em Estoque
          </p>
          <p className="mt-2 text-2xl font-bold">{saldoTotal} un.</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-destructive">
            Abaixo do Mínimo
          </p>
          <p className="mt-2 text-2xl font-bold">{abaixoMinimo}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Sem Estoque
          </p>
          <p className="mt-2 text-2xl font-bold">{semEstoque}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Valor do Estoque
          </p>
          <p className="mt-2 text-2xl font-bold">
            {formatarValor(valorEstoque)}
          </p>
        </div>
      </div>

    </div>
  );
}

interface MaterialFormProps {
  editando: boolean;
  saving: boolean;
  form: MaterialFormData;
  setForm: (f: MaterialFormData) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  unidadesMedida: UnidadeMedida[];
  categorias: MaterialLookups['categorias'];
}

function MaterialForm({
  editando,
  saving,
  form,
  setForm,
  onSubmit,
  onCancel,
  unidadesMedida,
  categorias,
}: MaterialFormProps) {
  const inputCls =
    'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border bg-card p-5 shadow-sm space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Nome</label>
          <input
            type="text"
            required
            minLength={2}
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Ex.: Água sanitária, Desengraxante..."
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Categoria</label>
          <select
            value={form.categoriaId}
            onChange={(e) =>
              setForm({
                ...form,
                categoriaId: e.target.value ? Number(e.target.value) : '',
              })
            }
            className={inputCls}
          >
            <option value="">Selecione...</option>
            {[...categorias]
              .sort((a, b) => a.nome.localeCompare(b.nome))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Unidade de Medida</label>
          <select
            value={form.unidadeId}
            onChange={(e) =>
              setForm({ ...form, unidadeId: e.target.value === '' ? '' : Number(e.target.value) })
            }
            className={inputCls}
          >
            <option value=""></option>
            {[...unidadesMedida]
              .sort((a, b) => a.nome.localeCompare(b.nome))
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Quantidade mínima
          </label>
          <input
            type="number"
            min={0}
            value={form.quantidadeMinima}
            onChange={(e) =>
              setForm({ ...form, quantidadeMinima: e.target.value })
            }
            placeholder="0"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Custo unitário
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.custoUnitario}
            onChange={(e) =>
              setForm({ ...form, custoUnitario: e.target.value })
            }
            placeholder="0,00"
            className={inputCls}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving
            ? 'Salvando...'
            : editando
              ? 'Salvar alterações'
              : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
}

interface MovimentosProps {
  material: MaterialItem;
  onVoltar: () => void;
  onAtualizar: (m: MaterialItem) => void;
}

function Movimentos({ material, onVoltar, onAtualizar }: MovimentosProps) {
  const [tipo, setTipo] = useState<TipoMovimento>('ENTRADA');
  const [quantidade, setQuantidade] = useState('');
  const [observacao, setObservacao] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const qtd = numOuNull(quantidade);
    if (qtd === null || qtd <= 0) {
      setError('Informe uma quantidade maior que zero.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const fn =
        tipo === 'ENTRADA' ? registrarEntradaMaterial : registrarSaidaMaterial;
      const novoSaldo = await fn(material.id, {
        quantidade: qtd,
        observacao: observacao.trim() || undefined,
      });
      setQuantidade('');
      setObservacao('');
      const detalhe = await detalharMaterial(material.id);
      onAtualizar({
        ...detalhe,
        saldo: detalhe.saldo
          ? { ...detalhe.saldo, saldo: novoSaldo }
          : {
              materialId: material.id,
              saldo: novoSaldo,
              updatedAt: new Date().toISOString(),
            },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao registrar movimento',
      );
    } finally {
      setSaving(false);
    }
  }

  const movimentos: MaterialMovimentoItem[] = material.movimentos ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {material.nome}
        </h1>
        <p className="text-sm text-muted-foreground">
          Movimentação de estoque
        </p>
      </header>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Registrar movimento</CardTitle>
            <CardDescription>
              Saldo atual: {saldoDe(material)} {material.unidade?.nome}
              {material.quantidadeMinima !== null &&
                ` · mín. ${material.quantidadeMinima}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={tipo === 'ENTRADA' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTipo('ENTRADA')}
                >
                  Entrada
                </Button>
                <Button
                  type="button"
                  variant={tipo === 'SAIDA' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTipo('SAIDA')}
                >
                  Saída
                </Button>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Quantidade ({material.unidade?.nome})
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  required
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Observação
                </label>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={2}
                  placeholder="Motivo/observação (opcional)"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <Button type="submit" disabled={saving} className="w-full">
                {saving
                  ? 'Registrando...'
                  : tipo === 'ENTRADA'
                    ? 'Registrar entrada'
                    : 'Registrar saída'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Histórico de movimentos</CardTitle>
            <CardDescription>Últimas 50 movimentações</CardDescription>
          </CardHeader>
          <CardContent>
            {movimentos.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum movimento registrado.
              </p>
            ) : (
              <div className="space-y-2">
                {movimentos.map((mv) => (
                  <div
                    key={mv.id}
                    className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          mv.tipo === 'ENTRADA'
                            ? 'text-emerald-600'
                            : 'text-destructive',
                        )}
                      >
                        {mv.tipo === 'ENTRADA' ? '+' : '−'}
                        {toNum(mv.quantidade)} {material.unidade?.nome}
                      </span>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatarData(mv.createdAt)}
                        {mv.registradoPor?.nome
                          ? ` · ${mv.registradoPor.nome}`
                          : ''}
                        {mv.observacao ? ` · ${mv.observacao}` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      saldo {toNum(mv.saldoApos)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Button type="button" variant="outline" onClick={onVoltar}>
        ← Voltar para a lista
      </Button>
    </div>
  );
}

export default function MateriaisAdminPage({
  viewAtiva = 'lista',
  onNavegar,
}: {
  viewAtiva?: 'analises' | 'lista' | 'novo' | 'movimentos';
  onNavegar?: (v: 'analises' | 'lista' | 'novo' | 'movimentos') => void;
}) {
  const [materiais, setMateriais] = useState<MaterialItem[]>([]);
  const [lookups, setLookups] = useState<MaterialLookups | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | ''>('');
  const [itensPorPagina, setItensPorPagina] = useState(25);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState<MaterialItem | null>(null);
  const [form, setForm] = useState<MaterialFormData>(emptyForm);
  const [toggling, setToggling] = useState<number | null>(null);
  const [materialAberto, setMaterialAberto] = useState<MaterialItem | null>(
    null,
  );

  const carregarTodos = useCallback(async () => {
    setError(null);
    try {
      const lista = await listarMateriais();
      setMateriais(lista);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao carregar materiais',
      );
    }
  }, []);

  useEffect(() => {
    carregarTodos();
    listarLookupsMateriais()
      .then(setLookups)
      .catch(() => {});
  }, [carregarTodos]);

  function comecarEdicao(m: MaterialItem) {
    setEditando(m);
    setForm({
      nome: m.nome,
      categoriaId: m.categoriaId ?? '',
      unidadeId: m.unidadeId ?? '',
      quantidadeMinima:
        m.quantidadeMinima === null ? '' : String(m.quantidadeMinima),
      custoUnitario:
        m.custoUnitario === null ? '' : String(toNum(m.custoUnitario)),
      status: m.status,
    });
    setError(null);
    onNavegar?.('novo');
  }

  function cancelarEdicao() {
    setEditando(null);
    setForm(emptyForm);
    setError(null);
    onNavegar?.('lista');
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: MaterialInput = {
        nome: form.nome,
        categoriaId: form.categoriaId === '' ? null : form.categoriaId,
        unidadeId: form.unidadeId === '' ? null : form.unidadeId,
        quantidadeMinima: numOuNull(form.quantidadeMinima) ?? undefined,
        custoUnitario: numOuNull(form.custoUnitario) ?? undefined,
      };

      if (editando) {
        const atualizado = await atualizarMaterial(editando.id, {
          ...payload,
          quantidadeMinima: numOuNull(form.quantidadeMinima),
          custoUnitario: numOuNull(form.custoUnitario),
          status: form.status,
        });
        setMateriais((prev) =>
          prev.map((x) => (x.id === atualizado.id ? atualizado : x)),
        );
        cancelarEdicao();
      } else {
        const criado = await criarMaterial(payload);
        setMateriais((prev) => [criado, ...prev]);
        cancelarEdicao();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar material');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(m: MaterialItem) {
    setToggling(m.id);
    setError(null);
    try {
      const atualizado = await atualizarMaterial(m.id, {
        status: m.status === 'ATIVO' ? 'INATIVO' : 'ATIVO',
      });
      setMateriais((prev) =>
        prev.map((x) => (x.id === atualizado.id ? atualizado : x)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao alterar material',
      );
    } finally {
      setToggling(null);
    }
  }

  async function abrirMovimentos(m: MaterialItem) {
    setError(null);
    try {
      const detalhe = await detalharMaterial(m.id);
      setMaterialAberto(detalhe);
      onNavegar?.('movimentos');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao carregar movimentos',
      );
    }
  }

  function atualizarMaterialAberto(m: MaterialItem) {
    setMaterialAberto(m);
    setMateriais((prev) =>
      prev.map((x) => (x.id === m.id ? { ...x, saldo: m.saldo } : x)),
    );
  }

  const filtrados = materiais.filter((m) => {
    if (categoriaFiltro !== '' && m.categoriaId !== categoriaFiltro)
      return false;
    return busca.trim()
      ? `${m.nome} ${m.categoria?.nome ?? ''}`
          .toLowerCase()
          .includes(busca.trim().toLowerCase())
      : true;
  });

  if (viewAtiva === 'analises') {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Materiais</h1>
          <p className="text-sm text-muted-foreground">
            Cadastro e gestão de estoque de materiais operacionais.
          </p>
        </header>

        <MateriaisAnalises materiais={materiais} />

        {onNavegar && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onNavegar('lista')}
          >
            ← Voltar para a lista
          </Button>
        )}
      </div>
    );
  }

  if (viewAtiva === 'movimentos' && materialAberto) {
    return (
      <Movimentos
        material={materialAberto}
        onVoltar={() => onNavegar?.('lista')}
        onAtualizar={atualizarMaterialAberto}
      />
    );
  }

  if (viewAtiva === 'novo') {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            {editando ? `Editar ${editando.nome}` : 'Novo Material'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastre ou edite um material/equipamento e seu estoque mínimo.
          </p>
        </header>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <MaterialForm
          editando={!!editando}
          saving={saving}
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          onCancel={cancelarEdicao}
          unidadesMedida={lookups?.unidadesMedida ?? []}
          categorias={lookups?.categorias ?? []}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Materiais</h1>
        <p className="text-sm text-muted-foreground">
          Cadastro e gestão de estoque de materiais operacionais.
        </p>
      </header>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar material por nome..."
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

      <div className="flex items-center justify-between gap-4">
        <RecordsFilter
          value={itensPorPagina}
          onChange={setItensPorPagina}
          total={filtrados.length}
        />
      </div>

      <div className="space-y-3">
        {(itensPorPagina > 0
          ? filtrados.slice(0, itensPorPagina)
          : filtrados
        ).map((m) => {
          const baixo = abaixoDoMinimo(m);
          return (
            <Card key={m.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{m.nome}</CardTitle>
                    <BadgeStatus status={m.status} />
                  </div>
                  <BadgeSaldo valor={saldoDe(m)} destaque={baixo} />
                </div>
                <CardDescription>
                  Unidade: {m.unidade?.nome}
                  {m.quantidadeMinima !== null &&
                    ` · mín. ${m.quantidadeMinima}`}
                  {m.custoUnitario !== null &&
                    ` · custo ${formatarValor(toNum(m.custoUnitario))}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {baixo
                      ? 'Estoque abaixo do mínimo recomendado. Programe a reposição.'
                      : `Cadastrado em ${formatarData(m.createdAt)}`}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => abrirMovimentos(m)}
                    >
                      Movimentos
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={toggling === m.id}
                      onClick={() => handleToggleStatus(m)}
                    >
                      {toggling === m.id
                        ? 'Salvando...'
                        : m.status === 'ATIVO'
                          ? 'Desativar'
                          : 'Ativar'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => comecarEdicao(m)}
                    >
                      Editar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!error && filtrados.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum material encontrado.
          </p>
        )}
      </div>
    </div>
  );
}
