import { type FormEvent, useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  atualizarTipoDespesa,
  criarTipoDespesa,
  desativarTipoDespesa,
  listarTiposDespesas,
  type TipoDespesa,
} from '../lib/api';
import { cn } from '../lib/utils';

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

function BadgeRequerObra() {
  return (
    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
      Requer obra
    </span>
  );
}

const emptyForm = {
  nome: '',
  descricao: '',
  requerObra: false,
  ordem: '',
};

export default function TiposDespesasView() {
  const [tipos, setTipos] = useState<TipoDespesa[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editando, setEditando] = useState<TipoDespesa | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setError(null);
    setCarregando(true);
    try {
      const lista = await listarTiposDespesas();
      setTipos(lista);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Falha ao carregar tipos de despesas',
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function editar(t: TipoDespesa) {
    setEditando(t);
    setForm({
      nome: t.nome,
      descricao: t.descricao ?? '',
      requerObra: t.requerObra,
      ordem: String(t.ordem),
    });
    setError(null);
  }

  function cancelar() {
    setEditando(null);
    setForm(emptyForm);
    setError(null);
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const dados = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || undefined,
        requerObra: form.requerObra,
        ordem: Number(form.ordem) || 1,
      };
      if (editando) {
        const atualizado = await atualizarTipoDespesa(editando.id, dados);
        setTipos((prev) =>
          prev
            .map((x) => (x.id === atualizado.id ? atualizado : x))
            .sort((a, b) => a.ordem - b.ordem),
        );
      } else {
        const criado = await criarTipoDespesa(dados);
        setTipos((prev) =>
          [...prev, criado].sort((a, b) => a.ordem - b.ordem),
        );
      }
      cancelar();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Falha ao salvar tipo de despesa',
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggle(t: TipoDespesa) {
    setError(null);
    try {
      const atualizado = await atualizarTipoDespesa(t.id, {
        ativo: !t.ativo,
      });
      setTipos((prev) =>
        prev.map((x) => (x.id === atualizado.id ? atualizado : x)),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Falha ao alterar status do tipo',
      );
    }
  }

  async function excluir(id: number) {
    setError(null);
    try {
      await desativarTipoDespesa(id);
      setTipos((prev) => prev.filter((x) => x.id !== id));
      setConfirmandoId(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao excluir tipo',
      );
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Tipos de Despesas Extras
        </h1>
        <p className="text-sm text-muted-foreground">
          Categorias de despesas extras. Desative em vez de excluir quando
          possível.
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
            {editando
              ? `Editar tipo: ${editando.nome}`
              : 'Novo tipo de despesa'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="tipo-nome">Nome</Label>
              <Input
                id="tipo-nome"
                required
                maxLength={120}
                placeholder="Ex.: Combustível"
                value={form.nome}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nome: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipo-descricao">Descrição</Label>
              <Input
                id="tipo-descricao"
                maxLength={240}
                placeholder="Opcional"
                value={form.descricao}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descricao: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipo-ordem">Ordem</Label>
              <Input
                id="tipo-ordem"
                type="number"
                min={1}
                required
                value={form.ordem}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ordem: e.target.value }))
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.requerObra}
                onChange={(e) =>
                  setForm((f) => ({ ...f, requerObra: e.target.checked }))
                }
                className="h-4 w-4 rounded border-input accent-primary"
              />
              Requer obra vinculada
            </label>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving
                  ? 'Salvando...'
                  : editando
                    ? 'Salvar'
                    : 'Criar'}
              </Button>
              {editando && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelar}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {carregando ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="space-y-3">
          {tipos.map((t) => (
            <Card key={t.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {t.ordem}
                    </span>
                    <CardTitle className="text-base">{t.nome}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.requerObra && <BadgeRequerObra />}
                    <BadgeAtivo ativo={t.ativo} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {t.descricao && (
                  <p className="mb-2 text-sm text-muted-foreground">
                    {t.descricao}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggle(t)}
                  >
                    {t.ativo ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editar(t)}
                  >
                    Editar
                  </Button>
                  {confirmandoId === t.id ? (
                    <>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => excluir(t.id)}
                      >
                        Confirmar exclusão
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmandoId(null)}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmandoId(t.id)}
                    >
                      Excluir
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {tipos.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum tipo de despesa cadastrado.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
