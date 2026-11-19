import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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
import { StorytellingPanel } from '../components/analytics/StorytellingPanel';
import {
  atualizarVeiculo,
  type AnalisesFrota,
  criarVeiculo,
  excluirVeiculo,
  listarVeiculos,
  buscarAnalisesFrota,
  buscarVeiculoLookups,
  obterProximoCodigoVeiculo,
  type VeiculoInput,
  type VeiculoItem,
  type VeiculoLookups,
} from '../lib/api';
import { formatarData, formatarValor } from '../lib/datetime';
import { formatarKm, parseKm } from '../lib/km';
import { cn } from '../lib/utils';
import {
  selectClasses,
  textareaCompactClasses as textareaClasses,
} from '../components/ui/form-classes';

function BadgeAtivo({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium',
        ativo
          ? 'bg-emerald-500/10 text-emerald-600'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  );
}

type View = 'analises' | 'lista' | 'novo';

interface Props {
  view: View;
  onViewChange: (view: View) => void;
}

function formatarPlaca(valor: string): string {
  const bruto = valor.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  if (bruto.length <= 3) return bruto;
  return `${bruto.slice(0, 3)}-${bruto.slice(3)}`;
}

const emptyForm: VeiculoInput = {
  codigo: '',
  placa: '',
  nome: '',
  modelo: '',
  ano: undefined,
  combustivel: 'GASOLINA',
  odometroAtual: undefined,
  observacoes: '',
  corId: undefined,
  fabricanteId: undefined,
  tipoId: 0,
  statusId: 0,
};

const MESES_CURTOS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

