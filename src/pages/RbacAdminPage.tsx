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
  atualizarPapelRbac,
  criarPapelRbac,
  definirPermissoesRbac,
  excluirPapelRbac,
  listarPapeisRbac,
  listarPermissoesRbac,
  type PapelRbacAdmin,
  type PermissaoRbac,
} from '../lib/api';

const CORES: Record<string, string> = {
  usuarios: 'bg-primary/15 text-primary',
  atendimentos: 'bg-success/15 text-success',
  ordens_servico: 'bg-warning/15 text-warning',
  financeiro: 'bg-accent/15 text-accent',
  estoque: 'bg-info/15 text-info',
  equipamentos: 'bg-primary/15 text-primary',
  epis: 'bg-destructive/15 text-destructive',
  relatorios: 'bg-success/15 text-success',
  configuracoes: 'bg-muted text-muted-foreground',
};

function badgeColor(categoria: string) {
  return CORES[categoria] ?? 'bg-muted text-muted-foreground';
}

export default function RbacAdminPage({
  viewAtiva,
  onNavegar,
}: {
  viewAtiva: 'papeis' | 'permissoes';
  onNavegar: (v: 'papeis' | 'permissoes') => void;
}) {
  const [papeis, setPapeis] = useState<PapelRbacAdmin[]>([]);
  const [permissoes, setPermissoes] = useState<PermissaoRbac[]>([]);
  const [papelSel, setPapelSel] = useState<PapelRbacAdmin | null>(null);
  const [permissoesSel, setPermissoesSel] = useState<Set<number>>(new Set());
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [editando, setEditando] = useState<PapelRbacAdmin | null>(null);

  useEffect(() => {
    Promise.all([listarPapeisRbac(), listarPermissoesRbac()])
      .then(([p, pm]) => {
        setPapeis(p);
        setPermissoes(pm);
      })
      .catch((e) => setErro(e.message ?? 'Erro ao carregar dados'))
      .finally(() => setCarregando(false));
  }, []);

  function abrirPermissoes(papel: PapelRbacAdmin) {
    setPapelSel(papel);
    setPermissoesSel(new Set(papel.permissoes.map((p) => p.id)));
    onNavegar('permissoes');
  }

  async function handleExcluir(papel: PapelRbacAdmin) {
    if (!window.confirm(`Excluir o papel "${papel.nome}"?`)) return;
    setErro('');
    try {
      await excluirPapelRbac(papel.id);
      setPapeis((prev) => prev.filter((p) => p.id !== papel.id));
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao excluir papel');
    }
  }

  async function salvarPermissoes() {
    if (!papelSel) return;
    setSalvando(true);
    setErro('');
    try {
      const permissoesIds = permissoes
        .filter((p) => permissoesSel.has(p.id))
        .map((p) => p.id);
      await definirPermissoesRbac(papelSel.id, permissoesIds);
      setPapeis((prev) =>
        prev.map((p) =>
          p.id === papelSel.id
            ? {
                ...p,
                permissoes: permissoes.filter((pm) => permissoesSel.has(pm.id)),
              }
            : p,
        ),
      );
      onNavegar('papeis');
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao salvar permissões');
    } finally {
      setSalvando(false);
    }
  }

  function togglePermissao(id: number) {
    setPermissoesSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  if (viewAtiva === 'permissoes' && papelSel) {
    const porCategoria = permissoes.reduce(
      (acc, p) => {
        if (!acc[p.categoria]) acc[p.categoria] = [];
        acc[p.categoria]!.push(p);
        return acc;
      },
      {} as Record<string, PermissaoRbac[]>,
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => onNavegar('papeis')}>
            ← Voltar
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Permissões — {papelSel.nome}
            </h2>
            <p className="text-sm text-muted-foreground">
              {papelSel.descricao ?? 'Sem descrição'}
            </p>
          </div>
        </div>

        {erro && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {erro}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {permissoesSel.size} de {permissoes.length} permissões selecionadas
          </p>
          <Button onClick={salvarPermissoes} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar permissões'}
          </Button>
        </div>

        {Object.entries(porCategoria).map(([cat, lista]) => (
          <Card key={cat}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badgeColor(cat)}`}
                >
                  {cat}
                </span>
                <span className="text-xs text-muted-foreground">
                  {lista.filter((p) => permissoesSel.has(p.id)).length}/
                  {lista.length}
                </span>
              </CardDescription>
              <CardTitle className="text-base capitalize">
                {cat.replace(/_/g, ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {lista.map((p) => (
                  <label
                    key={p.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors ${
                      permissoesSel.has(p.id)
                        ? 'border-primary/40 bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={permissoesSel.has(p.id)}
                      onChange={() => togglePermissao(p.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.chave}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.descricao}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Papéis e Permissões
        </h2>
        <p className="text-sm text-muted-foreground">
          Gerencie os papéis do sistema e associe permissões a cada um.
        </p>
      </div>

      {erro && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {erro}
        </div>
      )}

      {editando && (
        <EditarPapelCard
          papel={editando}
          onSalvar={(papelAtualizado) => {
            setPapeis((prev) =>
              prev.map((p) =>
                p.id === papelAtualizado.id ? papelAtualizado : p,
              ),
            );
            setEditando(null);
          }}
          onCancelar={() => setEditando(null)}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {papeis.map((papel) => (
          <Card key={papel.id} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{papel.nome}</CardTitle>
              <CardDescription>
                {papel.descricao ?? 'Sem descrição'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1">
                {papel.permissoes.slice(0, 4).map((p) => (
                  <span
                    key={p.id}
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badgeColor(p.categoria)}`}
                  >
                    {p.chave}
                  </span>
                ))}
                {papel.permissoes.length > 4 && (
                  <span className="text-xs text-muted-foreground">
                    +{papel.permissoes.length - 4} mais
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => abrirPermissoes(papel)}
                >
                  Permissões
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditando(papel)}
                >
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleExcluir(papel)}
                >
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <NovoPapelCard
          onCriar={async (nome, descricao) => {
            const papel = await criarPapelRbac({ nome, descricao });
            setPapeis((prev) => [...prev, { ...papel, permissoes: [] }]);
          }}
        />
      </div>
    </div>
  );
}

