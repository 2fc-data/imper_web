import { type FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthShell } from '../components/auth/AuthShell';
import { PasswordInput } from '../components/auth/PasswordInput';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
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
          <CardTitle className="text-2xl tracking-tight font-serif">
            Redefinir senha
          </CardTitle>
          <CardDescription>Digite sua nova senha</CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Senha redefinida com sucesso. Já pode acessar o sistema.
              </p>
              <Link
                to="/login"
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 py-3 text-sm font-medium shadow-sm transition-all hover:bg-primary/10 hover:text-primary hover-lift"
              >
                Ir para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="senha">Nova senha</Label>
                <PasswordInput
                  id="senha"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmacao">Confirme a nova senha</Label>
                <PasswordInput
                  id="confirmacao"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Repita a senha"
                  value={confirmacao}
                  onChange={(e) => setConfirmacao(e.target.value)}
                />
              </div>
          {error && (
            <div role="alert" aria-live="assertive" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-center text-sm text-destructive">
              {error}
            </div>
          )}
              <Button
                type="submit"
                size="lg"
                className="w-full"
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
