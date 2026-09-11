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
import { criarEquipe, type EquipeItem, listarEquipes } from '../lib/api';
import { cn } from '../lib/utils';

const selectClasses =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

type ViewAtiva = 'analises' | 'lista' | 'novo';

interface Props {
  viewAtiva: ViewAtiva;
  onNavegar: (view: ViewAtiva) => void;
}

export function EquipesPage({ viewAtiva, onNavegar }: Props) {
  const [equipes, setEquipes] = useState<EquipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  function carregar() {
    setLoading(true);
    listarEquipes({
      q: busca || undefined,
      status: filtroStatus || undefined,
    })
      .then(setEquipes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(carregar, [busca, filtroStatus]);

  if (viewAtiva === 'analises') {
    return <AnalisesView equipes={equipes} />;
  }

  if (viewAtiva === 'novo') {
    return (
      <FormularioNovo
        onVoltar={() => onNavegar('lista')}
        onSalvo={() => {
          onNavegar('lista');
          carregar();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Equipes</h2>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="filtro-status">
            Filtrar por status
          </label>
          <Input
            aria-label="Buscar equipes"
            placeholder="Buscar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-9 w-48"
          />
          <select
            id="filtro-status"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className={cn(selectClasses, 'h-9 w-36')}
          >
            <option value="">Todos</option>
            <option value="ATIVA">Ativa</option>
            <option value="INATIVA">Inativa</option>
            <option value="EM_EXECUCAO">Em Execução</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : equipes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma equipe encontrada.
        </p>
      ) : (
        <div className="space-y-3">
          {equipes.map((eq) => (
            <EquipeCard key={eq.id} equipe={eq} />
          ))}
        </div>
      )}
    </div>
  );
}

function EquipeCard({ equipe }: { equipe: EquipeItem }) {
  const [expandido, setExpandido] = useState(false);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer py-3"
        role="button"
        tabIndex={0}
        aria-expanded={expandido}
        onClick={() => setExpandido(!expandido)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpandido(!expandido);
          }
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{equipe.nome}</CardTitle>
            <CardDescription>{equipe.descricao}</CardDescription>
          </div>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              equipe.status === 'ATIVA'
                ? 'bg-emerald-500/10 text-emerald-600'
                : equipe.status === 'EM_EXECUCAO'
                  ? 'bg-amber-500/10 text-amber-600'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            {equipe.status === 'ATIVA'
              ? 'Ativa'
              : equipe.status === 'EM_EXECUCAO'
                ? 'Em Execução'
                : 'Inativa'}
          </span>
        </div>
      </CardHeader>
      {expandido && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div>
              <h4 className="mb-1 text-sm font-medium">Especialidade</h4>
              <span className="text-sm text-muted-foreground">
                {equipe.especialidade
                  ? equipe.especialidade.charAt(0) +
                    equipe.especialidade.slice(1).toLowerCase()
                  : 'Não definida'}
              </span>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-medium">
                Membros ({equipe.membros?.length ?? 0})
              </h4>
              {!equipe.membros || equipe.membros.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum membro adicionado.
                </p>
              ) : (
                <ul className="space-y-1">
                  {equipe.membros.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {m.usuario?.nome ?? `Usuário #${m.usuarioId}`}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          m.funcao === 'LIDER'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {m.funcao === 'LIDER' ? 'Líder' : 'Executante'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function AnalisesView({ equipes }: { equipes: EquipeItem[] }) {
  const total = equipes.length;
  const ativas = equipes.filter((e) => e.status === 'ATIVA').length;
  const emExecucao = equipes.filter((e) => e.status === 'EM_EXECUCAO').length;
  const totalMembros = equipes.reduce(
    (acc, e) => acc + (e.membros?.length ?? 0),
    0,
  );

  const porEspecialidade = equipes.reduce(
    (acc, e) => {
      const esp = e.especialidade ?? 'Não definida';
      acc[esp] = (acc[esp] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Análises — Equipes</h2>
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
            <CardDescription>Ativas</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-emerald-600">
              {ativas}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Em Execução</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-amber-600">
              {emExecucao}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Membros</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{totalMembros}</span>
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
  const [especialidade, setEspecialidade] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setSaving(true);
    try {
      await criarEquipe({
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        especialidade: especialidade || null,
      });
      onSalvo();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Nova Equipe</CardTitle>
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
          <div>
            <label className="mb-1 block text-sm font-medium">
              Especialidade
            </label>
            <Input
              value={especialidade}
              onChange={(e) => setEspecialidade(e.target.value)}
              placeholder="Ex: Eletricista, Pintor..."
            />
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

export default EquipesPage;
