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
import { Label } from '../components/ui/label';
import {
  type CatalogoAtividadeItem,
  ESPECIALIDADES_CATALOGO,
  TIPOS_RECURSO_ATIVIDADE,
  atualizarCatalogoAtividade,
  criarCatalogoAtividade,
  excluirCatalogoAtividade,
  listarCatalogoAtividades,
  listarEtapasTodas,
  listarSubServicosTodas,
  type Etapa,
  type SubServico,
} from '../lib/api';
import { cn } from '../lib/utils';

const selectClasses =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

const ESPECIALIDADES_LABEL: Record<string, string> = {
  IMPERMEABILIZACAO: 'Impermeabilização',
  PINTURA: 'Pintura',
  ELETRICA: 'Elétrica',
  HIDRAULICA: 'Hidráulica',
  CIVIL: 'Civil',
  LIMPEZA: 'Limpeza',
  OUTROS: 'Outros',
};

const TIPO_RECURSO_LABEL: Record<string, string> = {
  EQUIPAMENTO: 'Equipamento',
  EPI: 'EPI',
  MATERIAL: 'Material',
};

type ViewAtiva = 'analises' | 'lista' | 'novo' | 'editar';

interface Props {
  viewAtiva: ViewAtiva;
  onNavegar: (view: ViewAtiva) => void;
}

function fmtEspecialidade(value: string): string {
  return ESPECIALIDADES_LABEL[value] ?? value;
}

function fmtTipoRecurso(tipo: string): string {
  return TIPO_RECURSO_LABEL[tipo] ?? tipo;
}

