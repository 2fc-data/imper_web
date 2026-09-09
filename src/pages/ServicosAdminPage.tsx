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
  atualizarServico,
  criarServico,
  excluirServico,
  listarServicosAdmin,
  type ServicoMarketing,
  type ServicoMarketingInput,
} from '../lib/api';
import { cn } from '../lib/utils';

const textareaClasses =
  'flex min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

const selectClasses =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

const ICONES = [
  { rotulo: 'Piscina / Infiltração', d: 'M19 9l-7 12-7-12a7 7 0 1114 0z' },
  {
    rotulo: 'Manta asfáltica',
    d: 'M4 18l2-8h12l2 8M7 10l1-5h8l1 5M8 10a2 2 0 100 4M16 10a2 2 0 100 4',
  },
  { rotulo: 'Lajes e paredes', d: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6' },
  {
    rotulo: "Gota d'água",
    d: 'M12 2.5c3.5 4 6.5 7.4 6.5 11a6.5 6.5 0 11-13 0c0-3.6 3-7 6.5-11z',
  },
  {
    rotulo: 'Escudo de proteção',
    d: 'M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z',
  },
  {
    rotulo: 'Martelo',
    d: 'M15 12l6-6a2.8 2.8 0 00-4-4l-6 6M5 21l4-4 4 4m-6-1L3 14a2 2 0 014 0',
  },
];

const ICONE_PADRAO = ICONES[0]!.d;

function IconeServico({ d, className }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('h-5 w-5 shrink-0', className)}
    >
      <path d={d} />
    </svg>
  );
}

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

function FormatoData({ value }: { value: string }) {
  return (
    <span className="text-xs text-muted-foreground">
      {new Date(value).toLocaleDateString('pt-BR')}
    </span>
  );
}

const vazio: ServicoMarketingInput = {
  titulo: '',
  descricao: '',
  icone: ICONE_PADRAO,
  ativo: true,
};

interface ServicosAnalisesProps {
  servicos: ServicoMarketing[];
}

