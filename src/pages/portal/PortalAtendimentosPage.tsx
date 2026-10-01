import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { AtendimentoItem } from '../../lib/api';
import { listarAtendimentosPortal } from '../../lib/api';
import { ROTULOS_STATUS } from '../../lib/atendimento-status';

const CLASSES_URGENCIA: Record<string, string> = {
  URGENTISSIMO: 'bg-destructive/15 text-destructive',
  URGENTE: 'bg-warning/15 text-warning',
};

export default function PortalAtendimentosPage() {
  const navigate = useNavigate();
  const [atendimentos, setAtendimentos] = useState<AtendimentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listarAtendimentosPortal()
      .then((dados) => {
        if (active) setAtendimentos(dados);
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
        <h1 className="text-2xl font-semibold">Atendimentos</h1>
        <p className="text-sm text-muted-foreground">
          Histórico e andamento dos seus atendimentos.
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
              <th className="px-4 py-3">Atendimento</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Urgência</th>
              <th className="px-4 py-3">Criado em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Carregando atendimentos...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Erro ao carregar atendimentos.
                </td>
              </tr>
            ) : atendimentos.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Nenhum atendimento encontrado.
                </td>
              </tr>
            ) : (
              atendimentos.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => navigate(`/portal/atendimentos/${item.id}`)}
                  className="cursor-pointer transition-colors hover:bg-primary/10"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/portal/atendimentos/${item.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      #{item.id}
                    </Link>
                    {item.user?.nome && (
                      <div className="text-xs text-muted-foreground">
                        {item.user.nome}
                      </div>
                    )}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                    {item.descricao ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={item.status}
                      labelOverride={
                        ROTULOS_STATUS[
                          item.status as keyof typeof ROTULOS_STATUS
                      ] ?? item.status
                      }
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        CLASSES_URGENCIA[item.urgencia ?? ''] ??
                        'bg-muted text-muted-foreground'
                      }`}
                    >
                      {item.urgencia ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString('pt-BR')}
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
