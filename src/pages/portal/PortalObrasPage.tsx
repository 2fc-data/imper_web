import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type {
  AtividadePortal,
  ObraPortalItem,
} from '../../lib/api';
import { listarObrasPortal } from '../../lib/api';
import { brl, formatarEnderecoObra } from '../../lib/format';

export function statusAtividadePortal(
  atividade: AtividadePortal,
): 'CANCELADA' | 'CONCLUIDA' | 'EM_ANDAMENTO' | 'PENDENTE' {
  if (atividade.cancelada) return 'CANCELADA';
  if (atividade.execucoes.some((e) => e.status === 'CONCLUIDA'))
    return 'CONCLUIDA';
  if (atividade.execucoes.some((e) => e.status === 'EM_ANDAMENTO'))
    return 'EM_ANDAMENTO';
  return 'PENDENTE';
}

export function progressoObra(obra: ObraPortalItem): {
  concluidas: number;
  total: number;
  percentual: number;
} {
  const atividades = obra.etapas.flatMap((e) => e.atividades);
  const total = atividades.length;
  const concluidas = atividades.filter(
    (a) => statusAtividadePortal(a) === 'CONCLUIDA',
  ).length;
  return {
    concluidas,
    total,
    percentual: total > 0 ? (concluidas / total) * 100 : 0,
  };
}

export default function PortalObrasPage() {
  const [obras, setObras] = useState<ObraPortalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listarObrasPortal()
      .then((dados) => {
        if (active) setObras(dados);
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
        <h1 className="text-2xl font-semibold">Obras</h1>
        <p className="text-sm text-muted-foreground">
          Etapas e atividades da execução.
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
                  Carregando obras...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Erro ao carregar obras.
                </td>
              </tr>
            ) : obras.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Nenhuma obra encontrada.
                </td>
              </tr>
            ) : (
              obras.map((item) => {
                const { concluidas, total, percentual } = progressoObra(item);
                return (
                  <tr
                    key={item.id}
                    className="cursor-pointer transition-colors hover:bg-primary/10"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/portal/obras/${item.id}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {item.codigo}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {brl(item.valorContratado)}
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
                      {formatarEnderecoObra(item.endereco)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${percentual}%` }}
                          />
                        </div>
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          {concluidas}/{total} atividades
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
