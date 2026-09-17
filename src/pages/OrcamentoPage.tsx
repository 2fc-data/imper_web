import { m, useInView } from 'framer-motion';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Turnstile from '../components/Turnstile';
import { Button, buttonVariants } from '../components/ui/button';
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
import { CepInput, type CepDados } from '../components/ui/cep-input';
import { EmailInput } from '../components/ui/email-input';
import { solicitarOrcamento } from '../lib/api';
import { fadeUp, stagger, VIEWPORT } from '../lib/motion';
import { cn } from '../lib/utils';

const textareaClasses =
  'flex min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

export default function OrcamentoPage() {
  const navigate = useNavigate();
  const gridRef = useRef<HTMLDivElement>(null);
  const inView = useInView(gridRef, VIEWPORT);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [cepValido, setCepValido] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (!enviado) return;
    const timer = setTimeout(() => navigate('/'), 10_000);
    return () => clearTimeout(timer);
  }, [enviado, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (telefone && !/\(\d{2}\)\s?\d{4,5}-?\d{4}/.test(telefone)) {
      setError('Informe um telefone no formato (XX) XXXXX-XXXX.');
      return;
    }
    setLoading(true);
    try {
      await solicitarOrcamento({
        nome,
        telefone,
        email: email || undefined,
        descricao: descricao || undefined,
        cep: cep || undefined,
        endereco: endereco || undefined,
        bairro: bairro || undefined,
        cidade: cidade || undefined,
        estado: estado || undefined,
        numero: numero || undefined,
        complemento: complemento || undefined,
        turnstileToken: turnstileToken || undefined,
      });
      setEnviado(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Falha ao enviar pedido de orçamento',
      );
    } finally {
      setLoading(false);
    }
  }

  if (enviado) {
    return (
      <section className="border-y bg-card/60 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-[1400px] px-4">
          <m.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="rounded-xl border bg-card p-8 text-center shadow-sm sm:p-12"
          >
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Contato recebido!
            </h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Nossa equipe entrará em contato o mais rápido possível.
            </p>
            <Link
              to="/"
              className={cn(buttonVariants({ variant: 'outline' }), 'mt-6')}
            >
              Voltar ao início
            </Link>
            <p className="mt-2 text-xs text-muted-foreground">
              Redirecionando automaticamente em 10 segundos…
            </p>
          </m.div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-y bg-card/60 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-[1400px] px-4">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl font-serif">
          Entre em contato
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Preencha o formulário com o serviço desejado.
        </p>
        <m.div
          ref={gridRef}
          className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]"
          variants={stagger()}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          <m.div variants={fadeUp} className="w-full">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">
                  Formulário para atendimento
                </CardTitle>
                <CardDescription>
                  Os campos marcados com * são obrigatórios.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">
                      Nome <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nome"
                      required
                      autoComplete="name"
                      placeholder="Seu nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">
                      Telefone <span className="text-destructive">*</span>
                    </Label>
                    <PhoneInput
                      id="telefone"
                      required
                      value={telefone}
                      onChange={setTelefone}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <EmailInput
                      id="email"
                      value={email}
                      onChange={setEmail}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <textarea
                      id="descricao"
                      className={textareaClasses}
                      placeholder="Descreva o problema ou necessidade..."
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      maxLength={700}
                    />
                    <p className="text-right text-xs text-muted-foreground">
                      {descricao.length}/700
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP (Local da visita técnica)</Label>
                    <CepInput
                      id="cep"
                      value={cep}
                      onChange={setCep}
                      onConsulta={(dados: CepDados) => {
                        setEndereco(dados.logradouro);
                        setBairro(dados.bairro);
                        setCidade(dados.cidade);
                        setEstado(dados.estado);
                        setCepValido(true);
                      }}
                      onErro={() => setCepValido(false)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ao informar o CEP, preenchemos endereço, bairro, cidade e
                      UF automaticamente.
                    </p>
                  </div>
                  {cepValido && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="endereco">Endereço</Label>
                        <Input
                          id="endereco"
                          autoComplete="street-address"
                          placeholder="Rua, avenida..."
                          value={endereco}
                          onChange={(e) => setEndereco(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_120px]">
                        <div className="space-y-2">
                          <Label htmlFor="bairro">Bairro</Label>
                          <Input
                            id="bairro"
                            autoComplete="address-level2"
                            placeholder="Bairro"
                            value={bairro}
                            onChange={(e) => setBairro(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cidade">Cidade</Label>
                          <Input
                            id="cidade"
                            autoComplete="address-level1"
                            placeholder="Cidade"
                            value={cidade}
                            onChange={(e) => setCidade(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="estado">UF</Label>
                          <Input
                            id="estado"
                            autoComplete="address-level1"
                            maxLength={2}
                            placeholder="UF"
                            value={estado}
                            onChange={(e) =>
                              setEstado(e.target.value.toUpperCase())
                            }
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="numero">Número</Label>
                          <Input
                            id="numero"
                            inputMode="numeric"
                            autoComplete="address-line1"
                            placeholder="Número"
                            value={numero}
                            onChange={(e) => setNumero(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="complemento">Complemento</Label>
                          <Input
                            id="complemento"
                            placeholder="Apto, bloco..."
                            value={complemento}
                            onChange={(e) => setComplemento(e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  <Turnstile onChange={setTurnstileToken} />
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
                    {loading ? 'Enviando...' : 'Enviar mensagem'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </m.div>
          <m.div variants={fadeUp} className="space-y-4">
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="font-semibold">Prefere conversar?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Fale direto com nossa equipe pelo WhatsApp e receba atendimento
                imediato.
              </p>
              <Link
                to="/contato"
                className={cn(
                  buttonVariants({
                    size: 'lg',
                    className:
                      'mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90 hover-lift font-semibold shadow-md transition-all',
                  }),
                )}
              >
                Ir para contato
              </Link>
            </div>
          </m.div>
        </m.div>
      </div>
    </section>
  );
}
