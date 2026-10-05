import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/button';
import { api } from '../lib/api';

// ── Types ──────────────────────────────────────────────────────────────────
interface ObraMaterial { id: string; material: { nome: string }; quantidade: number; custoUnitario: number }
interface ObraAtividade {
  id: string; descricao: string; ordem: number; quantidade: number | null;
  areaM2: number | null; moValorTotal: number; materiaisValor: number;
  linhaValorTotal: number; cancelada: boolean;
  materiais: ObraMaterial[];
  catalogoAtividade?: { recursos: { tipo: string; nome: string; quantidade: number }[] };
}
interface ObraEtapa { id: number; nome: string; ordem: number; inativo: boolean; atividades: ObraAtividade[] }
interface OrdemServico { id: number; codigo: string; status: string; tecnicoResponsavel?: { nome: string }; createdAt: string }
interface Aditivo { id: number; descricao: string; valor: number; status: 'PENDENTE' | 'APROVADO' | 'RECUSADO'; createdAt: string }
interface Obra {
  id: number; codigo: string; status: string; urgencia: string;
  valorContratado: number; createdAt: string;
  user?: { id: number; nome: string; email: string };
  aprovadoPor?: { nome: string };
  orcamento?: { id: number; codigo: string; valorTotal: number; atividades: any[] };
  etapas: ObraEtapa[];
  ordensServico: OrdemServico[];
  aditivos: Aditivo[];
}
interface Comparacao {
  obraId: number; codigo: string; valorContratado: number;
  baseline: any[]; mestre: any[]; aditivos: Aditivo[];
}

// ── Formatters ─────────────────────────────────────────────────────────────
const brl = (v: number) =>
  Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS_OBRA_LABEL: Record<string, string> = {
  EM_PREPARACAO: 'Em Preparação', EM_EXECUCAO: 'Em Execução',
  CONCLUIDA: 'Concluída', CANCELADA: 'Cancelada',
};

// ── Sub-components ─────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-lg font-bold text-foreground font-mono">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

