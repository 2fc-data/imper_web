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
import { PhoneInput } from '../components/ui/phone-input';
import { EmailInput } from '../components/ui/email-input';
import { recuperarSenha } from '../lib/api';

export default function ForgotPasswordPage() {
  const [canal, setCanal] = useState<'email' | 'whatsapp'>('email');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [done, setDone] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await recuperarSenha({
        canal,
        email: canal === 'email' ? email : undefined,
        telefone: canal === 'whatsapp' ? telefone : undefined,
      });
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
            Escolha como deseja receber o código de redefinição
          </CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Se as credenciais estiverem corretas, um código de redefinição foi
                enviado via {canal === 'email' ? 'e-mail' : 'WhatsApp'}.
              </p>
              {import.meta.env.DEV && devToken && (
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
                  <Label>Canal de recebimento</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={canal === 'email' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setCanal('email')}
                    >
                      E-mail
                    </Button>
                    <Button
                      type="button"
                      variant={canal === 'whatsapp' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setCanal('whatsapp')}
                    >
                      WhatsApp
                    </Button>
                  </div>
                </div>
                {canal === 'email' && (
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <EmailInput
                      id="email"
                      required
                      value={email}
                      onChange={setEmail}
                    />
                  </div>
                )}
                {canal === 'whatsapp' && (
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
                    <PhoneInput
                      id="telefone"
                      required
                      value={telefone}
                      onChange={setTelefone}
                    />
                  </div>
                )}
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
                {loading ? 'Enviando...' : 'Enviar código'}
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
