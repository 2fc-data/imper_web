import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  type ClienteAdmin,
  criarClienteAdmin,
  buscarClientesAdmin,
} from '../lib/api';
import { cn } from '../lib/utils';

const campoLabel = 'block text-sm font-medium text-foreground';
const campoInput =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50';

export function ClientesPage() {
  const navigate = useNavigate();
  const [lista, setLista] = useState<ClienteAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const dados = await buscarClientesAdmin('');
      setLista(dados);
    } catch {
      // silently fail
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleCriar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      await criarClienteAdmin({
        nome: nome.trim(),
        cpfCnpj: cpfCnpj.trim() || undefined,
        telefone: telefone.trim() || undefined,
        email: email.trim() || undefined,
      });
      navigate('/atendimentos');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Erro ao cadastrar cliente';
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Cadastro e gerenciamento de clientes.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo Cliente</CardTitle>
          <CardDescription>
            Preencha os dados abaixo para cadastrar um novo cliente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCriar} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className={campoLabel}>Nome *</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={campoInput}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-1.5">
                <label className={campoLabel}>CPF/CNPJ</label>
                <input
                  type="text"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  className={campoInput}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className={campoLabel}>Telefone</label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className={campoInput}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-1.5">
                <label className={campoLabel}>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={campoInput}
                  placeholder="cliente@email.com"
                />
              </div>
            </div>

            {erro && (
              <p className="text-sm text-destructive">{erro}</p>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Cadastrar Cliente'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/atendimentos')}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clientes Cadastrados</CardTitle>
          <CardDescription>
            {lista.length} cliente(s) encontrado(s).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : lista.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum cliente cadastrado.
            </p>
          ) : (
            <div className="space-y-2">
              {lista.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{c.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.telefone || c.email || c.cpfCnpj || 'Sem contato'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
