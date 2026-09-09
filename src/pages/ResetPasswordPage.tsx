import { type FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthShell } from '../components/auth/AuthShell';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { redefinirSenha } from '../lib/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (senha !== confirmacao) {
      setError('As senhas não coincidem');
      return;
    }
    if (!token) {
      setError('Link inválido: token ausente');
      return;
    }
    setLoading(true);
    try {
      await redefinirSenha(token, senha);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao redefinir senha');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <Card className="border-border/60 bg-card/80 shadow-xl backdrop-blur">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl tracking-tight">
            Redefinir senha
          </CardTitle>
          <CardDescription>Digite sua nova senha</CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Senha redefinida com sucesso. Já pode acessar o sistema.
              </p>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:text-primary-foreground hover:shadow-none hover-lift"
              >
                Ir para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="senha">Nova senha</Label>
                <Input
                  id="senha"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmacao">Confirme a nova senha</Label>
                <Input
                  id="confirmacao"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Repita a senha"
                  value={confirmacao}
                  onChange={(e) => setConfirmacao(e.target.value)}
                />
              </div>
              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground hover-lift font-semibold shadow-md transition-all hover:shadow-none"
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Redefinir senha'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
