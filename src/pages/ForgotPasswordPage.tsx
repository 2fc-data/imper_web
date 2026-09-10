import { type FormEvent, useState } from 'react';
import { AuthShell } from '../components/auth/AuthShell';
import { BackToLogin } from '../components/auth/BackToLogin';
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
import { recuperarSenha } from '../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await recuperarSenha(email);
      setDone(true);
      setDevToken(result.devToken ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao solicitar redefinição',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <Card className="border-border/60 bg-card/80 shadow-xl backdrop-blur">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl tracking-tight font-serif">
            Recuperar senha
          </CardTitle>
          <CardDescription>
            Informe seu e-mail para receber um link de redefinição
          </CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Se o e-mail estiver cadastrado, um link de redefinição foi
                gerado.
              </p>
              {devToken && (
                <div className="space-y-2">
                  <Label htmlFor="devToken">Ambiente de desenvolvimento</Label>
                  <Input
                    id="devToken"
                    readOnly
                    value={devToken}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use este token no link de redefinição ou copie-o agora.
                  </p>
                </div>
              )}
              <BackToLogin />
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="voce@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  {loading ? 'Enviando...' : 'Enviar link'}
                </Button>
              </form>
              <BackToLogin />
            </>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
