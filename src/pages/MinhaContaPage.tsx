import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import type { MinhaConta, MinhaOS } from '../lib/api';
import { api } from '../lib/api';

function formatarValor(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return '–';
  const num = Number(valor);
  if (Number.isNaN(num)) return '–';
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatarData(data: string | null | undefined): string {
  if (!data) return '–';
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return '–';
  return d.toLocaleDateString('pt-BR');
}

const STATUS_LABEL: Record<string, string> = {
  AGUARDANDO_APROVACAO: 'Aguardando aprovação',
  AGENDADO: 'Agendado',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
  CONFIRMADO: 'Confirmado',
  EM_SEPARACAO: 'Em separação',
  SEPARADO: 'Separado',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

const URGENCIA_LABEL: Record<string, string> = {
  NORMAL: 'Normal',
  URGENTE: 'Urgente',
  URGENTISSIMO: 'Urgentíssimo',
};

export default function MinhaContaPage() {
  const { user } = useAuth();
  const [conta, setConta] = useState<MinhaConta | null>(null);
  const [os, setOs] = useState<MinhaOS[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<MinhaConta>('/cliente/me'),
      api.get<MinhaOS[]>('/cliente/os'),
    ])
      .then(([me, minhasOs]) => {
        if (!active) return;
        setConta(me);
        setOs(minhasOs);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Erro ao carregar');
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
        <h1 className="text-2xl font-semibold tracking-tight">
          Olá, {user?.nome}
        </h1>
        <p className="text-sm text-muted-foreground">Portal do cliente</p>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Meus dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 px-4 pb-4 text-sm">
          <p>
            <span className="text-muted-foreground">Nome: </span>
            {conta?.cliente?.nome ?? conta?.nome ?? '–'}
          </p>
          {conta?.cliente?.cpfCnpj && (
            <p>
              <span className="text-muted-foreground">CPF/CNPJ: </span>
              {conta.cliente.cpfCnpj}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">E-mail: </span>
            {conta?.email ?? '–'}
          </p>
          <p>
            <span className="text-muted-foreground">Telefone: </span>
            {conta?.cliente?.telefone ?? conta?.telefone ?? '–'}
          </p>
          {conta?.cliente?.endereco && (
            <p>
              <span className="text-muted-foreground">Endereço: </span>
              {conta.cliente.endereco}
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 text-base font-semibold">
          Minhas ordens de serviço
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : os.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma ordem de serviço no momento.
          </p>
        ) : (
          <div className="space-y-3">
            {os.map((ordem) => (
              <Card key={ordem.id}>
                <CardContent className="space-y-1 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {ordem.codigo ?? `OS #${ordem.id}`}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {STATUS_LABEL[ordem.status] ?? ordem.status}
                    </span>
                  </div>
                  {ordem.endereco && (
                    <p className="text-sm text-muted-foreground">
                      {ordem.endereco}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {URGENCIA_LABEL[ordem.urgencia] ?? ordem.urgencia} ·{' '}
                      {formatarData(ordem.dataInicioPrevista)}
                    </span>
                    <span className="font-medium">
                      {formatarValor(ordem.valorTotal)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
