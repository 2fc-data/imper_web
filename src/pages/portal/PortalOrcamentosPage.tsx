import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { OrcamentoAdminDetalhe } from '../../lib/api';
import { listarOrcamentosPortal } from '../../lib/api';

function formatarMoeda(valor: string | number): string {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export default function PortalOrcamentosPage() {
  const [orcamentos, setOrcamentos] = useState<OrcamentoAdminDetalhe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listarOrcamentosPortal()
      .then((dados) => {
        if (active) setOrcamentos(dados);
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
        <h1 className="text-2xl font-semibold">Orçamentos</h1>
        <p className="text-sm text-muted-foreground">
          Propostas e orçamentos enviados para você.
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
              <th className="px-4 py-3">Valor total</th>
              <th className="px-4 py-3">Validade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Carregando orçamentos...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Erro ao carregar orçamentos.
                </td>
              </tr>
            ) : orcamentos.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Nenhum orçamento encontrado.
                </td>
              </tr>
            ) : (
              orcamentos.map((item) => (
                <tr
                  key={item.id}
                  className="cursor-pointer transition-colors hover:bg-primary/10"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/portal/orcamentos/${item.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {item.codigo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatarMoeda(item.valorTotal)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatarData(item.validade)}
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
