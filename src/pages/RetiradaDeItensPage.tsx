import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  excluirSeparacao,
  detalharSeparacao,
  listarSeparacoes,
  registrarRetiradaItemSeparacao,
  registrarDevolucaoItemSeparacao,
  confirmarSeparacao,
  notificarEquipeSeparacao,
  type SeparacaoItem,
  type SeparacaoItemDetalhe,
} from '../lib/api';
import { formatarData } from '../lib/datetime';
import { cn } from '../lib/utils';

const selectClasses =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

type TabItem = 'equipamentos' | 'epis' | 'materiais';

const STATUS_COLORS: Record<string, string> = {
  SEPARACAO_PENDENTE: 'bg-amber-500/10 text-amber-600',
  SEPARACAO_CONCLUIDA: 'bg-blue-500/10 text-blue-600',
  EQUIPE_NOTIFICADA: 'bg-purple-500/10 text-purple-600',
  RETIRADA_PENDENTE: 'bg-orange-500/10 text-orange-600',
  RETIRADA_CONCLUIDA: 'bg-emerald-500/10 text-emerald-600',
  DEVOLUCAO_PENDENTE: 'bg-rose-500/10 text-rose-600',
  DEVOLUCAO_CONCLUIDA: 'bg-emerald-600/10 text-emerald-700',
};

const STATUS_LABELS: Record<string, string> = {
  SEPARACAO_PENDENTE: 'Separação Pendente',
  SEPARACAO_CONCLUIDA: 'Separação Concluída',
  EQUIPE_NOTIFICADA: 'Equipe Notificada',
  RETIRADA_PENDENTE: 'Retirada Pendente',
  RETIRADA_CONCLUIDA: 'Retirada Concluída',
  DEVOLUCAO_PENDENTE: 'Devolução Pendente',
  DEVOLUCAO_CONCLUIDA: 'Devolução Concluída',
};

const ITEM_STATUS_COLORS: Record<string, string> = {
  PENDENTE: 'bg-muted text-muted-foreground',
  CONFERIDO: 'bg-emerald-500/10 text-emerald-600',
  DEVOLVIDO: 'bg-blue-500/10 text-blue-600',
  PERDIDO: 'bg-rose-500/10 text-rose-600',
};

function getTabItems(
  itens: SeparacaoItemDetalhe[] | undefined,
  tab: TabItem,
): SeparacaoItemDetalhe[] {
  if (!itens) return [];
  return itens.filter((i) => {
    if (tab === 'equipamentos') return !!i.equipamentoId;
    if (tab === 'epis') return !!i.epiId;
    return !!i.materialId;
  });
}

function ItemStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        ITEM_STATUS_COLORS[status] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {status}
    </span>
  );
}