export function ServicosAnalises({ servicos }: ServicosAnalisesProps) {
  const total = servicos.length;
  const ativos = servicos.filter((s) => s.ativo).length;
  const inativos = servicos.filter((s) => !s.ativo).length;
  const taxa = total ? Math.round((ativos / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Análises de Serviços
        </h2>
        <p className="text-sm text-muted-foreground">
          Visão geral dos serviços exibidos na página de orçamento.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Total de serviços
          </p>
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
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
        <h3 className="font-semibold text-base">Taxa de serviços ativos</h3>
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium">
            <span>
              {ativos} de {total} ativos
            </span>
            <span>{taxa}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-primary/40 overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${taxa}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServicosAdminPage({
  viewAtiva = 'lista',
  onNavegar,
}: {
  viewAtiva?: 'analises' | 'lista' | 'novo';
  onNavegar?: (v: 'analises' | 'lista' | 'novo') => void;
}) {
  const [servicos, setServicos] = useState<ServicoMarketing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<'' | 'ativos' | 'inativos'>(
    '',
  );
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState<ServicoMarketing | null>(null);
  const [form, setForm] = useState<ServicoMarketingInput>(vazio);
  const [toggling, setToggling] = useState<number | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<number | null>(
    null,
  );
  const [excluindo, setExcluindo] = useState<number | null>(null);

  const carregar = useCallback(async (q?: string) => {
    setError(null);
    try {
      const lista = await listarServicosAdmin(q ? { q } : undefined);
      setServicos(lista);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao listar serviços');
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function comecarEdicao(s: ServicoMarketing) {
    setEditando(s);
    setForm({
      titulo: s.titulo,
      descricao: s.descricao,
      icone: s.icone,
      ativo: s.ativo,
    });
    setError(null);
  }

  function cancelarEdicao() {
    setEditando(null);
    setForm(vazio);
    setError(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editando) {
        const atualizado = await atualizarServico(editando.id, form);
        setServicos((prev) =>
          prev.map((s) => (s.id === atualizado.id ? atualizado : s)),
        );
      } else {
        const criado = await criarServico(form);
        setServicos((prev) => [criado, ...prev]);
        onNavegar?.('lista');
      }
      setForm(vazio);
      setEditando(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar serviço');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtivo(s: ServicoMarketing) {
    setToggling(s.id);
    setError(null);
    try {
      const atualizado = await atualizarServico(s.id, { ativo: !s.ativo });
      setServicos((prev) =>
        prev.map((item) => (item.id === atualizado.id ? atualizado : item)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao atualizar serviço',
      );
    } finally {
      setToggling(null);
    }
  }

  async function handleExcluir(id: number) {
    setExcluindo(id);
    setError(null);
    try {
      await excluirServico(id);
      setServicos((prev) => prev.filter((s) => s.id !== id));
      setConfirmandoExclusao(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir serviço');
    } finally {
      setExcluindo(null);
    }
  }

  const filtrados = servicos.filter((s) => {
    if (filtroAtivo === 'ativos' && !s.ativo) return false;
    if (filtroAtivo === 'inativos' && s.ativo) return false;
    const texto = busca.trim().toLowerCase();
    if (!texto) return true;
    return `${s.titulo} ${s.descricao}`.toLowerCase().includes(texto);
  });

  const formulario = (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {editando ? `Editar: ${editando.titulo}` : 'Novo serviço'}
        </CardTitle>
        <CardDescription>
          {editando
            ? 'Altere os campos e salve as alterações.'
            : 'Preencha os dados para cadastrar um serviço.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              required
              minLength={2}
              placeholder="Ex.: Manutenção preventiva"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <textarea
              id="descricao"
              required
              minLength={2}
              placeholder="Descreva o serviço..."
              className={textareaClasses}
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="icone">Ícone</Label>
            <select
              id="icone"
              required
              value={form.icone}
              onChange={(e) => setForm({ ...form, icone: e.target.value })}
              className={selectClasses}
            >
              <option value="" disabled>
                Selecione um ícone...
              </option>
              {ICONES.map((ic) => (
                <option key={ic.d} value={ic.d}>
                  {ic.rotulo}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.ativo ?? true}
              onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            Ativo na página de orçamento
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving
                ? 'Salvando...'
                : editando
                  ? 'Salvar alterações'
                  : 'Cadastrar'}
            </Button>
            {editando && (
              <Button type="button" variant="outline" onClick={cancelarEdicao}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );

  if (viewAtiva === 'analises') {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Serviços</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os serviços exibidos na página de orçamento
          </p>
        </header>

        <ServicosAnalises servicos={servicos} />

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

  if (viewAtiva === 'novo') {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            Novo serviço
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastre um novo serviço para exibição na página de orçamento.
          </p>
        </header>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {formulario}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Serviços</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie os serviços exibidos na página de orçamento
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar serviço por título ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <select
          value={filtroAtivo}
          onChange={(e) =>
            setFiltroAtivo(e.target.value as '' | 'ativos' | 'inativos')
          }
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">TODOS OS STATUS</option>
          <option value="ativos">Ativos</option>
          <option value="inativos">Inativos</option>
        </select>
      </div>

      {editando && formulario}

      <div className="space-y-3">
        {filtrados.map((s) => (
          <Card key={s.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <IconeServico d={s.icone} className="text-primary" />
                  <CardTitle className="text-base">{s.titulo}</CardTitle>
                </div>
                <BadgeAtivo ativo={s.ativo} />
              </div>
              <CardDescription>{s.descricao}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <FormatoData value={s.createdAt} />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={toggling === s.id}
                    onClick={() => handleToggleAtivo(s)}
                  >
                    {toggling === s.id
                      ? 'Salvando...'
                      : s.ativo
                        ? 'Desativar'
                        : 'Ativar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => comecarEdicao(s)}
                  >
                    Editar
                  </Button>
                  {confirmandoExclusao === s.id ? (
                    <>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={excluindo === s.id}
                        onClick={() => handleExcluir(s.id)}
                      >
                        {excluindo === s.id
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
                      onClick={() => setConfirmandoExclusao(s.id)}
                    >
                      Excluir
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {!error && filtrados.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum serviço encontrado.
          </p>
        )}
      </div>
    </div>
  );
}
