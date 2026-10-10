import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  listarExecucoes,
  listarSeparacoes,
  type ExecucaoAtividadeItem,
  type SeparacaoItem,
} from '../lib/api';
import { cn } from '../lib/utils';

interface Props {
  viewAtiva: 'dashboard' | string;
}

const STATUS_EXECUCAO_COLORS: Record<string, string> = {
  PENDENTE: 'bg-muted text-muted-foreground',
  EM_ANDAMENTO: 'bg-primary/10 text-primary',
  CONCLUIDA: 'bg-success/10 text-success',
  CANCELADA: 'bg-destructive/10 text-destructive',
};

const STATUS_EXECUCAO_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export function ExecucaoDashboardPage({ viewAtiva: _viewAtiva }: Props) {
  const [execucoes, setExecucoes] = useState<ExecucaoAtividadeItem[]>([]);
  const [separacoes, setSeparacoes] = useState<SeparacaoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      listarExecucoes().catch(() => []),
      listarSeparacoes({ status: 'PENDENTE' }).catch(() => []),
    ])
      .then(([exe, sep]) => {
        setExecucoes(exe);
        setSeparacoes(sep);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  const emAndamento = execucoes.filter(
    (e) => e.status === 'EM_ANDAMENTO',
  ).length;
  const pendentes = execucoes.filter((e) => e.status === 'PENDENTE').length;
  const concluidas = execucoes.filter((e) => e.status === 'CONCLUIDA').length;
  const canceladas = execucoes.filter((e) => e.status === 'CANCELADA').length;

  const separacoesPendentes = separacoes.length;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Dashboard de Execução</h2>

      {/* Cards de resumo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <CardDescription>Canceladas</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-destructive">
              {canceladas}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Execuções em andamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Execuções em Andamento</CardTitle>
        </CardHeader>
        <CardContent>
          {execucoes.filter((e) => e.status === 'EM_ANDAMENTO').length ===
          0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma execução em andamento.
            </p>
          ) : (
            <div className="space-y-2">
              {execucoes
                .filter((e) => e.status === 'EM_ANDAMENTO')
                .map((exe) => (
                  <div
                    key={exe.id}
                    className="flex items-center justify-between rounded border p-2"
                  >
                    <div className="text-sm">
                      <span className="font-medium">
                        {exe.atividade?.descricao ?? `Atividade #${exe.atividadeId}`}
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        {exe.atividade?.obraEtapa?.nome}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        STATUS_EXECUCAO_COLORS[exe.status],
                      )}
                    >
                      {STATUS_EXECUCAO_LABELS[exe.status]}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Separações pendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Separações Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          {separacoesPendentes === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma separação pendente.
            </p>
          ) : (
            <div className="space-y-2">
              {separacoes.slice(0, 10).map((sep) => (
                <div
                  key={sep.id}
                  className="flex items-center justify-between rounded border p-2"
                >
                  <div className="text-sm">
                    <span className="font-medium">
                      Obra {sep.obraId ?? '#'}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {sep.totalItens ?? 0} itens
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecucaoDashboardPage;
