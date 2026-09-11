import { type FormEvent, useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import {
  type CatalogoAtividadeItem,
  criarCatalogoAtividade,
  listarCatalogoAtividades,
} from '../lib/api';
import { cn } from '../lib/utils';

const selectClasses =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

type ViewAtiva = 'analises' | 'lista' | 'novo';

interface Props {
  viewAtiva: ViewAtiva;
  onNavegar: (view: ViewAtiva) => void;
}

const ESPECIALIDADES = [
  { value: 'ELETRICA', label: 'Elétrica' },
  { value: 'HIDRAULICA', label: 'Hidráulica' },
  { value: 'MARCENARIA', label: 'Marcenaria' },
  { value: 'PINTURA', label: 'Pintura' },
  { value: 'ALVENARIA', label: 'Alvenaria' },
  { value: 'GERAL', label: 'Geral' },
];

export function CatalogoAtividadesPage({ viewAtiva, onNavegar }: Props) {
  const [atividades, setAtividades] = useState<CatalogoAtividadeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroEspecialidade, setFiltroEspecialidade] = useState('');

  useEffect(() => {
    setLoading(true);
    listarCatalogoAtividades({
      q: busca || undefined,
      especialidade: filtroEspecialidade || undefined,
    })
      .then(setAtividades)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [busca, filtroEspecialidade]);

  if (viewAtiva === 'analises') {
    return <AnalisesView atividades={atividades} />;
  }

  if (viewAtiva === 'novo') {
    return (
      <FormularioNovo
        onVoltar={() => onNavegar('lista')}
        onSalvo={() => onNavegar('lista')}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Catálogo de Atividades</h2>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Buscar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-9 w-48"
          />
          <select
            value={filtroEspecialidade}
            onChange={(e) => setFiltroEspecialidade(e.target.value)}
            className={cn(selectClasses, 'h-9 w-40')}
          >
            <option value="">Todas</option>
            {ESPECIALIDADES.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : atividades.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma atividade encontrada.
        </p>
      ) : (
        <div className="space-y-3">
          {atividades.map((atv) => (
            <AtividadeCard key={atv.id} atividade={atv} />
          ))}
        </div>
      )}
    </div>
  );
}

function AtividadeCard({ atividade }: { atividade: CatalogoAtividadeItem }) {
  const [expandido, setExpandido] = useState(false);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer py-3"
        onClick={() => setExpandido(!expandido)}
      >
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{atividade.nome}</CardTitle>
            <CardDescription>{atividade.descricao}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {ESPECIALIDADES.find(
                (e) => e.value === atividade.especialidadeNecessaria,
              )?.label ?? atividade.especialidadeNecessaria}
            </span>
            {atividade.tempoEstimadoHoras && (
              <span className="text-xs text-muted-foreground">
                ~{atividade.tempoEstimadoHoras}h
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      {expandido && (
        <CardContent className="pt-0">
          {atividade.subSteps.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-1 text-sm font-medium">Sub-etapas</h4>
              <ol className="list-decimal space-y-1 pl-4">
                {atividade.subSteps
                  .sort((a, b) => a.ordem - b.ordem)
                  .map((s) => (
                    <li key={s.id} className="text-sm text-muted-foreground">
                      {s.descricao}
                      {s.observacao && (
                        <span className="ml-1 text-xs italic">
                          ({s.observacao})
                        </span>
                      )}
                    </li>
                  ))}
              </ol>
            </div>
          )}
          {atividade.recursos.length > 0 && (
            <div>
              <h4 className="mb-1 text-sm font-medium">Recursos Necessários</h4>
              <ul className="space-y-1">
                {atividade.recursos.map((r) => (
                  <li key={r.id} className="text-sm text-muted-foreground">
                    <span className="font-medium capitalize">
                      {r.tipo === 'FERRAMENTA'
                        ? 'Ferramenta'
                        : r.tipo === 'EPI'
                          ? 'EPI'
                          : 'Material'}
                    </span>
                    {' — '}
                    Item #{r.itemCatalogoId} × {r.quantidade}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function AnalisesView({ atividades }: { atividades: CatalogoAtividadeItem[] }) {
  const total = atividades.length;
  const porEspecialidade = atividades.reduce(
    (acc, a) => {
      const nome =
        ESPECIALIDADES.find((e) => e.value === a.especialidadeNecessaria)
          ?.label ?? a.especialidadeNecessaria;
      acc[nome] = (acc[nome] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        Análises — Catálogo de Atividades
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{total}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Com Sub-etapas</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {atividades.filter((a) => a.subSteps.length > 0).length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Com Recursos</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {atividades.filter((a) => a.recursos.length > 0).length}
            </span>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Por Especialidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(porEspecialidade).map(([nome, qtd]) => (
              <div key={nome} className="flex items-center justify-between">
                <span className="text-sm">{nome}</span>
                <span className="text-sm font-medium">{qtd}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FormularioNovo({
  onVoltar,
  onSalvo,
}: {
  onVoltar: () => void;
  onSalvo: () => void;
}) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [especialidade, setEspecialidade] = useState('GERAL');
  const [tempoEstimado, setTempoEstimado] = useState('');
  const [subSteps, setSubSteps] = useState<{ descricao: string }[]>([]);
  const [recursos, setRecursos] = useState<
    { tipo: string; itemCatalogoId: string; quantidade: string }[]
  >([]);
  const [saving, setSaving] = useState(false);

  function handleSubStepChange(idx: number, val: string) {
    setSubSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, descricao: val } : s)),
    );
  }

  function handleRecursoChange(
    idx: number,
    field: 'tipo' | 'itemCatalogoId' | 'quantidade',
    val: string,
  ) {
    setRecursos((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r)),
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setSaving(true);
    try {
      await criarCatalogoAtividade({
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        especialidadeNecessaria: especialidade,
        tempoEstimadoHoras: tempoEstimado ? Number(tempoEstimado) : null,
        subSteps: subSteps
          .filter((s) => s.descricao.trim())
          .map((s, i) => ({
            id: '',
            ordem: i + 1,
            descricao: s.descricao.trim(),
            observacao: null,
          })),
        recursos: recursos
          .filter((r) => r.itemCatalogoId)
          .map((r) => ({
            id: '',
            tipo: r.tipo,
            itemCatalogoId: Number(r.itemCatalogoId),
            quantidade: Number(r.quantidade) || 1,
          })),
      });
      onSalvo();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Nova Atividade no Catálogo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nome *</label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Descrição</label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Especialidade
              </label>
              <select
                value={especialidade}
                onChange={(e) => setEspecialidade(e.target.value)}
                className={selectClasses}
              >
                {ESPECIALIDADES.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Tempo Estimado (horas)
              </label>
              <Input
                type="number"
                min={0}
                value={tempoEstimado}
                onChange={(e) => setTempoEstimado(e.target.value)}
              />
            </div>
          </div>

          {/* Sub-etapas */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-medium">Sub-etapas</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setSubSteps((prev) => [...prev, { descricao: '' }])
                }
              >
                + Adicionar
              </Button>
            </div>
            {subSteps.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhuma sub-etapa adicionada.
              </p>
            )}
            {subSteps.map((s, i) => (
              <div key={i} className="mb-2 flex gap-2">
                <span className="flex h-9 w-8 items-center justify-center rounded border bg-muted text-xs font-medium">
                  {i + 1}
                </span>
                <Input
                  placeholder={`Sub-etapa ${i + 1}`}
                  value={s.descricao}
                  onChange={(e) => handleSubStepChange(i, e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSubSteps((prev) => prev.filter((_, j) => j !== i))
                  }
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>

          {/* Recursos */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-medium">Recursos Necessários</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setRecursos((prev) => [
                    ...prev,
                    { tipo: 'FERRAMENTA', itemCatalogoId: '', quantidade: '1' },
                  ])
                }
              >
                + Adicionar
              </Button>
            </div>
            {recursos.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhum recurso adicionado.
              </p>
            )}
            {recursos.map((r, i) => (
              <div key={i} className="mb-2 flex gap-2">
                <select
                  value={r.tipo}
                  onChange={(e) =>
                    handleRecursoChange(i, 'tipo', e.target.value)
                  }
                  className={cn(selectClasses, 'h-9 w-28')}
                >
                  <option value="FERRAMENTA">Ferramenta</option>
                  <option value="EPI">EPI</option>
                  <option value="MATERIAL">Material</option>
                </select>
                <Input
                  placeholder="ID do item"
                  value={r.itemCatalogoId}
                  onChange={(e) =>
                    handleRecursoChange(i, 'itemCatalogoId', e.target.value)
                  }
                  className="h-9 w-24"
                />
                <Input
                  type="number"
                  min={1}
                  value={r.quantidade}
                  onChange={(e) =>
                    handleRecursoChange(i, 'quantidade', e.target.value)
                  }
                  className="h-9 w-20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setRecursos((prev) => prev.filter((_, j) => j !== i))
                  }
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button type="button" variant="outline" onClick={onVoltar}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default CatalogoAtividadesPage;
