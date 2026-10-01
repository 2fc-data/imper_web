import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { OsPortalItem } from '../../lib/api';
import { listarOsPortal } from '../../lib/api';

function formatarMoeda(valor: string | number): string {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function PortalOsPage() {
  const [ordens, setOrdens] = useState<OsPortalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listarOsPortal()
      .then((dados) => {
        if (active) setOrdens(dados);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Ordens de serviço</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe a execução dos seus serviços.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Urgência</th>
              <th className="px-4 py-3">Endereço</th>
              <th className="px-4 py-3">Progresso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Carregando ordens de serviço...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Erro ao carregar ordens de serviço.
                </td>
              </tr>
            ) : ordens.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Nenhuma ordem de serviço encontrada.
                </td>
              </tr>
            ) : (
              ordens.map((item) => (
                <tr
                  key={item.id}
                  className="cursor-pointer transition-colors hover:bg-primary/10"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/portal/os/${item.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {item.codigo}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {formatarMoeda(item.valorTotal)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.urgencia === 'URGENTISSIMO'
                          ? 'bg-destructive/15 text-destructive'
                          : item.urgencia === 'URGENTE'
                            ? 'bg-warning/15 text-warning'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {item.urgencia || '—'}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                    {item.endereco ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${item.progresso}%` }}
                        />
                      </div>
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {item.etapasConcluidas}/{item.totalEtapas}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
