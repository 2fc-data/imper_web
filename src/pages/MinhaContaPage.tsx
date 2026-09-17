import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import type { MinhaConta } from '../lib/api';
import { api } from '../lib/api';

export default function MinhaContaPage() {
  const { user } = useAuth();
  const [conta, setConta] = useState<MinhaConta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get<MinhaConta>('/auth/me')
      .then((me) => {
        if (!active) return;
        setConta(me);
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
            {loading ? 'Carregando...' : conta?.nome ?? '–'}
          </p>
          {conta?.cpfCnpj && (
            <p>
              <span className="text-muted-foreground">CPF/CNPJ: </span>
              {conta.cpfCnpj}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">E-mail: </span>
            {conta?.email ?? '–'}
          </p>
          <p>
            <span className="text-muted-foreground">Telefone: </span>
            {conta?.telefone ?? '–'}
          </p>
          {conta?.endereco && (
            <p>
              <span className="text-muted-foreground">Endereço: </span>
              {conta.endereco.logradouro}
              {conta.endereco.numero ? `, ${conta.endereco.numero}` : ''}
              {conta.endereco.bairro ? ` - ${conta.endereco.bairro}` : ''}
              {conta.endereco.cidade ? ` - ${conta.endereco.cidade}` : ''}
              {conta.endereco.estado ? `/${conta.endereco.estado}` : ''}
              {conta.endereco.cep ? ` - CEP: ${conta.endereco.cep}` : ''}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
