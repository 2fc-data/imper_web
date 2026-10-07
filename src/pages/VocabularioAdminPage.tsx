import { type FormEvent, useCallback, useEffect, useState } from 'react';
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
  atualizarEtapa,
  atualizarSubServico,
  atualizarTermo,
  criarCombo,
  criarEtapa,
  criarSubServico,
  criarTermo,
  excluirCombo,
  listarCombos,
  listarEtapasTodas,
  listarSubServicosTodas,
  listarTermos,
  reativarCombo,
  removerEtapa,
  removerSubServico,
  type ComboRow,
  type DimensaoVocabulario,
  type Etapa,
  type SubServico,
  type Termo,
} from '../lib/api';
import { cn } from '../lib/utils';

type ViewAtiva = 'analises' | 'etapas' | 'termos' | 'sub-servicos' | 'combos';

interface Props {
  viewAtiva: ViewAtiva;
  onNavegar: (view: ViewAtiva) => void;
}

const selectClasses =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

const DIMENSOES: { dim: DimensaoVocabulario; rotulo: string }[] = [
  { dim: 'verbos', rotulo: 'Verbos' },
  { dim: 'objetos', rotulo: 'Objetos' },
  { dim: 'locais', rotulo: 'Locais' },
  { dim: 'caracteristicas', rotulo: 'Características' },
];

function BadgeAtivo({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium',
        ativo ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
      )}
    >
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  );
}

