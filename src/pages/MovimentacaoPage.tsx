import { useEffect, useState } from 'react';
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
  detalharSeparacao,
  listarSeparacoes,
  type SeparacaoItem,
} from '../lib/api';
import { formatarData } from '../lib/datetime';
import { cn } from '../lib/utils';

const selectClasses =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

type ViewAtiva = 'analises' | 'lista';

interface Props {
  viewAtiva: ViewAtiva;
  onNavegar: (view: ViewAtiva) => void;
}

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  SEPARACAO: 'Separação',
  NOTIFICADA: 'Notificada',
  RETIRADA: 'Retirada',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export function MovimentacaoPage({ viewAtiva, onNavegar: _onNavegar }: Props) {
  const [separacoes, setSeparacoes] = useState<SeparacaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [detalheId, setDetalheId] = useState<number | null>(null);
  const [detalhe, setDetalhe] = useState<SeparacaoItem | null>(null);

  function carregar() {
    setLoading(true);
    listarSeparacoes({
      q: busca || undefined,
      status: filtroStatus || undefined,
    })
      .then(setSeparacoes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(carregar, [busca, filtroStatus]);

  useEffect(() => {
    if (detalheId === null) {
      setDetalhe(null);
      return;
    }
    detalharSeparacao(detalheId).then(setDetalhe).catch(console.error);
  }, [detalheId]);

  if (viewAtiva === 'analises') {
    return <AnalisesView separacoes={separacoes} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Movimentações — Itens</h2>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Buscar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-9 w-48"
          />
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className={cn(selectClasses, 'h-9 w-40')}
          >
            <option value="">Todos Status</option>
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : separacoes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma movimentação encontrada.
        </p>
      ) : (
        <div className="space-y-3">
          {separacoes.map((sep) => (
            <MovimentacaoCard
              key={sep.id}
              separacao={sep}
              onVerDetalhe={() => setDetalheId(sep.id)}
            />
          ))}
        </div>
      )}

      {detalhe && (
        <DetalheModal detalhe={detalhe} onClose={() => setDetalheId(null)} />
      )}
    </div>
  );
}

function MovimentacaoCard({
  separacao,
  onVerDetalhe,
}: {
  separacao: SeparacaoItem;
  onVerDetalhe: () => void;
}) {
  const totalItens = separacao.totalItens ?? 0;
  const totalRetirados =
    separacao.itens?.filter((i) => i.retiradoEm).length ?? 0;
  const progresso =
    totalItens > 0 ? Math.round((totalRetirados / totalItens) * 100) : 0;

  return (
    <Card className="cursor-pointer" onClick={onVerDetalhe}>
      <CardHeader className="py-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">
              OS {separacao.os?.numero ?? '#'} —{' '}
              {separacao.equipe?.nome ?? 'Sem equipe'}
            </CardTitle>
            <CardDescription>
              {separacao.dataNecessidade
                ? `Necessário em: ${formatarData(separacao.dataNecessidade)}`
                : 'Data não definida'}
            </CardDescription>
          </div>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              separacao.status === 'CONCLUIDA'
                ? 'bg-emerald-500/10 text-emerald-600'
                : separacao.status === 'PENDENTE'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-amber-500/10 text-amber-600',
            )}
          >
            {STATUS_LABELS[separacao.status] ?? separacao.status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {totalRetirados}/{totalItens}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function DetalheModal({
  detalhe,
  onClose,
}: {
  detalhe: SeparacaoItem;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="max-h-[80vh] w-full max-w-lg overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Movimentação #{detalhe.id}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 text-sm">
            <div>
              <span className="font-medium">OS:</span>{' '}
              {detalhe.os?.numero ?? '#'}
            </div>
            <div>
              <span className="font-medium">Equipe:</span>{' '}
              {detalhe.equipe?.nome ?? '—'}
            </div>
            <div>
              <span className="font-medium">Data Necessidade:</span>{' '}
              {detalhe.dataNecessidade
                ? formatarData(detalhe.dataNecessidade)
                : '—'}
            </div>
            <div>
              <span className="font-medium">Status:</span>{' '}
              {STATUS_LABELS[detalhe.status] ?? detalhe.status}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">Itens Movimentados</h4>
            {!detalhe.itens || detalhe.itens.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum item nesta separação.
              </p>
            ) : (
              <div className="space-y-2">
                {detalhe.itens.map((item) => (
                  <div key={item.id} className="rounded border p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {item.descricaoItem}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        × {item.quantidade}
                      </span>
                    </div>
                    {item.localEstoque && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Local: {item.localEstoque}
                      </div>
                    )}
                    <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                      {item.retiradoEm && (
                        <span>Retirado: {formatarData(item.retiradoEm)}</span>
                      )}
                      {item.devolvidoEm && (
                        <span>Devolvido: {formatarData(item.devolvidoEm)}</span>
                      )}
                      {!item.retiradoEm && <span>Pendente retirada</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalisesView({ separacoes }: { separacoes: SeparacaoItem[] }) {
  const total = separacoes.length;
  const concluidas = separacoes.filter((s) => s.status === 'CONCLUIDA').length;
  const pendentes = separacoes.filter((s) => s.status === 'PENDENTE').length;

  const itensTotal = separacoes.reduce(
    (acc, s) => acc + (s.totalItens ?? 0),
    0,
  );
  const itensRetirados = separacoes.reduce(
    (acc, s) => acc + (s.itens?.filter((i) => i.retiradoEm).length ?? 0),
    0,
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Análises — Movimentações</h2>
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Movimentações</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{total}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Concluídas</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-emerald-600">
              {concluidas}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pendentes</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-amber-600">
              {pendentes}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Itens Retirados</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {itensRetirados}/{itensTotal}
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default MovimentacaoPage;
