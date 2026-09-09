import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  type AtividadeOSItem,
  type ChecklistItem,
  listarAtividadesOS,
  listarChecklistPendentesEquipe,
  listarSeparacoes,
  type SeparacaoItem,
} from '../lib/api';
import { cn } from '../lib/utils';

interface Props {
  viewAtiva: 'dashboard' | string;
}

const STATUS_ATIVIDADE_COLORS: Record<string, string> = {
  PENDENTE: 'bg-muted text-muted-foreground',
  EM_ANDAMENTO: 'bg-blue-500/10 text-blue-600',
  CONCLUIDA: 'bg-emerald-500/10 text-emerald-600',
  BLOQUEADA: 'bg-red-500/10 text-red-600',
};

const STATUS_ATIVIDADE_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDA: 'Concluída',
  BLOQUEADA: 'Bloqueada',
};

const STATUS_CHECKLIST_COLORS: Record<string, string> = {
  PENDENTE: 'bg-muted text-muted-foreground',
  CONCLUIDO: 'bg-emerald-500/10 text-emerald-600',
  BLOQUEADO: 'bg-red-500/10 text-red-600',
};

export function ExecucaoDashboardPage({ viewAtiva: _viewAtiva }: Props) {
  const [atividades, setAtividades] = useState<AtividadeOSItem[]>([]);
  const [checklistsPendentes, setChecklistsPendentes] = useState<
    ChecklistItem[]
  >([]);
  const [separacoes, setSeparacoes] = useState<SeparacaoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      listarAtividadesOS().catch(() => []),
      listarChecklistPendentesEquipe().catch(() => []),
      listarSeparacoes({ status: 'PENDENTE' }).catch(() => []),
    ])
      .then(([atv, check, sep]) => {
        setAtividades(atv);
        setChecklistsPendentes(check);
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

  const emAndamento = atividades.filter(
    (a) => a.status === 'EM_ANDAMENTO',
  ).length;
  const pendentes = atividades.filter((a) => a.status === 'PENDENTE').length;
  const concluidas = atividades.filter((a) => a.status === 'CONCLUIDA').length;
  const bloqueadas = atividades.filter((a) => a.status === 'BLOQUEADA').length;

  const checklistPendentes = checklistsPendentes.length;
  const separacoesPendentes = separacoes.length;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Dashboard de Execução</h2>

      {/* Cards de resumo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
            <CardDescription>Bloqueadas</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-red-600">
              {bloqueadas}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Checklists Pendentes</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{checklistPendentes}</span>
          </CardContent>
        </Card>
      </div>

      {/* Atividades em andamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Atividades em Andamento</CardTitle>
        </CardHeader>
        <CardContent>
          {atividades.filter((a) => a.status === 'EM_ANDAMENTO').length ===
          0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma atividade em andamento.
            </p>
          ) : (
            <div className="space-y-2">
              {atividades
                .filter((a) => a.status === 'EM_ANDAMENTO')
                .map((atv) => (
                  <div
                    key={atv.id}
                    className="flex items-center justify-between rounded border p-2"
                  >
                    <div className="text-sm">
                      <span className="font-medium">
                        {atv.catalogo?.nome ?? `Atividade #${atv.catalogoId}`}
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        OS #{atv.osId}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        STATUS_ATIVIDADE_COLORS[atv.status],
                      )}
                    >
                      {STATUS_ATIVIDADE_LABELS[atv.status]}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklists pendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Checklists Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          {checklistsPendentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum checklist pendente.
            </p>
          ) : (
            <div className="space-y-2">
              {checklistsPendentes.slice(0, 10).map((ck) => (
                <div
                  key={ck.id}
                  className="flex items-center justify-between rounded border p-2"
                >
                  <div className="text-sm">
                    <span className="font-medium">{ck.descricao}</span>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      STATUS_CHECKLIST_COLORS[ck.status] ??
                        'bg-muted text-muted-foreground',
                    )}
                  >
                    {ck.status}
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
                      OS {sep.os?.numero ?? '#'}
                    </span>
                    <span className="ml-2 text-muted-foreground">
                      — {sep.equipe?.nome ?? 'Sem equipe'}
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