export function RetiradaDeItensPage() {
  const [separacoes, setSeparacoes] = useState<SeparacaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroOs, setFiltroOs] = useState('');
  const [detalheId, setDetalheId] = useState<number | null>(null);
  const [detalhe, setDetalhe] = useState<SeparacaoItem | null>(null);
  const [tab, setTab] = useState<TabItem>('materiais');
  const [processando, setProcessando] = useState(false);

  function carregar() {
    setLoading(true);
    listarSeparacoes({
      status: filtroStatus || undefined,
      osId: filtroOs ? Number(filtroOs) : undefined,
    })
      .then(setSeparacoes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(carregar, [filtroStatus, filtroOs]);

  useEffect(() => {
    if (detalheId === null) {
      setDetalhe(null);
      return;
    }
    detalharSeparacao(detalheId).then(setDetalhe).catch(console.error);
  }, [detalheId]);

  async function handleRetirarItem(itemId: number) {
    if (!detalhe) return;
    setProcessando(true);
    try {
      await registrarRetiradaItemSeparacao(detalhe.id, itemId, {
        colaboradorId: 0, // TODO: popup de selecao de colaborador
      });
      const atualizado = await detalharSeparacao(detalhe.id);
      setDetalhe(atualizado);
      carregar();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessando(false);
    }
  }

  async function handleDevolverItem(itemId: number) {
    if (!detalhe) return;
    setProcessando(true);
    try {
      await registrarDevolucaoItemSeparacao(detalhe.id, itemId, {
        status: 'DEVOLVIDO',
      });
      const atualizado = await detalharSeparacao(detalhe.id);
      setDetalhe(atualizado);
      carregar();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessando(false);
    }
  }

  async function handleExcluir(id: number) {
    if (!confirm('Excluir esta separação?')) return;
    setProcessando(true);
    try {
      await excluirSeparacao(id);
      setDetalheId(null);
      carregar();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessando(false);
    }
  }

  // Analytics
  const totalSeparacoes = separacoes.length;
  const totalItens = separacoes.reduce(
    (acc, s) => acc + (s.totalItens ?? s.itens?.length ?? 0),
    0,
  );
  const totalRetirados = separacoes.reduce(
    (acc, s) =>
      acc +
      (s.itens?.filter((i) => i.status === 'CONFERIDO').length ?? 0),
    0,
  );

  return (
    <div className="flex h-full">
      {/* Sidebar filtros */}
      <aside className="w-64 shrink-0 border-r p-4 space-y-4">
        <h2 className="text-lg font-semibold">Retirada de Itens</h2>

        <div className="space-y-2">
          <label className="text-sm font-medium">Nº OS</label>
          <input
            type="number"
            placeholder="Filtrar por OS..."
            value={filtroOs}
            onChange={(e) => setFiltroOs(e.target.value)}
            className={selectClasses}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className={selectClasses}
          >
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Analytics */}
        <div className="space-y-3 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground">
            Resumo
          </h3>
          <div className="grid grid-cols-1 gap-2">
            <div className="rounded-lg bg-muted p-3">
              <div className="text-2xl font-bold">{totalSeparacoes}</div>
              <div className="text-xs text-muted-foreground">Separações</div>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <div className="text-2xl font-bold">{totalItens}</div>
              <div className="text-xs text-muted-foreground">Itens Totais</div>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <div className="text-2xl font-bold">{totalRetirados}</div>
              <div className="text-xs text-muted-foreground">
                Itens Retirados
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Conteudo principal */}
      <main className="flex-1 overflow-auto p-4">
        {detalhe ? (
          <DetalheView
            separacao={detalhe}
            tab={tab}
            onTabChange={setTab}
            onVoltar={() => setDetalheId(null)}
            onRetirar={handleRetirarItem}
            onDevolver={handleDevolverItem}
            onExcluir={handleExcluir}
            processando={processando}
          />
        ) : (
          <ListaView
            separacoes={separacoes}
            loading={loading}
            onSelect={setDetalheId}
          />
        )}
      </main>
    </div>
  );
}

