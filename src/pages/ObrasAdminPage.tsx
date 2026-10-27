import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { selectClasses } from '../components/ui/form-classes';
import { Input } from '../components/ui/input';
import { PageHeader } from '../components/ui/page-header';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/states';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Table, TableWrapper, Th } from '../components/ui/table';

const STATUS_OBRA = [
  { valor: 'EM_PREPARACAO', rotulo: 'Em Preparação' },
  { valor: 'EM_EXECUCAO', rotulo: 'Em Execução' },
  { valor: 'CONCLUIDA', rotulo: 'Concluída' },
  { valor: 'CANCELADA', rotulo: 'Cancelada' },
] as const;

function moeda(valor: unknown) {
  return Number(valor ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function ObrasAdminPage() {
  const [obras, setObras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buscaInput, setBuscaInput] = useState('');
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (busca) params.append('busca', busca);
    if (statusFiltro) params.append('status', statusFiltro);

    api
      .get<any>(`/obras?${params.toString()}`)
      .then((res) => {
        if (!cancelado) setObras(res.data.obras || []);
      })
      .catch((err: any) => {
        if (!cancelado) {
          setError(err.response?.data?.message || 'Erro ao carregar obras');
          setObras([]);
        }
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [busca, statusFiltro, tentativa]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setBusca(buscaInput.trim());
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Obras"
        description="Acompanhe o andamento, os valores contratados e as etapas de cada obra."
      />

      <Card>
        <CardContent className="pt-5">
          <form
            onSubmit={handleSearch}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="min-w-0 flex-1 basis-64 space-y-1.5">
              <label
                htmlFor="busca-obras"
                className="text-xs font-medium text-muted-foreground"
              >
                Buscar
              </label>
              <Input
                id="busca-obras"
                type="search"
                placeholder="Código, cliente ou observações…"
                value={buscaInput}
                onChange={(event) => setBuscaInput(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="status-obras"
                className="text-xs font-medium text-muted-foreground"
              >
                Status
              </label>
              <select
                id="status-obras"
                value={statusFiltro}
                onChange={(event) => setStatusFiltro(event.target.value)}
                className={`${selectClasses} sm:w-52`}
              >
                <option value="">Todos os status</option>
                {STATUS_OBRA.map((status) => (
                  <option key={status.valor} value={status.valor}>
                    {status.rotulo}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit">Filtrar</Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingState label="Carregando obras…" rows={4} />
      ) : error ? (
        <ErrorState
          description={error}
          onRetry={() => setTentativa((valor) => valor + 1)}
        />
      ) : obras.length === 0 ? (
        <EmptyState
          title="Nenhuma obra encontrada"
          description="Ajuste os filtros ou cadastre uma nova obra para começar o acompanhamento."
        />
      ) : (
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th>Código</Th>
                <Th>Cliente</Th>
                <Th>Status</Th>
                <Th className="text-right">Valor contratado</Th>
                <Th className="text-center">Etapas</Th>
                <Th className="text-center">Aditivos</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {obras.map((obra) => (
                <tr
                  key={obra.id}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                >
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-foreground">
                    {obra.codigo}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {obra.user?.nome || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={obra.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums">
                    {moeda(obra.valorContratado)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm tabular-nums text-muted-foreground">
                    {obra._count?.etapas ?? 0}
                  </td>
                  <td className="px-4 py-3 text-center text-sm tabular-nums text-muted-foreground">
                    {obra._count?.aditivos ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/obras/${obra.id}`}
                      className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-primary underline-offset-4 transition-elegant hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      Ver detalhes
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
      )}
    </div>
  );
}