function NovoPapelCard({
  onCriar,
}: {
  onCriar: (nome: string, descricao?: string) => Promise<void>;
}) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      await onCriar(nome, descricao || undefined);
      setNome('');
      setDescricao('');
      setAberto(false);
    } catch (err: any) {
      setErro(err.message ?? 'Erro ao criar papel');
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-card/50 p-6 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
      >
        <span className="text-2xl">+</span>
        Novo Papel
      </button>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Novo Papel</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          {erro && <p className="text-xs text-destructive">{erro}</p>}
          <div className="space-y-1.5">
            <Label className="text-xs">Nome *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              placeholder="ex: supervisor"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Descrição</Label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={salvando || !nome.trim()}>
              {salvando ? 'Criando...' : 'Criar'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAberto(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function EditarPapelCard({
  papel,
  onSalvar,
  onCancelar,
}: {
  papel: PapelRbacAdmin;
  onSalvar: (papel: PapelRbacAdmin) => void;
  onCancelar: () => void;
}) {
  const [nome, setNome] = useState(papel.nome);
  const [descricao, setDescricao] = useState(papel.descricao ?? '');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      const atualizado = await atualizarPapelRbac(papel.id, {
        nome,
        descricao: descricao || undefined,
      });
      onSalvar({ ...papel, ...atualizado });
    } catch (err: any) {
      setErro(err.message ?? 'Erro ao atualizar papel');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card className="border-warning/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Editar Papel</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          {erro && <p className="text-xs text-destructive">{erro}</p>}
          <div className="space-y-1.5">
            <Label className="text-xs">Nome *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              placeholder="ex: supervisor"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Descrição</Label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={salvando || !nome.trim()}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancelar}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
