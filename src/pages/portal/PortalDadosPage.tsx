import { type FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { CpfCnpjInput } from '../../components/ui/cpf-cnpj-input';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PhoneInput } from '../../components/ui/phone-input';
import {
  alterarSenha,
  api,
  atualizarPerfil,
  type MinhaConta,
} from '../../lib/api';
import { formatPhone } from '../../lib/format';
import { alterarSenhaSchema } from '../../schemas/auth';

function validarPerfil(
  nome: string,
  email: string,
  telefone: string,
  cpfCnpj: string,
): string | null {
  if (nome.trim().length < 2) return 'Nome deve ter pelo menos 2 caracteres';
  if (
    email.trim() !== '' &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return 'E-mail inválido';
  }
  const digitosTelefone = telefone.replace(/\D/g, '');
  if (
    digitosTelefone.length > 0 &&
    (digitosTelefone.length < 10 || digitosTelefone.length > 11)
  ) {
    return 'Telefone inválido. Informe DDD + número com 10 ou 11 dígitos';
  }
  const digitosCpfCnpj = cpfCnpj.replace(/\D/g, '');
  if (
    digitosCpfCnpj.length > 0 &&
    digitosCpfCnpj.length !== 11 &&
    digitosCpfCnpj.length !== 14
  ) {
    return 'CPF ou CNPJ inválido';
  }
  return null;
}

export default function PortalDadosPage() {
  const { refreshUser } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erroDados, setErroDados] = useState<string | null>(null);
  const [sucessoDados, setSucessoDados] = useState<string | null>(null);
  const [salvandoDados, setSalvandoDados] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [sucessoSenha, setSucessoSenha] = useState<string | null>(null);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get<MinhaConta>('/auth/me')
      .then((me) => {
        if (!active) return;
        setNome(me.nome ?? '');
        setEmail(me.email ?? '');
        setTelefone(me.telefone ? formatPhone(me.telefone) : '');
        setCpfCnpj(me.cpfCnpj ?? '');
      })
      .catch((err) => {
        if (!active) return;
        setErroDados(err instanceof Error ? err.message : 'Erro ao carregar');
      })
      .finally(() => {
        if (active) setCarregando(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmitDados(e: FormEvent) {
    e.preventDefault();
    setErroDados(null);
    setSucessoDados(null);
    const invalido = validarPerfil(nome, email, telefone, cpfCnpj);
    if (invalido) {
      setErroDados(invalido);
      return;
    }
    setSalvandoDados(true);
    try {
      await atualizarPerfil({
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        cpfCnpj: cpfCnpj.trim(),
      });
      await refreshUser();
      setSucessoDados('Dados atualizados.');
    } catch (err) {
      setErroDados(err instanceof Error ? err.message : 'Falha ao atualizar');
    } finally {
      setSalvandoDados(false);
    }
  }

  async function handleSubmitSenha(e: FormEvent) {
    e.preventDefault();
    setErroSenha(null);
    setSucessoSenha(null);
    if (novaSenha !== confirmar) {
      setErroSenha('As senhas não conferem.');
      return;
    }
    const parsed = alterarSenhaSchema.safeParse({ senhaAtual, novaSenha });
    if (!parsed.success) {
      setErroSenha(
        parsed.error.issues[0]?.message ?? 'Dados de senha inválidos',
      );
      return;
    }
    setSalvandoSenha(true);
    try {
      await alterarSenha(senhaAtual, novaSenha);
      setSucessoSenha('Senha alterada.');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmar('');
    } catch (err) {
      setErroSenha(err instanceof Error ? err.message : 'Falha ao alterar');
    } finally {
      setSalvandoSenha(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Meus dados</h1>
        <p className="text-sm text-muted-foreground">
          Atualize seu perfil e sua senha de acesso.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Nome, contato e documento</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitDados} className="space-y-4">
            {erroDados && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {erroDados}
              </p>
            )}
            {sucessoDados && (
              <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
                {sucessoDados}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                required
                autoComplete="name"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="vazio para remover"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <PhoneInput
                id="telefone"
                value={telefone}
                onChange={setTelefone}
                placeholder="vazio para remover"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
              <CpfCnpjInput
                id="cpfCnpj"
                autoComplete="off"
                value={cpfCnpj}
                onChange={setCpfCnpj}
              />
            </div>
            <Button type="submit" disabled={salvandoDados || carregando}>
              {salvandoDados ? 'Salvando...' : 'Salvar dados'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trocar senha</CardTitle>
          <CardDescription>
            Você continua conectado após a troca
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitSenha} className="space-y-4">
            {erroSenha && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {erroSenha}
              </p>
            )}
            {sucessoSenha && (
              <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
                {sucessoSenha}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="senhaAtual">Senha atual</Label>
              <Input
                id="senhaAtual"
                type="password"
                required
                autoComplete="current-password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova senha</Label>
              <Input
                id="novaSenha"
                type="password"
                required
                autoComplete="new-password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
              <Input
                id="confirmarSenha"
                type="password"
                required
                autoComplete="new-password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={salvandoSenha}>
              {salvandoSenha ? 'Alterando...' : 'Alterar senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
