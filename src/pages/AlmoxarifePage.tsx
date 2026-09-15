/**
 * @deprecated Substituído por RetiradaDeItensPage. Mantido para backward compatibility.
 */
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
  confirmarSeparacao,
  detalharSeparacao,
  listarSeparacoes,
  notificarEquipeSeparacao,
  registrarDevolucaoSeparacao,
  registrarRetiradaSeparacao,
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

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: 'bg-muted text-muted-foreground',
  SEPARACAO: 'bg-amber-500/10 text-amber-600',
  NOTIFICADA: 'bg-blue-500/10 text-blue-600',
  RETIRADA: 'bg-emerald-500/10 text-emerald-600',
  CONCLUIDA: 'bg-emerald-600/10 text-emerald-700',
  CANCELADA: 'bg-destructive/10 text-destructive',
};

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  SEPARACAO: 'Separação',
  NOTIFICADA: 'Notificada',
  RETIRADA: 'Retirada',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export function AlmoxarifePage({ viewAtiva, onNavegar: _onNavegar }: Props) {
  const [separacoes, setSeparacoes] = useState<SeparacaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [detalheId, setDetalheId] = useState<number | null>(null);
  const [detalhe, setDetalhe] = useState<SeparacaoItem | null>(null);

  function carregar() {
    setLoading(true);
    listarSeparacoes({ status: filtroStatus || undefined })
      .then(setSeparacoes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(carregar, [filtroStatus]);

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
        <h2 className="text-lg font-semibold">Almoxarife — Separações</h2>
        <div className="flex flex-wrap gap-2">
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
          Nenhuma separação encontrada.
        </p>
      ) : (
        <div className="space-y-3">
          {separacoes.map((sep) => (
            <SeparacaoCard
              key={sep.id}
              separacao={sep}
              onVerDetalhe={() => setDetalheId(sep.id)}
              onAtualizar={carregar}
            />
          ))}
        </div>
      )}

      {detalhe && (
        <DetalheModal
          detalhe={detalhe}
          onClose={() => setDetalheId(null)}
          onAtualizar={carregar}
        />
      )}
    </div>
  );
}

function SeparacaoCard({
  separacao,
  onVerDetalhe,
  onAtualizar,
}: {
  separacao: SeparacaoItem;
  onVerDetalhe: () => void;
  onAtualizar: () => void;
}) {
  async function handleConfirmar() {
    await confirmarSeparacao(separacao.id);
    onAtualizar();
  }

  async function handleNotificar() {
    await notificarEquipeSeparacao(separacao.id);
    onAtualizar();
  }

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">
              Separação #{separacao.id}
            </CardTitle>
            <CardDescription>
              OS {separacao.os?.numero ?? '#'} —{' '}
              {separacao.equipe?.nome ?? 'Sem equipe'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                STATUS_COLORS[separacao.status] ??
                  'bg-muted text-muted-foreground',
              )}
            >
              {STATUS_LABELS[separacao.status] ?? separacao.status}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {separacao.status === 'PENDENTE' && (
            <Button size="sm" variant="outline" onClick={handleConfirmar}>
              Confirmar Separação
            </Button>
          )}
          {separacao.status === 'SEPARACAO' && (
            <Button size="sm" variant="outline" onClick={handleNotificar}>
              Notificar Equipe
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onVerDetalhe}>
            Ver Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DetalheModal({
  detalhe,
  onClose,
  onAtualizar,
}: {
  detalhe: SeparacaoItem;
  onClose: () => void;
  onAtualizar: () => void;
}) {
  async function handleRetirar(_itemId: number) {
    await registrarRetiradaSeparacao(detalhe.id);
    onAtualizar();
  }

  async function handleDevolver(_itemId: number) {
    await registrarDevolucaoSeparacao(detalhe.id);
    onAtualizar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="max-h-[80vh] w-full max-w-lg overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Detalhes — Separação #{detalhe.id}</CardTitle>
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
            <h4 className="mb-2 text-sm font-medium">Itens</h4>
            {!detalhe.itens || detalhe.itens.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum item nesta separação.
              </p>
            ) : (
              <div className="space-y-2">
                {detalhe.itens.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded border p-2"
                  >
                    <div className="text-sm">
                      <span className="font-medium">{item.descricaoItem}</span>
                      {item.localEstoque && (
                        <span className="ml-2 text-muted-foreground">
                          ({item.localEstoque})
                        </span>
                      )}
                      <span className="ml-2 text-muted-foreground">
                        × {item.quantidade}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {!item.retiradoEm && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetirar(item.id)}
                        >
                          Retirar
                        </Button>
                      )}
                      {item.retiradoEm && !item.devolvidoEm && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDevolver(item.id)}
                        >
                          Devolver
                        </Button>
                      )}
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
  const porStatus = separacoes.reduce(
    (acc, s) => {
      const label = STATUS_LABELS[s.status] ?? s.status;
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const pendentes = separacoes.filter((s) => s.status === 'PENDENTE').length;
  const emAndamento = separacoes.filter((s) =>
    ['SEPARACAO', 'NOTIFICADA', 'RETIRADA'].includes(s.status),
  ).length;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Análises — Almoxarife</h2>
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
            <CardDescription>Em Andamento</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-blue-600">
              {emAndamento}
            </span>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(porStatus).map(([nome, qtd]) => (
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

export default AlmoxarifePage;
