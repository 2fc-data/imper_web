import { useEffect, useState } from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { AgendamentoItem, StatusAgendamento } from '../../lib/api';
import { listarAgendamentosPortal } from '../../lib/api';

const rotulosTipo: Record<string, string> = {
  VISITA: 'Visita',
  ORCAMENTO: 'Orçamento',
  RETORNO: 'Retorno',
  REUNIAO: 'Reunião',
};

const rotulosStatus: Record<StatusAgendamento, string> = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  REALIZADO: 'Realizado',
  CANCELADO: 'Cancelado',
  NAO_COMPARECEU: 'Não compareceu',
};

function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR');
}

function resumoEndereco(item: AgendamentoItem): string {
  const e = item.endereco;
  if (!e) return '—';
  const partes = [
    [e.logradouro, e.numero].filter(Boolean).join(', '),
    e.bairro,
    e.cidade,
  ].filter(Boolean);
  return partes.join(' — ') || '—';
}

export default function PortalAgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<AgendamentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listarAgendamentosPortal()
      .then((dados) => {
        if (active) setAgendamentos(dados);
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
        <h1 className="text-2xl font-semibold">Agendamentos</h1>
        <p className="text-sm text-muted-foreground">
          Visitas, orçamentos e reuniões agendadas.
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
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Data prevista</th>
              <th className="px-4 py-3">Endereço</th>
              <th className="px-4 py-3">Atendimento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Carregando agendamentos...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Erro ao carregar agendamentos.
                </td>
              </tr>
            ) : agendamentos.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Nenhum agendamento encontrado.
                </td>
              </tr>
            ) : (
              agendamentos.map((item) => (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-primary/10"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground">
                      {rotulosTipo[item.tipo] ?? item.tipo}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      #{item.id}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={item.status}
                      labelOverride={
                        rotulosStatus[item.status] ?? item.status
                      }
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatarData(item.dataPrevista)}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                    {resumoEndereco(item)}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                    {item.atendimento
                      ? `#${item.atendimento.id} — ${item.atendimento.descricao ?? '—'}`
                      : '—'}
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