export function CatalogoAtividadesPage({ viewAtiva, onNavegar }: Props) {
  const [atividades, setAtividades] = useState<CatalogoAtividadeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroEspecialidade, setFiltroEspecialidade] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<'true' | 'false' | ''>('');
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [subServicos, setSubServicos] = useState<SubServico[]>([]);
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoExcluir, setConfirmandoExcluir] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setLoading(true);
    setErro(null);
    Promise.all([
      listarCatalogoAtividades({
        q: busca || undefined,
        especialidade: filtroEspecialidade || undefined,
        ativo: filtroAtivo === '' ? undefined : filtroAtivo === 'true',
      }),
      listarEtapasTodas(),
      listarSubServicosTodas(),
    ])
      .then(([lista, et, sub]) => {
        setAtividades(lista);
        setEtapas(et);
        setSubServicos(sub);
      })
      .catch((err) =>
        setErro(err instanceof Error ? err.message : 'Falha ao carregar.'),
      )
      .finally(() => setLoading(false));
  }, [busca, filtroEspecialidade, filtroAtivo]);

  async function toggleAtivo(atv: CatalogoAtividadeItem) {
    setErro(null);
    try {
      const atualizada = await atualizarCatalogoAtividade(atv.id, {
        ativo: !atv.ativo,
      });
      setAtividades((prev) =>
        prev.map((a) => (a.id === atualizada.id ? atualizada : a)),
      );
    } catch (err) {
      setErro(
        err instanceof Error ? err.message : 'Falha ao alterar status.',
      );
    }
  }

  async function excluir(atv: CatalogoAtividadeItem) {
    setErro(null);
    try {
      await excluirCatalogoAtividade(atv.id);
      setAtividades((prev) => prev.filter((a) => a.id !== atv.id));
      setConfirmandoExcluir(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao excluir.');
    }
  }

  function nomeEtapa(id?: number | null): string {
    if (id == null) return '—';
    return etapas.find((e) => e.id === id)?.nome ?? `#${id}`;
  }

  function nomeSub(id?: number | null): string {
    if (id == null) return '—';
    return subServicos.find((s) => s.id === id)?.nome ?? `#${id}`;
  }

  if (viewAtiva === 'analises') {
    return <AnalisesView atividades={atividades} />;
  }

  if (viewAtiva === 'novo') {
    return (
      <FormularioAtividade
        etapas={etapas}
        subServicos={subServicos}
        onVoltar={() => onNavegar('lista')}
        onSalvo={() => onNavegar('lista')}
      />
    );
  }

  if (viewAtiva === 'editar' && idEditando) {
    const atividade = atividades.find((a) => a.id === idEditando);
    if (atividade) {
      return (
        <FormularioAtividade
          etapas={etapas}
          subServicos={subServicos}
          atividade={atividade}
          onVoltar={() => {
            setIdEditando(null);
            onNavegar('lista');
          }}
          onSalvo={() => {
            setIdEditando(null);
            onNavegar('lista');
          }}
        />
      );
    }
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
            {ESPECIALIDADES_CATALOGO.map((e) => (
              <option key={e} value={e}>
                {fmtEspecialidade(e)}
              </option>
            ))}
          </select>
          <select
            value={filtroAtivo}
            onChange={(e) =>
              setFiltroAtivo(e.target.value as 'true' | 'false' | '')
            }
            className={cn(selectClasses, 'h-9 w-32')}
          >
            <option value="">Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </div>
      </div>

      {erro && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erro}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : atividades.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma atividade encontrada.
        </p>
      ) : (
        <div className="space-y-3">
          {atividades.map((atv) => (
            <AtividadeCard
              key={atv.id}
              atividade={atv}
              nomeEtapa={nomeEtapa}
              nomeSub={nomeSub}
              onEditar={() => {
                setIdEditando(atv.id);
                onNavegar('editar');
              }}
              onToggleAtivo={() => toggleAtivo(atv)}
              onExcluir={() => excluir(atv)}
              confirmando={confirmandoExcluir === atv.id}
              onCancelarExcluir={() => setConfirmandoExcluir(null)}
              onConfirmarExcluir={() => setConfirmandoExcluir(atv.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BadgeAtivo({ ativo }: { ativo: boolean }) {
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

function AtividadeCard({
  atividade,
  nomeEtapa,
  nomeSub,
  onEditar,
  onToggleAtivo,
  onExcluir,
  confirmando,
  onCancelarExcluir,
  onConfirmarExcluir,
}: {
  atividade: CatalogoAtividadeItem;
  nomeEtapa: (id?: number | null) => string;
  nomeSub: (id?: number | null) => string;
  onEditar: () => void;
  onToggleAtivo: () => void;
  onExcluir: () => void;
  confirmando: boolean;
  onCancelarExcluir: () => void;
  onConfirmarExcluir: () => void;
}) {
  const [expandido, setExpandido] = useState(false);

  return (
    <Card className={cn(!atividade.ativo && 'opacity-70')}>
      <CardHeader
        className="cursor-pointer py-3"
        onClick={() => setExpandido(!expandido)}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{atividade.nome}</CardTitle>
              <BadgeAtivo ativo={atividade.ativo} />
            </div>
            <CardDescription>{atividade.descricao}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {fmtEspecialidade(atividade.especialidadeNecessaria)}
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
        <CardContent className="pt-0" onClick={(e) => e.stopPropagation()}>
          <div className="mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>
              Etapa: <strong className="text-foreground">{nomeEtapa(atividade.etapaId)}</strong>
            </span>
            <span>
              Sub-serviço:{' '}
              <strong className="text-foreground">
                {nomeSub(atividade.subServicoId)}
              </strong>
            </span>
          </div>
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
            <div className="mb-4">
              <h4 className="mb-1 text-sm font-medium">Recursos Necessários</h4>
              <ul className="space-y-1">
                {atividade.recursos.map((r) => (
                  <li key={r.id} className="text-sm text-muted-foreground">
                    <span className="font-medium capitalize">
                      {fmtTipoRecurso(r.tipo)}
                    </span>
                    {' — '}
                    Item #{r.itemCatalogoId} × {r.quantidade}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" size="sm" variant="outline" onClick={onEditar}>
              Editar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onToggleAtivo}
            >
              {atividade.ativo ? 'Desativar' : 'Reativar'}
            </Button>
            {confirmando ? (
              <span className="flex items-center gap-2 text-xs">
                <span className="text-destructive">
                  Excluir definitivamente?
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={onExcluir}
                >
                  Confirmar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={onCancelarExcluir}
                >
                  Cancelar
                </Button>
              </span>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onConfirmarExcluir}
              >
                Excluir
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function AnalisesView({ atividades }: { atividades: CatalogoAtividadeItem[] }) {
  const total = atividades.length;
  const porEspecialidade = atividades.reduce(
    (acc, a) => {
      const nome = fmtEspecialidade(a.especialidadeNecessaria);
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
      <div className="grid gap-4 sm:grid-cols-4">
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
            <CardDescription>Ativos</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {atividades.filter((a) => a.ativo).length}
            </span>
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

function FormularioAtividade({
  etapas,
  subServicos,
  atividade,
  onVoltar,
  onSalvo,
}: {
  etapas: Etapa[];
  subServicos: SubServico[];
  atividade?: CatalogoAtividadeItem;
  onVoltar: () => void;
  onSalvo: () => void;
}) {
  const editando = Boolean(atividade);
  const [nome, setNome] = useState(atividade?.nome ?? '');
  const [descricao, setDescricao] = useState(atividade?.descricao ?? '');
  const [especialidade, setEspecialidade] = useState(
    atividade?.especialidadeNecessaria ?? 'OUTROS',
  );
  const [tempoEstimado, setTempoEstimado] = useState(
    atividade?.tempoEstimadoHoras != null
      ? String(atividade.tempoEstimadoHoras)
      : '',
  );
  const [etapaId, setEtapaId] = useState(
    atividade?.etapaId != null ? String(atividade.etapaId) : '',
  );
  const [subServicoId, setSubServicoId] = useState(
    atividade?.subServicoId != null ? String(atividade.subServicoId) : '',
  );
  const [ativo, setAtivo] = useState(atividade?.ativo ?? true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [subSteps, setSubSteps] = useState<{ descricao: string }[]>(
    atividade?.subSteps.map((s) => ({ descricao: s.descricao })) ?? [],
  );
  const [recursos, setRecursos] = useState<
    { tipo: string; itemCatalogoId: string; quantidade: string }[]
  >(
    atividade?.recursos.map((r) => ({
      tipo: r.tipo,
      itemCatalogoId: String(r.itemCatalogoId),
      quantidade: String(r.quantidade),
    })) ?? [],
  );

  const subServicosFiltrados = etapaId
    ? subServicos.filter((s) => s.etapaId === Number(etapaId))
    : subServicos;

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
    setErro(null);
    try {
      const base = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        especialidadeNecessaria: especialidade,
        tempoEstimadoHoras: tempoEstimado ? Number(tempoEstimado) : null,
        etapaId: etapaId ? Number(etapaId) : null,
        subServicoId: subServicoId ? Number(subServicoId) : null,
      };
      if (editando && atividade) {
        await atualizarCatalogoAtividade(atividade.id, {
          ...base,
          ativo,
        });
      } else {
        await criarCatalogoAtividade({
          ...base,
          subSteps: subSteps
            .filter((s) => s.descricao.trim())
            .map((s, i) => ({
              ordem: i + 1,
              descricao: s.descricao.trim(),
            })),
          recursos: recursos
            .filter((r) => r.itemCatalogoId)
            .map((r) => ({
              tipo: r.tipo,
              itemCatalogoId: Number(r.itemCatalogoId),
              quantidade: Number(r.quantidade) || 1,
            })),
        });
      }
      onSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="w-full max-w-5xl">
      <CardHeader>
        <CardTitle>
          {editando ? 'Editar Atividade do Catálogo' : 'Nova Atividade no Catálogo'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {erro && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {erro}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cat-nome">Nome *</Label>
            <Input
              id="cat-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="cat-desc">Descrição</Label>
            <Input
              id="cat-desc"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="cat-esp">Especialidade</Label>
              <select
                id="cat-esp"
                value={especialidade}
                onChange={(e) => setEspecialidade(e.target.value)}
                className={selectClasses}
              >
                {ESPECIALIDADES_CATALOGO.map((e) => (
                  <option key={e} value={e}>
                    {fmtEspecialidade(e)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="cat-tempo">Tempo Estimado (horas)</Label>
              <Input
                id="cat-tempo"
                type="number"
                min={0}
                value={tempoEstimado}
                onChange={(e) => setTempoEstimado(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cat-etapa">Etapa</Label>
              <select
                id="cat-etapa"
                value={etapaId}
                onChange={(e) => {
                  setEtapaId(e.target.value);
                  setSubServicoId('');
                }}
                className={selectClasses}
              >
                <option value="">—</option>
                {etapas
                  .filter((et) => et.ativo)
                  .map((et) => (
                    <option key={et.id} value={et.id}>
                      {et.nome}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <Label htmlFor="cat-sub">Sub-serviço</Label>
              <select
                id="cat-sub"
                value={subServicoId}
                onChange={(e) => setSubServicoId(e.target.value)}
                className={selectClasses}
              >
                <option value="">—</option>
                {subServicosFiltrados
                  .filter((s) => s.ativo)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {editando && (
            <div className="flex items-center gap-2">
              <Label htmlFor="cat-ativo">Ativo</Label>
              <input
                id="cat-ativo"
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="h-4 w-4"
              />
            </div>
          )}

          {!editando && (
            <>
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
                        {
                          tipo: 'EQUIPAMENTO',
                          itemCatalogoId: '',
                          quantidade: '1',
                        },
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
                      className={cn(selectClasses, 'h-9 w-36')}
                    >
                      {TIPOS_RECURSO_ATIVIDADE.map((t) => (
                        <option key={t} value={t}>
                          {TIPO_RECURSO_LABEL[t] ?? t}
                        </option>
                      ))}
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
            </>
          )}

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