function ListaView({
  separacoes,
  loading,
  onSelect,
}: {
  separacoes: SeparacaoItem[];
  loading: boolean;
  onSelect: (id: number) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (separacoes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">
          Nenhuma separação encontrada
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {separacoes.map((sep) => {
        const total = sep.totalItens ?? sep.itens?.length ?? 0;
        const retirados =
          sep.itens?.filter((i) => i.status === 'CONFERIDO').length ?? 0;
        const progresso = total > 0 ? (retirados / total) * 100 : 0;

        return (
          <Card
            key={sep.id}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => onSelect(sep.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{sep.codigo}</CardTitle>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    STATUS_COLORS[sep.statusNovo ?? sep.status] ??
                      'bg-muted text-muted-foreground',
                  )}
                >
                  {STATUS_LABELS[sep.statusNovo ?? sep.status] ??
                    sep.statusNovo ??
                    sep.status}
                </span>
              </div>
              <CardDescription>
                {sep.os?.codigo ?? `OS #${sep.osId}`} •{' '}
                {sep.equipe?.nome ?? 'Sem equipe'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  {retirados}/{total} itens retirados
                </span>
                <span>•</span>
                <span>
                  {sep.dataNecessidade
                    ? formatarData(sep.dataNecessidade)
                    : 'Sem data'}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progresso}%` }}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function DetalheView({
  separacao,
  tab,
  onTabChange,
  onVoltar,
  onRetirar,
  onDevolver,
  onExcluir,
  processando,
}: {
  separacao: SeparacaoItem;
  tab: TabItem;
  onTabChange: (t: TabItem) => void;
  onVoltar: () => void;
  onRetirar: (itemId: number) => void;
  onDevolver: (itemId: number) => void;
  onExcluir: (id: number) => void;
  processando: boolean;
}) {
  const itens = separacao.itens ?? [];
  const tabItems = getTabItems(itens, tab);
  const status = separacao.statusNovo ?? separacao.status;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onVoltar}>
          ← Voltar
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{separacao.codigo}</h2>
          <p className="text-sm text-muted-foreground">
            {separacao.os?.codigo ?? `OS #${separacao.osId}`} •{' '}
            {separacao.equipe?.nome ?? 'Sem equipe'}
          </p>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
            STATUS_COLORS[status] ?? 'bg-muted text-muted-foreground',
          )}
        >
          {STATUS_LABELS[status] ?? status}
        </span>
      </div>

      {/* Acoes globais */}
      <div className="flex gap-2">
        {status === 'SEPARACAO_PENDENTE' && (
          <Button
            size="sm"
            onClick={async () => {
              await confirmarSeparacao(separacao.id);
              onVoltar();
            }}
          >
            Confirmar Separação
          </Button>
        )}
        {status === 'SEPARACAO_CONCLUIDA' && (
          <Button
            size="sm"
            onClick={async () => {
              await notificarEquipeSeparacao(separacao.id);
              onVoltar();
            }}
          >
            Notificar Equipe
          </Button>
        )}
        {status === 'SEPARACAO_PENDENTE' && (
          <Button
            size="sm"
            variant="destructive"
            disabled={processando}
            onClick={() => onExcluir(separacao.id)}
          >
            Excluir
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['equipamentos', 'epis', 'materiais'] as TabItem[]).map((t) => {
          const count = getTabItems(itens, t).length;
          return (
            <button
              key={t}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                tab === t
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
              onClick={() => onTabChange(t)}
            >
              {t === 'equipamentos'
                ? 'Equipamentos'
                : t === 'epis'
                  ? 'EPIs'
                  : 'Materiais'}{' '}
              ({count})
            </button>
          );
        })}
      </div>

      {/* Lista de itens */}
      <div className="grid gap-2">
        {tabItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum item nesta categoria
          </div>
        ) : (
          tabItems.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              tab={tab}
              onRetirar={() => onRetirar(item.id)}
              onDevolver={() => onDevolver(item.id)}
              processando={processando}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ItemRow({
  item,
  tab,
  onRetirar,
  onDevolver,
  processando,
}: {
  item: SeparacaoItemDetalhe;
  tab: TabItem;
  onRetirar: () => void;
  onDevolver: () => void;
  processando: boolean;
}) {
  const nome =
    tab === 'equipamentos'
      ? item.equipamento?.descricao ?? `Equipamento #${item.equipamentoId}`
      : tab === 'epis'
        ? item.epi?.nome ?? `EPI #${item.epiId}`
        : item.material?.nome ?? `Material #${item.materialId}`;

  const qtd = Number(item.quantidadeNecessaria);

  return (
    <div className="flex items-center gap-4 rounded-lg border p-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{nome}</div>
        <div className="text-xs text-muted-foreground">
          Qtd: {qtd}
          {item.retiradoEm && (
            <> • Retirado: {formatarData(item.retiradoEm)}</>
          )}
        </div>
      </div>

      <ItemStatusBadge status={item.status} />

      <div className="flex gap-1.5">
        {item.status === 'PENDENTE' && (
          <Button
            size="sm"
            variant="outline"
            disabled={processando}
            onClick={onRetirar}
          >
            Retirar
          </Button>
        )}
        {item.status === 'CONFERIDO' && tab !== 'epis' && (
          <Button
            size="sm"
            variant="outline"
            disabled={processando}
            onClick={onDevolver}
          >
            Devolver
          </Button>
        )}
      </div>
    </div>
  );
}