function AnalisesFrota({
  analises,
  mesSelecionado,
  anoSelecionado,
  onMudarMes,
}: {
  analises: AnalisesFrota | null;
  mesSelecionado: number;
  anoSelecionado: number;
  onMudarMes: (mes: number) => void;
}) {
  const { kmTotalMes, abastecimentosMes, manutencoesPorStatus, veiculosSemKm, mes, ano } =
    analises ?? {
      kmTotalMes: 0,
      abastecimentosMes: { quantidade: 0, totalLitros: 0, totalValor: 0 },
      manutencoesPorStatus: [],
      veiculosSemKm: [],
      mes: mesSelecionado,
      ano: anoSelecionado,
    };

  const storytelling = useMemo(() => {
    let statusGeral: 'otimo' | 'atencao' | 'critico' | 'estavel' = 'estavel';
    if (veiculosSemKm.length > 2) statusGeral = 'critico';
    else if (veiculosSemKm.length > 0) statusGeral = 'atencao';
    else if (kmTotalMes > 0) statusGeral = 'otimo';

    const cenario = [
      `A frota percorreu um total de ${kmTotalMes.toLocaleString('pt-BR')} km no mês ${mes}/${ano}.`,
      `Registrados ${abastecimentosMes.quantidade} abastecimento(s) totalizando ${abastecimentosMes.totalLitros.toFixed(1)} L (${formatarValor(abastecimentosMes.totalValor)}).`,
      `Controle de manutenções com ${manutencoesPorStatus.reduce((acc, m) => acc + m.quantidade, 0)} ordens registradas no sistema.`,
    ];

    const diagnostico = [
      veiculosSemKm.length > 0
        ? `${veiculosSemKm.length} veículo(s) sem apontamento de KM há mais de 5 dias úteis: ${veiculosSemKm.map((v) => `${v.nome} — ${v.placa}`).join(', ')}.`
        : 'Todos os veículos da frota possuem registros recentes de odômetro.',
      abastecimentosMes.quantidade === 0 && kmTotalMes > 0
        ? 'Quilometragem registrada sem novos abastecimentos apontados no mês.'
        : 'Fluxo regular de abastecimentos compatível com o deslocamento da frota.',
    ];

    const recomendacoes = [
      veiculosSemKm.length > 0
        ? 'Cobrar dos responsáveis e motoristas o preenchimento diário do odômetro dos veículos parados ou sem registro.'
        : 'Manter a rotina de preenchimento de odômetro ao final de cada jornada de trabalho.',
      'Auditar o consumo médio (km/litro) cruzando odômetros com os comprovantes de combustível.',
      'Verificar o status das ordens de manutenção pendentes para evitar indisponibilidade operacional.',
    ];

    const resumoExecutivo = `Frota com ${kmTotalMes.toLocaleString('pt-BR')} km percorridos em ${mes}/${ano}, consumo de ${formatarValor(abastecimentosMes.totalValor)} em combustíveis e ${veiculosSemKm.length} veículo(s) necessitando de atenção quanto ao registro de odômetro.`;

    return { statusGeral, resumoExecutivo, cenario, diagnostico, recomendacoes };
  }, [kmTotalMes, abastecimentosMes, manutencoesPorStatus, veiculosSemKm, mes, ano]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Análises de Frota</h2>
          <p className="text-sm text-muted-foreground">
            Visão geral de KM, abastecimentos e manutenções do mês {mes}/{ano}.
          </p>
        </div>

        {/* Seletor de Mês */}
        <div className="flex flex-wrap items-center gap-1">
          {MESES_CURTOS.map((nome, i) => {
            const m = i + 1;
            const ativo = m === mesSelecionado;
            return (
              <button
                key={nome}
                type="button"
                onClick={() => onMudarMes(m)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  ativo
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                {nome}
              </button>
            );
          })}
          <span className="ml-1 text-xs text-muted-foreground">{anoSelecionado}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">KM total do mês</p>
          <p className="mt-2 text-2xl font-bold">{kmTotalMes.toLocaleString('pt-BR')}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Abastecimentos</p>
          <p className="mt-2 text-2xl font-bold">{abastecimentosMes.quantidade}</p>
          <p className="text-xs text-muted-foreground">
            {abastecimentosMes.totalLitros.toFixed(2)} L · {formatarValor(abastecimentosMes.totalValor)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Custo com Combustível</p>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatarValor(abastecimentosMes.totalValor)}
          </p>
          <p className="text-xs text-muted-foreground">Total faturado no mês</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Veículos sem KM (+5 dias)</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              veiculosSemKm.length > 0 ? 'text-destructive' : 'text-emerald-600'
            }`}
          >
            {veiculosSemKm.length}
          </p>
          <p className="text-xs text-muted-foreground">Atenção ao odômetro</p>
        </div>
      </div>

      {/* Painel de Storytelling */}
      <StorytellingPanel
        statusGeral={storytelling.statusGeral}
        resumoExecutivo={storytelling.resumoExecutivo}
        cenario={storytelling.cenario}
        diagnostico={storytelling.diagnostico}
        recomendacoes={storytelling.recomendacoes}
      />

      {/* Gráfico de Manutenções por Status */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-semibold text-base text-foreground">Manutenções por Status</h3>
            <p className="text-xs text-muted-foreground">Volume de ordens de serviço por etapa</p>
          </div>
          <div className="h-64 w-full">
            {manutencoesPorStatus.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhuma manutenção registrada neste mês.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={manutencoesPorStatus} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card, #fff)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="quantidade" name="Ordens" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Veículos sem KM */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-base">Veículos sem KM há mais de 5 dias úteis</h3>
          {veiculosSemKm.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todos os veículos com registro recente.</p>
          ) : (
            <ul className="space-y-1.5 divide-y divide-border/50 max-h-64 overflow-y-auto">
              {veiculosSemKm.map((v) => (
                <li key={v.id} className="pt-1.5 flex justify-between text-sm">
                  <span className="font-medium">{v.nome} — {v.placa}</span>
                  <span className="text-xs text-muted-foreground">
                    {v.ultimoRegistro ? `Último: ${formatarData(v.ultimoRegistro)}` : 'Sem registros'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VeiculosAdminPage({ view, onViewChange }: Props) {
  const [veiculos, setVeiculos] = useState<VeiculoItem[]>([]);
  const [lookups, setLookups] = useState<VeiculoLookups | null>(null);
  const [analises, setAnalises] = useState<AnalisesFrota | null>(null);
  const hoje = new Date();
  const [mesAnalise, setMesAnalise] = useState(hoje.getMonth() + 1);
  const [anoAnalise] = useState(hoje.getFullYear());
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<number | ''>('');
  const [tipoFiltro, setTipoFiltro] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState<VeiculoItem | null>(null);
  const [form, setForm] = useState<VeiculoInput>(emptyForm);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<number | null>(null);
  const [excluindo, setExcluindo] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setError(null);
    try {
      const [lista, lk, an] = await Promise.all([
        listarVeiculos(),
        buscarVeiculoLookups(),
        buscarAnalisesFrota({ mes: mesAnalise, ano: anoAnalise }),
      ]);
      setVeiculos(lista);
      setLookups(lk);
      setAnalises(an);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar veículos');
    }
  }, [mesAnalise, anoAnalise]);

  const handleMudarMesAnalise = async (m: number) => {
    setMesAnalise(m);
    try {
      const an = await buscarAnalisesFrota({ mes: m, ano: anoAnalise });
      setAnalises(an);
    } catch {
      // silencioso
    }
  };

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (view !== 'novo' || editando) return;
    let cancelado = false;
    obterProximoCodigoVeiculo()
      .then((r) => {
        if (!cancelado) setForm((prev) => ({ ...prev, codigo: r.codigo }));
      })
      .catch(() => {
        /* silencioso — campo fica editável */
      });
    return () => {
      cancelado = true;
    };
  }, [view, editando]);

  function comecarEdicao(v: VeiculoItem) {
    setEditando(v);
    setForm({
      codigo: v.codigo,
      placa: v.placa,
      nome: v.nome,
      modelo: v.modelo ?? '',
      ano: v.ano ?? undefined,
      combustivel: v.combustivel,
      odometroAtual: v.odometroAtual,
      observacoes: v.observacoes ?? '',
      corId: v.corId ?? undefined,
      fabricanteId: v.fabricanteId ?? undefined,
      tipoId: v.tipoId,
      statusId: v.statusId,
    });
    setError(null);
  }

  function cancelarEdicao() {
    setEditando(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: VeiculoInput = {
        ...form,
        modelo: form.modelo || undefined,
        ano: form.ano || undefined,
        observacoes: form.observacoes || undefined,
        odometroAtual: form.odometroAtual,
        tipoId: form.tipoId || 0,
        statusId: form.statusId || 0,
      };
      if (editando) {
        const atualizado = await atualizarVeiculo(editando.id, payload);
        setVeiculos((prev) => prev.map((x) => (x.id === atualizado.id ? atualizado : x)));
        cancelarEdicao();
      } else {
        const criado = await criarVeiculo(payload);
        setVeiculos((prev) => [criado, ...prev]);
        cancelarEdicao();
        onViewChange('lista');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar veículo');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtivo(v: VeiculoItem) {
    setError(null);
    try {
      const atualizado = await atualizarVeiculo(v.id, { ativo: !v.ativo });
      setVeiculos((prev) => prev.map((x) => (x.id === atualizado.id ? atualizado : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar veículo');
    }
  }

  async function handleExcluir(id: number) {
    setExcluindo(id);
    setError(null);
    try {
      await excluirVeiculo(id);
      setVeiculos((prev) => prev.filter((x) => x.id !== id));
      setConfirmandoExclusao(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir veículo');
    } finally {
      setExcluindo(null);
    }
  }

  const formulario = (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {editando ? `Editar veículo — ${editando.nome} — ${editando.placa}` : 'Novo veículo'}
        </CardTitle>
        <CardDescription>
          {editando ? 'Atualize as informações e salve as alterações.' : 'Cadastre um veículo da frota.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="placa">Placa</Label>
              <Input id="placa" required maxLength={8} placeholder="HHE-8265" value={form.placa} onChange={(e) => setForm({ ...form, placa: formatarPlaca(e.target.value) })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fabricanteId">Fabricante</Label>
              <select id="fabricanteId" value={form.fabricanteId || ''} onChange={(e) => setForm({ ...form, fabricanteId: e.target.value ? Number(e.target.value) : undefined })} className={selectClasses}>
                <option value="">Sem fabricante</option>
                {[...(lookups?.marcas ?? [])]
                  .filter((m) => m.ativo)
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((m) => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modelo">Modelo</Label>
              <Input id="modelo" value={form.modelo ?? ''} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ano">Ano</Label>
              <Input id="ano" inputMode="numeric" maxLength={4} placeholder="2027" value={form.ano ?? ''} onChange={(e) => setForm({ ...form, ano: e.target.value.replace(/\D/g, '').slice(0, 4) ? Number(e.target.value.replace(/\D/g, '').slice(0, 4)) : undefined })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="combustivel">Combustível</Label>
              <select id="combustivel" value={form.combustivel ?? 'GASOLINA'} onChange={(e) => setForm({ ...form, combustivel: e.target.value })} className={selectClasses}>
                <option value="GASOLINA">Gasolina</option>
                <option value="ALCOOL">Álcool</option>
                <option value="FLEX">Flex</option>
                <option value="DIESEL">Diesel</option>
                <option value="GNV">GNV</option>
                <option value="ELETRICO">Elétrico</option>
                <option value="HIBRIDO">Híbrido</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="odometroAtual">Odômetro atual (km)</Label>
              <Input id="odometroAtual" inputMode="numeric" placeholder="Ex.: 280.607" value={formatarKm(form.odometroAtual)} onChange={(e) => setForm({ ...form, odometroAtual: parseKm(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipoId">Tipo</Label>
              <select id="tipoId" required value={form.tipoId || ''} onChange={(e) => setForm({ ...form, tipoId: Number(e.target.value) })} className={selectClasses}>
                <option value="" disabled>Selecione o tipo...</option>
                {(lookups?.tiposVeiculo ?? []).filter((t) => t.ativo).map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="statusId">Status</Label>
              <select id="statusId" required value={form.statusId || ''} onChange={(e) => setForm({ ...form, statusId: Number(e.target.value) })} className={selectClasses}>
                <option value="" disabled>Selecione o status...</option>
                {(lookups?.statusVeiculos ?? []).filter((s) => s.ativo).map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="corId">Cor</Label>
              <select id="corId" value={form.corId || ''} onChange={(e) => setForm({ ...form, corId: e.target.value ? Number(e.target.value) : undefined })} className={selectClasses}>
                <option value="">Sem cor</option>
                {(lookups?.cores ?? []).filter((c) => c.ativo).map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="observacoes">Observações</Label>
            <textarea id="observacoes" className={textareaClasses} value={form.observacoes ?? ''} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
            {editando && (
              <Button type="button" variant="outline" onClick={() => { cancelarEdicao(); onViewChange('lista'); }}>Cancelar</Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Gestão de Veículos</h1>
        <p className="text-sm text-muted-foreground">Cadastro e controle da frota.</p>
      </header>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {view === 'analises' && (
        <AnalisesFrota
          analises={analises}
          mesSelecionado={mesAnalise}
          anoSelecionado={anoAnalise}
          onMudarMes={handleMudarMesAnalise}
        />
      )}
      {(view === 'novo' || editando) && formulario}

      {view === 'lista' && !editando && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar por código, placa ou nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value ? Number(e.target.value) : '')}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">TODOS OS STATUS</option>
              {(lookups?.statusVeiculos ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value ? Number(e.target.value) : '')}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">TODOS OS TIPOS</option>
              {(lookups?.tiposVeiculo ?? []).map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>

          {(() => {
            const filtrados = veiculos.filter(
              (v) =>
                (!statusFiltro || v.statusId === statusFiltro) &&
                (!tipoFiltro || v.tipoId === tipoFiltro) &&
                (!busca ||
                  `${v.codigo} ${v.placa} ${v.nome}`.toLowerCase().includes(busca.toLowerCase())),
            );
            return (
              <div className="space-y-3">
                {filtrados.map((v) => (
                  <Card key={v.id}>
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-base">{v.nome} — {v.placa}</CardTitle>
                          <BadgeAtivo ativo={v.ativo} />
                        </div>
                        <span className="text-xs text-muted-foreground">{v.status?.nome}</span>
                      </div>
                      <CardDescription className="text-sm">
                        Placa: {v.placa} · Código: {v.codigo}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {v.tipo && <span>Tipo: {v.tipo.nome} · </span>}
                        {v.fabricante && <span>Fabricante: {v.fabricante.nome} · </span>}
                        {v.modelo && <span>{v.modelo}</span>}
                        {v.ano && <span> · {v.ano}</span>}
                        <span> · Odômetro: {formatarKm(v.odometroAtual)} km</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => comecarEdicao(v)}>Editar</Button>
                        <Button type="button" variant="outline" size="sm" disabled={excluindo === v.id} onClick={() => handleToggleAtivo(v)}>
                          {v.ativo ? 'Desativar' : 'Ativar'}
                        </Button>
                        {confirmandoExclusao === v.id ? (
                          <>
                            <Button type="button" variant="destructive" size="sm" disabled={excluindo === v.id} onClick={() => handleExcluir(v.id)}>
                              {excluindo === v.id ? 'Excluindo...' : 'Confirmar exclusão'}
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmandoExclusao(null)}>Cancelar</Button>
                          </>
                        ) : (
                          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmandoExclusao(v.id)}>Excluir</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {!error && filtrados.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">Nenhum veículo encontrado.</p>
                )}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