function AbaBtn({ ativa, onClick, children }: { ativa: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${ativa ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
    >
      {children}
    </button>
  );
}

// ── Aba Escopo ─────────────────────────────────────────────────────────────
function AbaEscopo({ etapas, canEdit }: { etapas: ObraEtapa[]; canEdit: boolean }) {
  if (!etapas?.length)
    return <p className="py-12 text-center text-muted-foreground">Nenhuma etapa cadastrada na obra.</p>;

  return (
    <div className="space-y-4">
      {etapas.map((etapa) => (
        <Card key={etapa.id} className={etapa.inativo ? 'opacity-60' : ''}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                <span className="text-muted-foreground mr-2 text-sm">#{etapa.ordem}</span>
                {etapa.nome}
              </CardTitle>
              {etapa.inativo && (
                <StatusBadge status="INATIVO" size="sm" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {etapa.atividades?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Sem atividades nesta etapa.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {etapa.atividades.map((ativ) => (
                  <div key={ativ.id} className={`py-3 flex items-start justify-between gap-4 text-sm ${ativ.cancelada ? 'opacity-40 line-through' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{ativ.descricao}</p>
                      <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                        {ativ.quantidade != null && <span>Qtd: {ativ.quantidade}</span>}
                        {ativ.areaM2 != null && <span>Área: {ativ.areaM2} m²</span>}
                        {ativ.materiais?.length > 0 && <span>📦 {ativ.materiais.length} material(is)</span>}
                        {(ativ.catalogoAtividade?.recursos?.length ?? 0) > 0 && (
                          <span>🦺 {ativ.catalogoAtividade?.recursos?.length} recurso(s)</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-sm font-semibold">{brl(ativ.linhaValorTotal)}</p>
                      {ativ.materiaisValor > 0 && (
                        <p className="text-xs text-muted-foreground">Mat: {brl(ativ.materiaisValor)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Aba OS ─────────────────────────────────────────────────────────────────
function AbaOS({
  obra, onCriarOs,
}: { obra: Obra; onCriarOs: () => void }) {
  const { ordensServico } = obra;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Ordens de Serviço</CardTitle>
          {obra.status !== 'CONCLUIDA' && obra.status !== 'CANCELADA' && (
            <Button size="sm" onClick={onCriarOs}>+ Nova OS</Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!ordensServico?.length ? (
          <div className="py-10 text-center space-y-3">
            <p className="text-muted-foreground">Nenhuma OS criada.</p>
            {obra.status === 'EM_PREPARACAO' && (
              <Button variant="outline" onClick={onCriarOs}>Criar primeira OS</Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {ordensServico.map((os) => (
              <div key={os.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Link
                    to={`/os?codigo=${os.codigo}`}
                    className="font-mono font-bold text-primary hover:underline text-sm"
                  >
                    {os.codigo}
                  </Link>
                  <span className="text-sm text-muted-foreground truncate">
                    {os.tecnicoResponsavel?.nome ?? 'Técnico não atribuído'}
                  </span>
                </div>
                <StatusBadge status={os.status} size="sm" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Variation Bar ──────────────────────────────────────────────────────────
function VariationBar({ baseline, current }: { baseline: number; current: number }) {
  if (baseline <= 0 && current <= 0) return null;
  const ratio = baseline > 0 ? current / baseline : 2;
  const pct = Math.min(ratio * 100, 100);
  const color =
    ratio <= 1 ? 'bg-success/70' : ratio <= 1.2 ? 'bg-warning/70' : 'bg-destructive/70';

  return (
    <div className="w-full bg-muted/20 rounded-full h-1.5 mt-1.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Aba Aditivos ───────────────────────────────────────────────────────────
function AbaAditivos({
  obra, comparacao, onNovoAditivo, onAprovar, onRecusar,
}: {
  obra: Obra;
  comparacao: Comparacao | null;
  onNovoAditivo: () => void;
  onAprovar: (id: number) => void;
  onRecusar: (id: number) => void;
}) {
  const usandoFallback = !comparacao;

  // ── Derive metrics from comparacao endpoint or fallback to local obra ──
  const baselineAtivs: any[] = comparacao?.baseline ?? (obra.orcamento?.atividades ?? []);
  const mestreAtivs: any[] = comparacao?.mestre ?? obra.etapas.flatMap(e => e.atividades);
  const aditivosAprovados = obra.aditivos.filter(a => a.status === 'APROVADO');
  const totalAditivos = aditivosAprovados.reduce((s, a) => s + Number(a.valor), 0);

  // Valor Total
  const baselineTotal = comparacao
    ? baselineAtivs.reduce((s: number, a: any) => s + Number(a.linhaValorTotal ?? 0), 0)
    : Number(obra.orcamento?.valorTotal ?? 0);
  const mestreTotal = mestreAtivs.reduce((s: number, a: any) => s + Number(a.linhaValorTotal ?? 0), 0);
  const valorContratado = Number(comparacao?.valorContratado ?? obra.valorContratado);

  // Nº Etapas
  const baselineEtapas = new Set(baselineAtivs.map((a: any) => a.etapaId)).size;
  const mestreEtapas = comparacao
    ? new Set(mestreAtivs.map((a: any) => a.obraEtapaId)).size
    : obra.etapas.filter(e => !e.inativo).length;

  // Nº Atividades
  const baselineAtivCount = baselineAtivs.length;
  const mestreAtivAtivas = mestreAtivs.filter((a: any) => !a.cancelada).length;
  const mestreAtivCanceladas = mestreAtivs.length - mestreAtivAtivas;

  // Variation helpers
  const fmtDelta = (base: number, curr: number) => {
    if (base === 0) return '—';
    const d = ((curr - base) / base) * 100;
    return d === 0 ? '0%' : `${d > 0 ? '+' : ''}${d.toFixed(1)}%`;
  };
  const clrDelta = (base: number, curr: number) => {
    if (base === 0) return 'text-muted-foreground';
    const r = curr / base;
    return r <= 1 ? 'text-success' : r <= 1.2 ? 'text-warning' : 'text-destructive';
  };

  return (
    <div className="space-y-5">
      {/* Fallback warning */}
      {usandoFallback && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-2.5 flex items-center gap-2 text-xs text-warning">
          <span>⚠</span>
          <span>Dados de comparação indisponíveis — usando valores locais. Alguns dados podem estar incompletos.</span>
        </div>
      )}

      {/* Quick-glance stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Baseline (Orçamento)</span>
            <p className="text-xl font-bold font-mono mt-1">{brl(baselineTotal)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {baselineAtivCount} atividade{baselineAtivCount !== 1 ? 's' : ''} · {baselineEtapas} etapa{baselineEtapas !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Mestre (Obra Atual)</span>
            <p className="text-xl font-bold font-mono mt-1">{brl(mestreTotal)}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground">
                {mestreAtivAtivas} ativa{mestreAtivAtivas !== 1 ? 's' : ''} · {mestreEtapas} etapa{mestreEtapas !== 1 ? 's' : ''}
              </span>
              {mestreAtivCanceladas > 0 && (
                <span className="text-xs text-destructive/70">{mestreAtivCanceladas} canc.</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Aditivos Aprovados</span>
            <p className={`text-xl font-bold font-mono mt-1 ${totalAditivos > 0 ? 'text-warning' : ''}`}>
              {totalAditivos > 0 ? `+ ${brl(totalAditivos)}` : brl(0)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {aditivosAprovados.length} de {obra.aditivos.length} aprovado{aditivosAprovados.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela comparação detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Comparação: Baseline × Mestre × Aditivos</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground text-xs uppercase tracking-wider">
                <th className="text-left pb-2 font-medium">Métrica</th>
                <th className="text-right pb-2 font-medium">Baseline (Orç.)</th>
                <th className="text-right pb-2 font-medium">Mestre (Obra)</th>
                <th className="text-right pb-2 font-medium">Δ Aditivos Aprov.</th>
                <th className="text-right pb-2 font-medium w-20">Variação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {/* Valor Total */}
              <tr>
                <td className="py-3 text-foreground font-medium">
                  <div>Valor Total</div>
                  <VariationBar baseline={baselineTotal} current={mestreTotal} />
                </td>
                <td className="py-3 text-right font-mono">{brl(baselineTotal)}</td>
                <td className="py-3 text-right font-mono font-semibold">{brl(mestreTotal)}</td>
                <td className={`py-3 text-right font-mono ${totalAditivos > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                  {totalAditivos > 0 ? `+ ${brl(totalAditivos)}` : '—'}
                </td>
                <td className={`py-3 text-right font-mono text-xs font-semibold ${clrDelta(baselineTotal, valorContratado)}`}>
                  {fmtDelta(baselineTotal, valorContratado)}
                </td>
              </tr>
              {/* Nº Etapas */}
              <tr>
                <td className="py-3 text-foreground font-medium">
                  <div>Nº Etapas</div>
                  <VariationBar baseline={baselineEtapas} current={mestreEtapas} />
                </td>
                <td className="py-3 text-right font-mono">{baselineEtapas}</td>
                <td className="py-3 text-right font-mono font-semibold">{mestreEtapas}</td>
                <td className="py-3 text-right font-mono text-muted-foreground">—</td>
                <td className={`py-3 text-right font-mono text-xs font-semibold ${clrDelta(baselineEtapas, mestreEtapas)}`}>
                  {fmtDelta(baselineEtapas, mestreEtapas)}
                </td>
              </tr>
              {/* Nº Atividades */}
              <tr>
                <td className="py-3 text-foreground font-medium">
                  <div>Nº Atividades</div>
                  <VariationBar baseline={baselineAtivCount} current={mestreAtivAtivas} />
                </td>
                <td className="py-3 text-right font-mono">{baselineAtivCount}</td>
                <td className="py-3 text-right font-mono font-semibold">
                  {mestreAtivAtivas}
                  {mestreAtivCanceladas > 0 && (
                    <span className="text-xs text-destructive/60 ml-1">({mestreAtivCanceladas} canc.)</span>
                  )}
                </td>
                <td className="py-3 text-right font-mono text-muted-foreground">—</td>
                <td className={`py-3 text-right font-mono text-xs font-semibold ${clrDelta(baselineAtivCount, mestreAtivAtivas)}`}>
                  {fmtDelta(baselineAtivCount, mestreAtivAtivas)}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Histórico de Aditivos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Aditivos</CardTitle>
            {obra.status !== 'CONCLUIDA' && obra.status !== 'CANCELADA' && (
              <Button size="sm" variant="outline" onClick={onNovoAditivo}>+ Novo Aditivo</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!obra.aditivos?.length ? (
            <p className="py-6 text-center text-muted-foreground text-sm">Nenhum aditivo registrado.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {obra.aditivos.map((aditivo) => (
                <div key={aditivo.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{aditivo.descricao}</p>
                    <p className="text-xs text-muted-foreground font-mono">{brl(aditivo.valor)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={aditivo.status} size="sm" />
                    {aditivo.status === 'PENDENTE' && (
                      <>
                        <Button
                          size="sm"
                          className="h-7 px-2 text-xs bg-success/10 text-success hover:bg-success/20 border border-success/30"
                          variant="ghost"
                          onClick={() => onAprovar(aditivo.id)}
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 px-2 text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30"
                          variant="ghost"
                          onClick={() => onRecusar(aditivo.id)}
                        >
                          Recusar
                        </Button>
                      </>
                    )}
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

// ── Modal Criar OS ─────────────────────────────────────────────────────────
function ModalCriarOS({
  obra, onClose, onSuccess,
}: { obra: Obra; onClose: () => void; onSuccess: () => void }) {
  const [etapasSelecionadas, setEtapasSelecionadas] = useState<number[]>([]);
  const [tecnicoId, setTecnicoId] = useState('');
  const [dataInicioPrevista, setDataInicioPrevista] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const etapasAtivas = obra.etapas.filter(e => !e.inativo && e.atividades.some(a => !a.cancelada));

  const toggleEtapa = (id: number) =>
    setEtapasSelecionadas(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id],
    );

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (etapasSelecionadas.length === 0) { setErro('Selecione ao menos uma etapa.'); return; }
    try {
      setSubmitting(true);
      setErro(null);
      await api.post(`/obras/${obra.id}/os`, {
        etapaIds: etapasSelecionadas,
        tecnicoResponsavelId: tecnicoId ? Number(tecnicoId) : undefined,
        dataInicioPrevista: dataInicioPrevista ? new Date(dataInicioPrevista).toISOString() : undefined,
        observacoes: observacoes || undefined,
      });
      onSuccess();
      onClose();
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao criar OS');
    } finally {
      setSubmitting(false);
    }
  }

  // Recursos sugeridos das etapas selecionadas
  const recursosSugeridos = etapasSelecionadas.flatMap(etapaId => {
    const etapa = obra.etapas.find(e => e.id === etapaId);
    if (!etapa) return [];
    return etapa.atividades.flatMap(a =>
      (a.catalogoAtividade?.recursos ?? []).map(r => ({ ...r, atividade: a.descricao })),
    );
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg border border-border/60 max-h-[90vh] flex flex-col">
        <div className="p-6 pb-4 border-b border-border/60">
          <h2 className="text-lg font-bold">Criar Ordem de Serviço</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Selecione as etapas que farão parte desta OS</p>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Etapas */}
          <div>
            <label className="block text-sm font-medium mb-2">Etapas da Obra *</label>
            <div className="space-y-2 border border-border/60 rounded-xl p-3 max-h-44 overflow-y-auto bg-muted/20">
              {etapasAtivas.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">Nenhuma etapa ativa disponível.</p>
              )}
              {etapasAtivas.map(etapa => (
                <label key={etapa.id} className="flex items-center gap-3 cursor-pointer hover:bg-muted/40 rounded-lg px-2 py-1.5 transition-colors">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={etapasSelecionadas.includes(etapa.id)}
                    onChange={() => toggleEtapa(etapa.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{etapa.nome}</span>
                    <span className="text-xs text-muted-foreground ml-2">({etapa.atividades.length} atividades)</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Recursos sugeridos */}
          {recursosSugeridos.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Recursos sugeridos ({recursosSugeridos.length})
              </label>
              <div className="text-xs text-muted-foreground space-y-1 border border-border/60 rounded-xl p-3 bg-muted/10 max-h-28 overflow-y-auto">
                {recursosSugeridos.map((r, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{r.nome} <span className="text-muted-foreground/60">({r.tipo})</span></span>
                    <span>× {r.quantidade}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data prevista */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Data de Início Prevista</label>
            <input
              type="date"
              value={dataInicioPrevista}
              onChange={e => setDataInicioPrevista(e.target.value)}
              className="w-full border border-border/60 rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Observações</label>
            <textarea
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              rows={2}
              className="w-full border border-border/60 rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {erro && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {erro}
            </div>
          )}
        </form>

        <div className="p-5 pt-4 border-t border-border/60 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            type="submit"
            disabled={submitting || etapasSelecionadas.length === 0}
            onClick={handleSubmit as any}
          >
            {submitting ? 'Criando...' : 'Confirmar & Criar OS'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Criar Aditivo ────────────────────────────────────────────────────
function ModalCriarAditivo({
  obra, onClose, onSuccess,
}: { obra: Obra; onClose: () => void; onSuccess: () => void }) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    try {
      setSubmitting(true);
      setErro(null);
      await api.post(`/obras/${obra.id}/aditivos`, {
        descricao,
        valor: Number(valor),
        itens: [{ acrescimo: 'novaEtapa', nome: descricao }],
      });
      onSuccess();
      onClose();
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao criar aditivo');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border/60">
        <div className="p-6 pb-4 border-b border-border/60">
          <h2 className="text-lg font-bold">Novo Aditivo</h2>
          <p className="text-sm text-muted-foreground">Registra uma alteração contratual formal</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Descrição *</label>
            <input
              required
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Ex.: Inclusão de calha galvanizada"
              className="w-full border border-border/60 rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Valor Total (R$) *</label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={valor}
              onChange={e => setValor(e.target.value)}
              placeholder="0,00"
              className="w-full border border-border/60 rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
            />
          </div>
          {erro && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {erro}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={submitting || !descricao || !valor}>
              {submitting ? 'Registrando...' : 'Registrar Aditivo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export function ObraDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [obra, setObra] = useState<Obra | null>(null);
  const [comparacao, setComparacao] = useState<Comparacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aba, setAba] = useState<'escopo' | 'os' | 'aditivos'>('escopo');
  const [modalOs, setModalOs] = useState(false);
  const [modalAditivo, setModalAditivo] = useState(false);
  const [concluindo, setConcluindo] = useState(false);

  const canEdit = user?.permissoes.includes('editar_obra') ?? false;
  const canCriarOs = user?.permissoes.includes('criar_os') ?? false;
  const canAprovarAditivo = user?.permissoes.includes('aprovar_aditivo') ?? false;

  const carregar = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [obraRes, compRes] = await Promise.all([
        api.get<{ obra: Obra }>(`/obras/${id}`),
        api.get<Comparacao>(`/obras/${id}/comparacao`).catch(() => null),
      ]);
      setObra((obraRes as any).obra ?? obraRes);
      setComparacao(compRes as Comparacao | null);
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao carregar obra');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  async function handleConcluir() {
    if (!obra) return;
    if (!window.confirm(`Confirmar conclusão formal da ${obra.codigo}? Esta ação não pode ser desfeita.`)) return;
    try {
      setConcluindo(true);
      await api.post(`/obras/${id}/concluir`);
      await carregar();
    } catch (e: any) {
      window.alert(e?.message ?? 'Erro ao concluir obra');
    } finally {
      setConcluindo(false);
    }
  }

  async function handleAprovarAditivo(aditivoId: number) {
    if (!window.confirm('Aprovar este aditivo? O valor contratado será incrementado.')) return;
    try {
      await api.post(`/obras/aditivos/${aditivoId}/aprovar`);
      await carregar();
    } catch (e: any) { window.alert(e?.message ?? 'Erro'); }
  }

  async function handleRecusarAditivo(aditivoId: number) {
    if (!window.confirm('Recusar este aditivo?')) return;
    try {
      await api.post(`/obras/aditivos/${aditivoId}/recusar`);
      await carregar();
    } catch (e: any) { window.alert(e?.message ?? 'Erro'); }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando obra…</p>
        </div>
      </div>
    );
  }

  if (erro || !obra) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-destructive text-sm">{erro ?? 'Obra não encontrada'}</p>
        <Link to="/obras" className="text-primary text-sm hover:underline">← Voltar para obras</Link>
      </div>
    );
  }

  const todasOsConcluidas =
    obra.ordensServico?.length > 0 &&
    obra.ordensServico.every(os => os.status === 'CONCLUIDO' || os.status === 'CONFIRMADO');

  const podeConcluir = todasOsConcluidas && obra.status !== 'CONCLUIDA' && obra.status !== 'CANCELADA' && canEdit;

  const totalEtapas = obra.etapas?.length ?? 0;
  const totalAtividades = obra.etapas?.flatMap(e => e.atividades).length ?? 0;
  const totalOS = obra.ordensServico?.length ?? 0;
  const totalAditivos = obra.aditivos?.length ?? 0;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/obras" className="hover:text-foreground transition-colors">Obras</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{obra.codigo}</span>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              {/* Identidade */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold font-serif tracking-tight">{obra.codigo}</h1>
                  <StatusBadge
                    status={obra.status}
                    labelOverride={STATUS_OBRA_LABEL[obra.status] ?? obra.status}
                  />
                  {obra.urgencia !== 'NORMAL' && (
                    <StatusBadge
                      status={obra.urgencia === 'URGENTISSIMO' ? 'EM_ANDAMENTO' : 'PENDENTE'}
                      labelOverride={obra.urgencia === 'URGENTISSIMO' ? '🔴 Urgentíssimo' : '🟡 Urgente'}
                      size="sm"
                    />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Cliente: <span className="font-medium text-foreground">{obra.user?.nome ?? '—'}</span>
                  {obra.orcamento && (
                    <> · Orçamento: <span className="font-medium font-mono">{obra.orcamento.codigo}</span></>
                  )}
                </p>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 flex-wrap">
                {podeConcluir && (
                  <Button
                    onClick={handleConcluir}
                    disabled={concluindo}
                    className="bg-success text-success-foreground hover:bg-success/90 gap-1.5"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {concluindo ? 'Concluindo…' : 'Concluir Obra'}
                  </Button>
                )}
                {canCriarOs && obra.status !== 'CONCLUIDA' && obra.status !== 'CANCELADA' && (
                  <Button variant="outline" onClick={() => setModalOs(true)}>+ Nova OS</Button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-5 pt-5 border-t border-border/60 grid grid-cols-2 sm:grid-cols-4 gap-5">
              <StatCard label="Valor Contratado" value={brl(obra.valorContratado)} sub={`Orç: ${brl(obra.orcamento?.valorTotal ?? 0)}`} />
              <StatCard label="Etapas" value={String(totalEtapas)} sub={`${totalAtividades} atividades`} />
              <StatCard label="Ordens de Serviço" value={String(totalOS)} sub={todasOsConcluidas ? '✓ Todas concluídas' : undefined} />
              <StatCard label="Aditivos" value={String(totalAditivos)} sub={`${obra.aditivos.filter(a => a.status === 'APROVADO').length} aprovados`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta conclusão disponível */}
      {podeConcluir && (
        <div className="rounded-xl border border-success/40 bg-success/5 px-4 py-3 flex items-center gap-3 text-sm">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-success shrink-0">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-success font-medium">Todas as OSs foram concluídas.</span>
          <span className="text-muted-foreground">Você pode encerrar formalmente esta obra.</span>
        </div>
      )}

      {/* Abas */}
      <div className="flex gap-6 border-b border-border/60">
        <AbaBtn ativa={aba === 'escopo'} onClick={() => setAba('escopo')}>
          Escopo & Etapas {totalEtapas > 0 && <span className="ml-1 text-xs text-muted-foreground">({totalEtapas})</span>}
        </AbaBtn>
        <AbaBtn ativa={aba === 'os'} onClick={() => setAba('os')}>
          Ordens de Serviço {totalOS > 0 && <span className="ml-1 text-xs text-muted-foreground">({totalOS})</span>}
        </AbaBtn>
        <AbaBtn ativa={aba === 'aditivos'} onClick={() => setAba('aditivos')}>
          Aditivos & Comparação {totalAditivos > 0 && <span className="ml-1 text-xs text-muted-foreground">({totalAditivos})</span>}
        </AbaBtn>
      </div>

      {/* Conteúdo das abas */}
      {aba === 'escopo' && <AbaEscopo etapas={obra.etapas} canEdit={canEdit} />}
      {aba === 'os' && (
        <AbaOS obra={obra} onCriarOs={() => setModalOs(true)} />
      )}
      {aba === 'aditivos' && (
        <AbaAditivos
          obra={obra}
          comparacao={comparacao}
          onNovoAditivo={() => setModalAditivo(true)}
          onAprovar={canAprovarAditivo ? handleAprovarAditivo : () => window.alert('Sem permissão')}
          onRecusar={canAprovarAditivo ? handleRecusarAditivo : () => window.alert('Sem permissão')}
        />
      )}

      {/* Modais */}
      {modalOs && (
        <ModalCriarOS
          obra={obra}
          onClose={() => setModalOs(false)}
          onSuccess={carregar}
        />
      )}
      {modalAditivo && (
        <ModalCriarAditivo
          obra={obra}
          onClose={() => setModalAditivo(false)}
          onSuccess={carregar}
        />
      )}
    </div>
  );
}