export default function VocabularioAdminPage({
  viewAtiva = 'etapas',
  onNavegar,
}: Props) {
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [subServicos, setSubServicos] = useState<SubServico[]>([]);
  const [termosPorDim, setTermosPorDim] = useState<
    Record<DimensaoVocabulario, Termo[]>
  >({
    verbos: [],
    objetos: [],
    locais: [],
    caracteristicas: [],
  });
  const [combos, setCombos] = useState<ComboRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Etapas form
  const [etapaForm, setEtapaForm] = useState<{ nome: string; ordem: string }>({
    nome: '',
    ordem: '',
  });
  const [editandoEtapa, setEditandoEtapa] = useState<Etapa | null>(null);
  const [savingEtapa, setSavingEtapa] = useState(false);
  const [confirmandoEtapa, setConfirmandoEtapa] = useState<number | null>(
    null,
  );

  // Termo form
  const [dimAtiva, setDimAtiva] = useState<DimensaoVocabulario>('verbos');
  const [termoNome, setTermoNome] = useState('');
  const [savingTermo, setSavingTermo] = useState(false);
  const [editandoTermo, setEditandoTermo] = useState<Termo | null>(null);

  // Sub-serviço form
  const [subForm, setSubForm] = useState<{ etapaId: string; nome: string }>({
    etapaId: '',
    nome: '',
  });
  const [editandoSub, setEditandoSub] = useState<SubServico | null>(null);
  const [savingSub, setSavingSub] = useState(false);
  const [confirmandoSub, setConfirmandoSub] = useState<number | null>(null);
  const [filtroSubEtapa, setFiltroSubEtapa] = useState<string>('');

  // Combos
  const [comboSubServicoId, setComboSubServicoId] = useState('');
  const [comboForm, setComboForm] = useState({
    verboId: '',
    objetoId: '',
    localId: '',
    caracteristicaId: '',
  });
  const [savingCombo, setSavingCombo] = useState(false);
  const [reativandoCombo, setReativandoCombo] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setError(null);
    setCarregando(true);
    try {
      const [etapasRes, subsRes, combosRes, ...termosRes] =
        await Promise.all([
          listarEtapasTodas(),
          listarSubServicosTodas(),
          listarCombos(),
          ...DIMENSOES.map((d) => listarTermos(d.dim)),
        ]);
      setEtapas(etapasRes);
      setSubServicos(subsRes);
      setCombos(combosRes);
      setTermosPorDim({
        verbos: termosRes[0],
        objetos: termosRes[1],
        locais: termosRes[2],
        caracteristicas: termosRes[3],
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao carregar vocabulário',
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // ── Etapas ────────────────────────────────────────────────────────────────

  function editarEtapa(e: Etapa) {
    setEditandoEtapa(e);
    setEtapaForm({ nome: e.nome, ordem: String(e.ordem) });
    setError(null);
  }

  function cancelarEtapa() {
    setEditandoEtapa(null);
    setEtapaForm({ nome: '', ordem: '' });
  }

  async function submitEtapa(ev: FormEvent) {
    ev.preventDefault();
    setSavingEtapa(true);
    setError(null);
    try {
      const dados = {
        nome: etapaForm.nome.trim(),
        ordem: Number(etapaForm.ordem) || 1,
      };
      if (editandoEtapa) {
        const atualizada = await atualizarEtapa(editandoEtapa.id, dados);
        setEtapas((prev) =>
          prev.map((x) => (x.id === atualizada.id ? atualizada : x)),
        );
      } else {
        const criada = await criarEtapa(dados);
        setEtapas((prev) => [...prev, criada].sort((a, b) => a.ordem - b.ordem));
      }
      cancelarEtapa();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar etapa');
    } finally {
      setSavingEtapa(false);
    }
  }

  async function toggleEtapa(e: Etapa) {
    setError(null);
    try {
      const atualizada = await atualizarEtapa(e.id, { ativo: !e.ativo });
      setEtapas((prev) =>
        prev.map((x) => (x.id === atualizada.id ? atualizada : x)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao atualizar etapa',
      );
    }
  }

  async function excluirEtapa(id: number) {
    setError(null);
    try {
      await removerEtapa(id);
      setEtapas((prev) => prev.filter((x) => x.id !== id));
      setConfirmandoEtapa(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir etapa');
    }
  }

  // ── Termos ────────────────────────────────────────────────────────────────

  async function submitTermo(ev: FormEvent) {
    ev.preventDefault();
    if (!termoNome.trim()) return;
    setSavingTermo(true);
    setError(null);
    try {
      const criado = await criarTermo(dimAtiva, termoNome.trim());
      setTermosPorDim((prev) => ({
        ...prev,
        [dimAtiva]: [...prev[dimAtiva], criado],
      }));
      setTermoNome('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar termo');
    } finally {
      setSavingTermo(false);
    }
  }

  async function salvarTermoEditado(ev: FormEvent) {
    ev.preventDefault();
    if (!editandoTermo || !termoNome.trim()) return;
    setSavingTermo(true);
    setError(null);
    try {
      const atualizado = await atualizarTermo(dimAtiva, editandoTermo.id, {
        nome: termoNome.trim(),
      });
      setTermosPorDim((prev) => ({
        ...prev,
        [dimAtiva]: prev[dimAtiva].map((t) =>
          t.id === atualizado.id ? atualizado : t,
        ),
      }));
      setEditandoTermo(null);
      setTermoNome('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao atualizar termo',
      );
    } finally {
      setSavingTermo(false);
    }
  }

  async function toggleTermo(t: Termo) {
    setError(null);
    try {
      const atualizado = await atualizarTermo(dimAtiva, t.id, {
        ativo: !t.ativo,
      });
      setTermosPorDim((prev) => ({
        ...prev,
        [dimAtiva]: prev[dimAtiva].map((x) =>
          x.id === atualizado.id ? atualizado : x,
        ),
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao atualizar termo',
      );
    }
  }

  // ── Sub-serviços ──────────────────────────────────────────────────────────

  function editarSub(s: SubServico) {
    setEditandoSub(s);
    setSubForm({ etapaId: String(s.etapaId), nome: s.nome });
    setError(null);
  }

  function cancelarSub() {
    setEditandoSub(null);
    setSubForm({ etapaId: '', nome: '' });
  }

  async function submitSub(ev: FormEvent) {
    ev.preventDefault();
    setSavingSub(true);
    setError(null);
    try {
      if (editandoSub) {
        const dados: {
          etapaId?: number;
          nome?: string;
        } = {};
        if (subForm.etapaId) dados.etapaId = Number(subForm.etapaId);
        if (subForm.nome.trim()) dados.nome = subForm.nome.trim();
        const atualizado = await atualizarSubServico(editandoSub.id, dados);
        setSubServicos((prev) =>
          prev.map((x) => (x.id === atualizado.id ? atualizado : x)),
        );
      } else {
        if (!subForm.etapaId) {
          setError('Selecione uma etapa para o sub-serviço.');
          return;
        }
        const criado = await criarSubServico(
          Number(subForm.etapaId),
          subForm.nome.trim(),
        );
        setSubServicos((prev) => [...prev, criado]);
      }
      cancelarSub();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao salvar sub-serviço',
      );
    } finally {
      setSavingSub(false);
    }
  }

  async function toggleSub(s: SubServico) {
    setError(null);
    try {
      const atualizado = await atualizarSubServico(s.id, { ativo: !s.ativo });
      setSubServicos((prev) =>
        prev.map((x) => (x.id === atualizado.id ? atualizado : x)),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Falha ao atualizar sub-serviço',
      );
    }
  }

  async function excluirSub(id: number) {
    setError(null);
    try {
      await removerSubServico(id);
      setSubServicos((prev) => prev.filter((x) => x.id !== id));
      setConfirmandoSub(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Falha ao excluir sub-serviço',
      );
    }
  }

  // ── Combos ────────────────────────────────────────────────────────────────

  async function submitCombo(ev: FormEvent) {
    ev.preventDefault();
    if (!comboSubServicoId || !comboForm.verboId || !comboForm.objetoId) {
      setError('Selecione sub-serviço, verbo e objeto.');
      return;
    }
    setSavingCombo(true);
    setError(null);
    try {
      const combo = {
        verboId: Number(comboForm.verboId),
        objetoId: Number(comboForm.objetoId),
        ...(comboForm.localId
          ? { localId: Number(comboForm.localId) }
          : { localId: null }),
        ...(comboForm.caracteristicaId
          ? { caracteristicaId: Number(comboForm.caracteristicaId) }
          : { caracteristicaId: null }),
      };
      await criarCombo(Number(comboSubServicoId), combo);
      const atualizados = await listarCombos({
        ...(comboSubServicoId
          ? { subServicoId: Number(comboSubServicoId) }
          : {}),
      });
      setCombos((prev) => {
        if (comboSubServicoId) {
          return [
            ...prev.filter((c) => c.subServicoId !== Number(comboSubServicoId)),
            ...atualizados,
          ];
        }
        const idsNovos = new Set(atualizados.map((c) => c.id));
        return [...prev.filter((c) => !idsNovos.has(c.id)), ...atualizados];
      });
      setComboForm({
        verboId: '',
        objetoId: '',
        localId: '',
        caracteristicaId: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar combo');
    } finally {
      setSavingCombo(false);
    }
  }

  async function toggleCombo(c: ComboRow) {
    setError(null);
    try {
      await excluirCombo(c.id);
      setCombos((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, ativo: false } : x)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao desativar combo',
      );
    } finally {
      setReativandoCombo(null);
    }
  }

  async function reativar(c: ComboRow) {
    setReativandoCombo(c.id);
    setError(null);
    try {
      await reativarCombo(c.id);
      setCombos((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, ativo: true } : x)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao reativar combo',
      );
    } finally {
      setReativandoCombo(null);
    }
  }

  // ── Derivados ─────────────────────────────────────────────────────────────

  const etapasAtivas = etapas.filter((e) => e.ativo);
  const subsFiltrados = subServicos.filter(
    (s) => !filtroSubEtapa || s.etapaId === Number(filtroSubEtapa),
  );
  const combosFiltrados = combos.filter(
    (c) => !comboSubServicoId || c.subServicoId === Number(comboSubServicoId),
  );

  const termosVisiveis = termosPorDim[dimAtiva] ?? [];

  function nomeEtapa(id: number): string {
    return etapas.find((e) => e.id === id)?.nome ?? `#${id}`;
  }

  function nomeSub(id: number): string {
    return subServicos.find((s) => s.id === id)?.nome ?? `#${id}`;
  }

  // ── Views ─────────────────────────────────────────────────────────────────

  if (carregando) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (viewAtiva === 'analises') {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Vocabulário</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie etapas, termos, sub-serviços e combos do orçamento
          </p>
        </header>
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">
              Etapas
            </p>
            <p className="mt-2 text-2xl font-bold">{etapas.length}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">
              Sub-serviços
            </p>
            <p className="mt-2 text-2xl font-bold">{subServicos.length}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">
              Combos
            </p>
            <p className="mt-2 text-2xl font-bold">{combos.length}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">
              Termos (total)
            </p>
            <p className="mt-2 text-2xl font-bold">
              {DIMENSOES.reduce(
                (acc, d) => acc + (termosPorDim[d.dim]?.length ?? 0),
                0,
              )}
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={() => onNavegar('etapas')}>
          ← Ir para etapas
        </Button>
      </div>
    );
  }

  if (viewAtiva === 'etapas') {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Etapas</h1>
          <p className="text-sm text-muted-foreground">
            Sequência de etapas da obra. Não exclua etapas usadas no wizard —
            desative-as.
          </p>
        </header>
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {editandoEtapa ? `Editar etapa: ${editandoEtapa.nome}` : 'Nova etapa'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitEtapa} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="etapa-nome">Nome</Label>
                <Input
                  id="etapa-nome"
                  required
                  maxLength={120}
                  placeholder="Ex.: Telhado"
                  value={etapaForm.nome}
                  onChange={(e) =>
                    setEtapaForm((f) => ({ ...f, nome: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="etapa-ordem">Ordem</Label>
                <Input
                  id="etapa-ordem"
                  type="number"
                  min={1}
                  required
                  value={etapaForm.ordem}
                  onChange={(e) =>
                    setEtapaForm((f) => ({ ...f, ordem: e.target.value }))
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={savingEtapa}>
                  {savingEtapa
                    ? 'Salvando...'
                    : editandoEtapa
                      ? 'Salvar'
                      : 'Criar'}
                </Button>
                {editandoEtapa && (
                  <Button type="button" variant="outline" onClick={cancelarEtapa}>
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {etapas.map((e) => (
            <Card key={e.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {e.ordem}
                    </span>
                    <CardTitle className="text-base">{e.nome}</CardTitle>
                  </div>
                  <BadgeAtivo ativo={e.ativo} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleEtapa(e)}
                  >
                    {e.ativo ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editarEtapa(e)}
                  >
                    Editar
                  </Button>
                  {confirmandoEtapa === e.id ? (
                    <>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => excluirEtapa(e.id)}
                      >
                        Confirmar exclusão
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmandoEtapa(null)}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmandoEtapa(e.id)}
                    >
                      Excluir
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {!error && etapas.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma etapa cadastrada.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (viewAtiva === 'termos') {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Termos</h1>
          <p className="text-sm text-muted-foreground">
            Vocabulário por dimensão: verbos, objetos, locais e características
          </p>
        </header>
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {DIMENSOES.map((d) => (
            <Button
              key={d.dim}
              type="button"
              variant={dimAtiva === d.dim ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setDimAtiva(d.dim);
                setEditandoTermo(null);
                setTermoNome('');
                setError(null);
              }}
            >
              {d.rotulo} ({termosPorDim[d.dim]?.length ?? 0})
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {editandoTermo
                ? `Editar termo: ${editandoTermo.nome}`
                : `Novo termo em ${DIMENSOES.find((d) => d.dim === dimAtiva)?.rotulo}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={editandoTermo ? salvarTermoEditado : submitTermo}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <Label htmlFor="termo-nome">Nome (máx. 60)</Label>
                <Input
                  id="termo-nome"
                  required
                  maxLength={60}
                  value={termoNome}
                  onChange={(e) => setTermoNome(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={savingTermo}>
                  {savingTermo
                    ? 'Salvando...'
                    : editandoTermo
                      ? 'Salvar'
                      : 'Criar'}
                </Button>
                {editandoTermo && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditandoTermo(null);
                      setTermoNome('');
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {termosVisiveis.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex items-center justify-between gap-2 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{t.nome}</span>
                  <BadgeAtivo ativo={t.ativo} />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleTermo(t)}
                  >
                    {t.ativo ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditandoTermo(t);
                      setTermoNome(t.nome);
                      setError(null);
                    }}
                  >
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!error && termosVisiveis.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum termo nesta dimensão.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (viewAtiva === 'sub-servicos') {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Sub-serviços</h1>
          <p className="text-sm text-muted-foreground">
            Sub-serviços por etapa, usados na cascata do orçamento
          </p>
        </header>
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <select
            value={filtroSubEtapa}
            onChange={(e) => setFiltroSubEtapa(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Todas as etapas</option>
            {etapas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {editandoSub
                ? `Editar sub-serviço: ${editandoSub.nome}`
                : 'Novo sub-serviço'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitSub} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="sub-etapa">Etapa *</Label>
                <select
                  id="sub-etapa"
                  required={!editandoSub}
                  value={subForm.etapaId}
                  onChange={(e) =>
                    setSubForm((f) => ({ ...f, etapaId: e.target.value }))
                  }
                  className={selectClasses}
                >
                  <option value="">Selecione a etapa…</option>
                  {etapasAtivas.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sub-nome">Nome (máx. 120) *</Label>
                <Input
                  id="sub-nome"
                  required
                  maxLength={120}
                  placeholder="Ex.: Reparo de infiltração"
                  value={subForm.nome}
                  onChange={(e) =>
                    setSubForm((f) => ({ ...f, nome: e.target.value }))
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={savingSub}>
                  {savingSub
                    ? 'Salvando...'
                    : editandoSub
                      ? 'Salvar'
                      : 'Criar'}
                </Button>
                {editandoSub && (
                  <Button type="button" variant="outline" onClick={cancelarSub}>
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {subsFiltrados.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{s.nome}</CardTitle>
                    <CardDescription>{nomeEtapa(s.etapaId)}</CardDescription>
                  </div>
                  <BadgeAtivo ativo={s.ativo} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSub(s)}
                  >
                    {s.ativo ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editarSub(s)}
                  >
                    Editar
                  </Button>
                  {confirmandoSub === s.id ? (
                    <>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => excluirSub(s.id)}
                      >
                        Confirmar exclusão
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmandoSub(null)}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmandoSub(s.id)}
                    >
                      Excluir
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {!error && subsFiltrados.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum sub-serviço encontrado.
            </p>
          )}
        </div>
      </div>
    );
  }

  // viewAtiva === 'combos'
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Combos (combinações)
        </h1>
        <p className="text-sm text-muted-foreground">
          Combinações verbo × objeto (× local / característica) por sub-serviço
        </p>
      </header>
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Novo combo</CardTitle>
          <CardDescription>
            Crie uma combinação em um sub-serviço ativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitCombo} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="combo-sub">Sub-serviço *</Label>
                <select
                  id="combo-sub"
                  required
                  value={comboSubServicoId}
                  onChange={(e) => setComboSubServicoId(e.target.value)}
                  className={selectClasses}
                >
                  <option value="">Selecione…</option>
                  {subServicos
                    .filter((s) => s.ativo)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {nomeEtapa(s.etapaId)} → {s.nome}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="combo-verbo">Verbo *</Label>
                <select
                  id="combo-verbo"
                  required
                  value={comboForm.verboId}
                  onChange={(e) =>
                    setComboForm((f) => ({ ...f, verboId: e.target.value }))
                  }
                  className={selectClasses}
                >
                  <option value="">Selecione…</option>
                  {(termosPorDim.verbos ?? [])
                    .filter((t) => t.ativo)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="combo-objeto">Objeto *</Label>
                <select
                  id="combo-objeto"
                  required
                  value={comboForm.objetoId}
                  onChange={(e) =>
                    setComboForm((f) => ({ ...f, objetoId: e.target.value }))
                  }
                  className={selectClasses}
                >
                  <option value="">Selecione…</option>
                  {(termosPorDim.objetos ?? [])
                    .filter((t) => t.ativo)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="combo-local">Local (opcional)</Label>
                <select
                  id="combo-local"
                  value={comboForm.localId}
                  onChange={(e) =>
                    setComboForm((f) => ({ ...f, localId: e.target.value }))
                  }
                  className={selectClasses}
                >
                  <option value="">—</option>
                  {(termosPorDim.locais ?? [])
                    .filter((t) => t.ativo)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="combo-caract">
                  Característica (opcional)
                </Label>
                <select
                  id="combo-caract"
                  value={comboForm.caracteristicaId}
                  onChange={(e) =>
                    setComboForm((f) => ({
                      ...f,
                      caracteristicaId: e.target.value,
                    }))
                  }
                  className={selectClasses}
                >
                  <option value="">—</option>
                  {(termosPorDim.caracteristicas ?? [])
                    .filter((t) => t.ativo)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={savingCombo}>
                {savingCombo ? 'Criando...' : 'Criar combo'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <select
          value={comboSubServicoId}
          onChange={(e) => setComboSubServicoId(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Todos os sub-serviços</option>
          {subServicos.map((s) => (
            <option key={s.id} value={s.id}>
              {nomeEtapa(s.etapaId)} → {s.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {combosFiltrados.map((c) => (
          <Card key={c.id}>
            <CardContent className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1 text-sm">
                  <span className="font-medium">{c.verbo?.nome ?? c.verboId}</span>
                  <span className="text-muted-foreground">×</span>
                  <span className="font-medium">
                    {c.objeto?.nome ?? c.objetoId}
                  </span>
                  {c.local?.nome && (
                    <>
                      <span className="text-muted-foreground">×</span>
                      <span className="text-muted-foreground">
                        {c.local.nome}
                      </span>
                    </>
                  )}
                  {c.caracteristica?.nome && (
                    <>
                      <span className="text-muted-foreground">×</span>
                      <span className="text-muted-foreground">
                        {c.caracteristica.nome}
                      </span>
                    </>
                  )}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {c.subServico?.nome ?? nomeSub(c.subServicoId)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BadgeAtivo ativo={c.ativo} />
                  {c.ativo ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleCombo(c)}
                    >
                      Desativar
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={reativandoCombo === c.id}
                      onClick={() => reativar(c)}
                    >
                      {reativandoCombo === c.id
                        ? 'Reativando...'
                        : 'Reativar'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {!error && combosFiltrados.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum combo encontrado.
          </p>
        )}
      </div>
    </div>
  );
}
