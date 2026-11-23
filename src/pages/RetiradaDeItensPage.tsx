import { useCallback, useEffect, useState } from 'react';
import { RetiradaDeItensAnalyticsDashboard } from '../components/analytics/RetiradaDeItensAnalyticsDashboard';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  adicionarItemSeparacao,
  api,
  confirmarSeparacao,
  excluirSeparacao,
  listarEquipamentos,
  listarEpis,
  listarLookupsEpis,
  listarMateriais,
  listarSeparacoes,
  registrarDevolucaoItemSeparacao,
  registrarRetiradaItemSeparacao,
  removerItemSeparacao,
  type ObraSeparacao,
  type SeparacaoItem,
  type SeparacaoItemDetalhe,
} from '../lib/api';
import { formatarData, formatarDataHora } from '../lib/format';
import { cn } from '../lib/utils';
import { selectClasses } from '../components/ui/form-classes';

type TipoItem = 'materiais' | 'equipamentos' | 'epis';

const TIPOS_ITEM: TipoItem[] = ['materiais', 'equipamentos', 'epis'];

const TIPO_LABELS: Record<TipoItem, string> = {
  materiais: 'Materiais',
  equipamentos: 'Equipamentos',
  epis: 'EPIs',
};

const STATUS_PENDENTES = new Set(['PENDENTE', 'SEPARADO', 'EM_FALTA']);

const PAPEIS_COLABORADOR = new Set(['COLABORADOR', 'COLABORADORES']);

const STATUS_RETIRADOS = new Set([
  'RETIRADO',
  'DEVOLVIDO',
  'PERDIDO',
  'CONFERIDO',
]);

const STATUS_COLORS: Record<string, string> = {
  SEPARACAO_PENDENTE: 'bg-amber-500/10 text-amber-600',
  SEPARACAO_CONCLUIDA: 'bg-blue-500/10 text-blue-600',
  RETIRADA_PENDENTE: 'bg-orange-500/10 text-orange-600',
  RETIRADA_CONCLUIDA: 'bg-emerald-500/10 text-emerald-600',
  DEVOLUCAO_PENDENTE: 'bg-rose-500/10 text-rose-600',
  DEVOLUCAO_CONCLUIDA: 'bg-emerald-600/10 text-emerald-700',
};

const STATUS_LABELS: Record<string, string> = {
  SEPARACAO_PENDENTE: 'Separação Pendente',
  SEPARACAO_CONCLUIDA: 'Separação Concluída',
  RETIRADA_PENDENTE: 'Retirada Pendente',
  RETIRADA_CONCLUIDA: 'Retirada Concluída',
  DEVOLUCAO_PENDENTE: 'Devolução Pendente',
  DEVOLUCAO_CONCLUIDA: 'Devolução Concluída',
};

const ITEM_STATUS_COLORS: Record<string, string> = {
  PENDENTE: 'bg-muted text-muted-foreground',
  SEPARADO: 'bg-sky-500/10 text-sky-600',
  EM_FALTA: 'bg-amber-500/10 text-amber-600',
  RETIRADO: 'bg-emerald-500/10 text-emerald-600',
  DEVOLVIDO: 'bg-blue-500/10 text-blue-600',
  PERDIDO: 'bg-rose-500/10 text-rose-600',
  CONFERIDO: 'bg-muted text-muted-foreground',
};

const ITEM_STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  SEPARADO: 'Separado',
  EM_FALTA: 'Em falta',
  RETIRADO: 'Retirado',
  DEVOLVIDO: 'Devolvido',
  PERDIDO: 'Perdido',
  CONFERIDO: 'Conferido',
};

interface RegistroItem {
  separacaoId: number;
  separacaoCodigo: string;
  item: SeparacaoItemDetalhe;
  tipo: TipoItem;
  nome: string;
  quantidade: number;
  colaborador: {
    id: number;
    nome: string;
    papeis?: { papel: { nome: string } }[] | null;
  };
  retiradoEm: string | null;
  devolvidoEm: string | null;
}

interface OpcaoAdicao {
  id: number;
  label: string;
}

const OPCOES_ADICAO_VAZIAS: Record<TipoItem, OpcaoAdicao[]> = {
  materiais: [],
  equipamentos: [],
  epis: [],
};

function mensagemErro(e: unknown): string {
  return e instanceof Error && e.message
    ? e.message
    : 'Não foi possível concluir a operação';
}

function formatarEnderecoObra(
  endereco?: ObraSeparacao['endereco'],
): string {
  if (!endereco?.logradouro) return '';
  const linha1 = endereco.numero
    ? `${endereco.logradouro}, ${endereco.numero}`
    : endereco.logradouro;
  const linha2 = [endereco.bairro, endereco.cidade].filter(Boolean).join(', ');
  return linha2 ? `${linha1} — ${linha2}` : linha1;
}

function tipoDoItem(item: SeparacaoItemDetalhe): TipoItem | null {
  if (item.equipamentoId) return 'equipamentos';
  if (item.epiId) return 'epis';
  if (item.materialId) return 'materiais';
  return null;
}

function nomeDoItem(item: SeparacaoItemDetalhe, tipo: TipoItem): string {
  if (tipo === 'equipamentos')
    return item.equipamento?.descricao ?? `Equipamento #${item.equipamentoId}`;
  if (tipo === 'epis') return item.epi?.nome ?? `EPI #${item.epiId}`;
  return item.material?.nome ?? `Material #${item.materialId}`;
}

function quantidadeDoItem(item: SeparacaoItemDetalhe): number {
  const separada = Number(item.quantidadeSeparada);
  return separada > 0 ? separada : Number(item.quantidadeNecessaria);
}

function achatarItens(separacoes: SeparacaoItem[]): RegistroItem[] {
  const registros: RegistroItem[] = [];
  for (const separacao of separacoes) {
    for (const item of separacao.itens ?? []) {
      if (!STATUS_RETIRADOS.has(item.status)) continue;
      const colaborador = item.colaborador;
      if (!colaborador?.id) continue;
      const tipo = tipoDoItem(item);
      if (!tipo) continue;
      registros.push({
        separacaoId: separacao.id,
        separacaoCodigo: separacao.codigo,
        item,
        tipo,
        nome: nomeDoItem(item, tipo),
        quantidade: quantidadeDoItem(item),
        colaborador: {
          id: colaborador.id,
          nome: colaborador.nome,
          papeis: colaborador.papeis,
        },
        retiradoEm: item.retiradoEm ?? null,
        devolvidoEm: item.devolvidoEm ?? null,
      });
    }
  }
  return registros;
}

function agruparPorColaborador(
  registros: RegistroItem[],
): {
  colaborador: RegistroItem['colaborador'];
  itens: RegistroItem[];
}[] {
  const mapa = new Map<
    number,
    { colaborador: RegistroItem['colaborador']; itens: RegistroItem[] }
  >();
  for (const registro of registros) {
    const grupo = mapa.get(registro.colaborador.id);
    if (grupo) grupo.itens.push(registro);
    else
      mapa.set(registro.colaborador.id, {
        colaborador: registro.colaborador,
        itens: [registro],
      });
  }
  return [...mapa.values()].sort((a, b) =>
    a.colaborador.nome.localeCompare(b.colaborador.nome, 'pt-BR'),
  );
}

function temPerfilColaborador(
  colaborador: RegistroItem['colaborador'],
  idsFallback: Set<number>,
): boolean {
  if (colaborador.papeis?.length) {
    return colaborador.papeis.some((p) =>
      PAPEIS_COLABORADOR.has(p.papel?.nome?.trim().toUpperCase() ?? ''),
    );
  }
  return idsFallback.has(colaborador.id);
}

function itensPendentes(
  separacao: SeparacaoItem,
): SeparacaoItemDetalhe[] {
  return (separacao.itens ?? []).filter((item) =>
    STATUS_PENDENTES.has(item.status),
  );
}

function ItemStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        ITEM_STATUS_COLORS[status] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {ITEM_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function RetiradaDeItensPage({
  viewAtiva = 'lista',
  onNavegar,
}: {
  viewAtiva?: 'analises' | 'lista';
  onNavegar?: (view: 'analises' | 'lista') => void;
} = {}) {
  const [separacoes, setSeparacoes] = useState<SeparacaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroObra, setFiltroObra] = useState('');
  const [filtroColaborador, setFiltroColaborador] = useState('');
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [colaboradores, setColaboradores] = useState<
    { id: number; nome: string }[]
  >([]);
  const [retiradaPendente, setRetiradaPendente] = useState<{
    separacaoId: number;
    itemId: number;
  } | null>(null);
  const [colaboradorId, setColaboradorId] = useState('');
  const [obras, setObras] = useState<ObraSeparacao[]>([]);
  const [adicionarEm, setAdicionarEm] = useState<SeparacaoItem | null>(null);
  const [novoTipo, setNovoTipo] = useState<TipoItem>('materiais');
  const [novoItemId, setNovoItemId] = useState('');
  const [novaQuantidade, setNovaQuantidade] = useState('1');
  const [novoColaboradorId, setNovoColaboradorId] = useState('');
  const [opcoesAdicao, setOpcoesAdicao] =
    useState<Record<TipoItem, OpcaoAdicao[]>>(OPCOES_ADICAO_VAZIAS);
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(false);

  useEffect(() => {
    listarLookupsEpis()
      .then((l) => setColaboradores(l.colaboradores ?? []))
      .catch(console.error);

    api
      .get<{ obras: ObraSeparacao[] }>('/obras')
      .then((res) => setObras(res.obras ?? []))
      .catch(console.error);
  }, []);

  const carregar = useCallback(async () => {
    if (viewAtiva === 'analises') {
      setLoading(true);
      try {
        setSeparacoes(await listarSeparacoes());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!filtroObra) {
      setSeparacoes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setSeparacoes(await listarSeparacoes({ obraId: Number(filtroObra) }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filtroObra, viewAtiva]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function handleRetirarItem(separacaoId: number, itemId: number) {
    if (!colaboradorId) return;
    setErro(null);
    setProcessando(true);
    try {
      await registrarRetiradaItemSeparacao(separacaoId, itemId, {
        colaboradorId: Number(colaboradorId),
      });
      setRetiradaPendente(null);
      setColaboradorId('');
      await carregar();
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setProcessando(false);
    }
  }

  const carregarOpcoesAdicao = useCallback(async (tipo: TipoItem) => {
    setCarregandoOpcoes(true);
    try {
      const opcoes =
        tipo === 'materiais'
          ? (await listarMateriais()).map((m) => ({ id: m.id, label: m.nome }))
          : tipo === 'equipamentos'
            ? (await listarEquipamentos({ ativo: true })).map((e) => ({
                id: e.id,
                label: e.numeroPatrimonio
                  ? `${e.descricao} — Patr. ${e.numeroPatrimonio}`
                  : e.descricao,
              }))
            : (await listarEpis({ ativo: true })).map((e) => ({
                id: e.id,
                label: e.numeroPatrimonio
                  ? `${e.nome} — Patr. ${e.numeroPatrimonio}`
                  : e.nome,
              }));
      setOpcoesAdicao((prev) => ({ ...prev, [tipo]: opcoes }));
    } catch (e) {
      console.error(e);
    } finally {
      setCarregandoOpcoes(false);
    }
  }, []);

  function abrirAdicionar(separacao: SeparacaoItem) {
    setErro(null);
    setAdicionarEm(separacao);
    setNovoTipo('materiais');
    setNovoItemId('');
    setNovaQuantidade('1');
    setNovoColaboradorId('');
    if (opcoesAdicao.materiais.length === 0) {
      void carregarOpcoesAdicao('materiais');
    }
  }

  function trocarTipoAdicao(tipo: TipoItem) {
    setNovoTipo(tipo);
    setNovoItemId('');
    setNovaQuantidade('1');
    if (opcoesAdicao[tipo].length === 0) {
      void carregarOpcoesAdicao(tipo);
    }
  }

  async function handleAdicionarItem() {
    if (!adicionarEm || !novoItemId) return;
    const itemId = Number(novoItemId);
    const quantidade = Number(novaQuantidade);
    if (!Number.isFinite(quantidade) || quantidade <= 0) return;
    setErro(null);
    setProcessando(true);
    try {
      await adicionarItemSeparacao(adicionarEm.id, {
        ...(novoTipo === 'materiais'
          ? { materialId: itemId }
          : novoTipo === 'equipamentos'
            ? { equipamentoId: itemId }
            : { epiId: itemId }),
        quantidade: novoTipo === 'equipamentos' ? 1 : quantidade,
        colaboradorId: novoColaboradorId
          ? Number(novoColaboradorId)
          : undefined,
      });
      setAdicionarEm(null);
      await carregar();
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setProcessando(false);
    }
  }

  async function handleDevolverItem(separacaoId: number, itemId: number) {
    setErro(null);
    setProcessando(true);
    try {
      await registrarDevolucaoItemSeparacao(separacaoId, itemId, {
        status: 'DEVOLVIDO',
      });
      await carregar();
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setProcessando(false);
    }
  }

  async function handleConfirmar(separacaoId: number) {
    setErro(null);
    setProcessando(true);
    try {
      await confirmarSeparacao(separacaoId);
      await carregar();
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setProcessando(false);
    }
  }

  async function handleExcluir(separacaoId: number) {
    if (!confirm('Excluir esta separação?')) return;
    setErro(null);
    setProcessando(true);
    try {
      await excluirSeparacao(separacaoId);
      await carregar();
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setProcessando(false);
    }
  }

  async function handleRemoverItem(separacaoId: number, itemId: number) {
    if (!confirm('Excluir este item do planejamento?')) return;
    setErro(null);
    setProcessando(true);
    try {
      await removerItemSeparacao(separacaoId, itemId);
      await carregar();
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setProcessando(false);
    }
  }

  if (viewAtiva === 'analises') {
    return (
      <div className="p-6 space-y-6">
        <RetiradaDeItensAnalyticsDashboard separacoes={separacoes} />
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => onNavegar?.('lista')}
          >
            ← Voltar para lista de retiradas
          </Button>
        </div>
      </div>
    );
  }

  const registros = achatarItens(separacoes);
  const grupos = agruparPorColaborador(registros);
  const gruposFiltrados = filtroColaborador
    ? grupos.filter((g) => g.colaborador.id === Number(filtroColaborador))
    : grupos;
  const idsColaboradores = new Set(colaboradores.map((c) => c.id));
  const colaboradoresComRetirada = grupos
    .map((g) => g.colaborador)
    .filter((c) => temPerfilColaborador(c, idsColaboradores));
  const opcoesColaborador = colaboradores;
  const pendentes = separacoes
    .map((separacao) => ({
      separacao,
      itens: itensPendentes(separacao),
    }))
    .filter((registro) => registro.itens.length > 0);
  const totalPendentes = pendentes.reduce(
    (acc, registro) => acc + registro.itens.length,
    0,
  );

  return (
    <div className="flex flex-col h-full overflow-auto p-4 sm:p-6 space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Retirada de Itens</CardTitle>
          <CardDescription>
            Selecione a obra e o colaborador para gerenciar as retiradas e conferências.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Obra</label>
              <select
                value={filtroObra}
                onChange={(e) => {
                  setFiltroObra(e.target.value);
                  setFiltroColaborador('');
                }}
                className={selectClasses}
              >
                <option value="">Selecione uma obra...</option>
                {obras.map((o) => {
                  const endereco = formatarEnderecoObra(o.endereco);
                  return (
                    <option key={o.id} value={o.id}>
                      {o.codigo}
                      {o.user?.nome ? ` — ${o.user.nome}` : ''}
                      {endereco ? ` — ${endereco}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Colaborador</label>
              <select
                value={filtroColaborador}
                onChange={(e) => setFiltroColaborador(e.target.value)}
                className={selectClasses}
                disabled={!filtroObra}
              >
                <option value="">Todos</option>
                {opcoesColaborador.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted p-3">
                <div className="text-2xl font-bold">
                  {colaboradoresComRetirada.length}
                </div>
                <div className="text-xs text-muted-foreground">
                  Colaboradores
                </div>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="text-2xl font-bold">{registros.length}</div>
                <div className="text-xs text-muted-foreground">
                  Itens Retirados
                </div>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="text-2xl font-bold">{totalPendentes}</div>
                <div className="text-xs text-muted-foreground">
                  Aguardando Retirada
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <main className="space-y-6">
        {erro && retiradaPendente === null && adicionarEm === null && (
          <div className="flex items-start justify-between gap-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <span>{erro}</span>
            <button
              type="button"
              className="shrink-0 font-medium underline"
              onClick={() => setErro(null)}
            >
              Fechar
            </button>
          </div>
        )}
        {!filtroObra ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">
              Selecione uma obra para visualizar as retiradas
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Carregando...</div>
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Itens retirados por colaborador
              </h3>
              {gruposFiltrados.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Nenhum item retirado nesta obra
                </div>
              ) : (
                <div className="grid gap-3">
                  {gruposFiltrados.map((grupo) => (
                    <ColaboradorCard
                      key={grupo.colaborador.id}
                      colaborador={grupo.colaborador}
                      itens={grupo.itens}
                      processando={processando}
                      onDevolver={handleDevolverItem}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Aguardando retirada
              </h3>
              {pendentes.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Nenhum item aguardando retirada
                </div>
              ) : (
                <div className="grid gap-3">
                  {pendentes.map(({ separacao, itens }) => (
                    <SeparacaoPendenteCard
                      key={separacao.id}
                      separacao={separacao}
                      itens={itens}
                      processando={processando}
                      onRetirar={(itemId) =>
                        setRetiradaPendente({
                          separacaoId: separacao.id,
                          itemId,
                        })
                      }
                      onConfirmar={handleConfirmar}
                      onExcluir={handleExcluir}
                      onAdicionar={abrirAdicionar}
                      onRemoverItem={handleRemoverItem}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {retiradaPendente !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-base">Registrar Retirada</CardTitle>
              <CardDescription>
                Selecione o colaborador que está retirando o item.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                value={colaboradorId}
                onChange={(e) => setColaboradorId(e.target.value)}
                className={selectClasses}
              >
                <option value="">Selecione o colaborador...</option>
                {colaboradores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              {erro && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {erro}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setRetiradaPendente(null);
                    setColaboradorId('');
                    setErro(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  disabled={processando || !colaboradorId}
                  onClick={() =>
                    handleRetirarItem(
                      retiradaPendente.separacaoId,
                      retiradaPendente.itemId,
                    )
                  }
                >
                  Confirmar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {adicionarEm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-base">Adicionar item</CardTitle>
              <CardDescription>
                Incluir item extra na separação {adicionarEm.codigo}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <select
                  value={novoTipo}
                  onChange={(e) => trocarTipoAdicao(e.target.value as TipoItem)}
                  className={selectClasses}
                >
                  {TIPOS_ITEM.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {TIPO_LABELS[tipo]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Item</label>
                <select
                  value={novoItemId}
                  onChange={(e) => setNovoItemId(e.target.value)}
                  className={selectClasses}
                  disabled={carregandoOpcoes}
                >
                  <option value="">
                    {carregandoOpcoes
                      ? 'Carregando...'
                      : `Selecione ${TIPO_LABELS[novoTipo].toLowerCase()}...`}
                  </option>
                  {opcoesAdicao[novoTipo].map((opcao) => (
                    <option key={opcao.id} value={opcao.id}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quantidade</label>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={novoTipo === 'equipamentos' ? '1' : novaQuantidade}
                  onChange={(e) => setNovaQuantidade(e.target.value)}
                  className={selectClasses}
                  disabled={novoTipo === 'equipamentos'}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Colaborador</label>
                <select
                  value={novoColaboradorId}
                  onChange={(e) => setNovoColaboradorId(e.target.value)}
                  className={selectClasses}
                >
                  <option value="">Deixar pendente (sem colaborador)</option>
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>
                      Retirar agora — {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              {erro && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {erro}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAdicionarEm(null);
                    setErro(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  disabled={
                    processando ||
                    !novoItemId ||
                    (novoTipo !== 'equipamentos' &&
                      !(Number(novaQuantidade) > 0))
                  }
                  onClick={handleAdicionarItem}
                >
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function ColaboradorCard({
  colaborador,
  itens,
  processando,
  onDevolver,
}: {
  colaborador: { id: number; nome: string };
  itens: RegistroItem[];
  processando: boolean;
  onDevolver: (separacaoId: number, itemId: number) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{colaborador.nome}</CardTitle>
          <span className="text-xs text-muted-foreground">
            {itens.length} {itens.length === 1 ? 'item' : 'itens'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {TIPOS_ITEM.map((tipo) => {
          const registros = itens.filter((registro) => registro.tipo === tipo);
          if (registros.length === 0) return null;
          return (
            <div key={tipo} className="space-y-1.5">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {TIPO_LABELS[tipo]}
              </div>
              <div className="grid gap-1.5">
                {registros.map((registro) => (
                  <div
                    key={registro.item.id}
                    className="flex items-center gap-3 rounded-lg border p-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {registro.nome}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Qtd: {registro.quantidade} • Retirado em{' '}
                        {formatarDataHora(registro.retiradoEm)}
                        {registro.devolvidoEm
                          ? ` • Devolvido em ${formatarDataHora(registro.devolvidoEm)}`
                          : ''}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {registro.separacaoCodigo}
                      </div>
                    </div>
                    <ItemStatusBadge status={registro.item.status} />
                    {registro.item.status === 'RETIRADO' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={processando}
                        onClick={() =>
                          onDevolver(registro.separacaoId, registro.item.id)
                        }
                      >
                        Devolver
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function SeparacaoPendenteCard({
  separacao,
  itens,
  processando,
  onRetirar,
  onConfirmar,
  onExcluir,
  onAdicionar,
  onRemoverItem,
}: {
  separacao: SeparacaoItem;
  itens: SeparacaoItemDetalhe[];
  processando: boolean;
  onRetirar: (itemId: number) => void;
  onConfirmar: (separacaoId: number) => void;
  onExcluir: (separacaoId: number) => void;
  onAdicionar: (separacao: SeparacaoItem) => void;
  onRemoverItem: (separacaoId: number, itemId: number) => void;
}) {
  const status = separacao.statusNovo ?? separacao.status;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{separacao.codigo}</CardTitle>
            <CardDescription>
              {itens.length} {itens.length === 1 ? 'item' : 'itens'}
              {separacao.dataNecessidade
                ? ` • Necessário até ${formatarData(separacao.dataNecessidade)}`
                : ''}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                STATUS_COLORS[status] ?? 'bg-muted text-muted-foreground',
              )}
            >
              {STATUS_LABELS[status] ?? status}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={processando}
              onClick={() => onAdicionar(separacao)}
            >
              Adicionar item
            </Button>
            {status === 'SEPARACAO_PENDENTE' && (
              <>
                <Button
                  size="sm"
                  disabled={processando}
                  onClick={() => onConfirmar(separacao.id)}
                >
                  Confirmar Separação
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={processando}
                  onClick={() => onExcluir(separacao.id)}
                >
                  Excluir
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {itens.map((item) => {
          const tipo = tipoDoItem(item);
          const nome = tipo
            ? nomeDoItem(item, tipo)
            : item.descricaoItem ?? 'Item';
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg border p-2.5"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{nome}</div>
                <div className="text-xs text-muted-foreground">
                  {tipo ? `${TIPO_LABELS[tipo]} • ` : ''}
                  Qtd: {quantidadeDoItem(item)}
                </div>
              </div>
              <ItemStatusBadge status={item.status} />
              {item.status === 'PENDENTE' && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={processando}
                  onClick={() => onRetirar(item.id)}
                >
                  Retirar
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                disabled={processando}
                onClick={() => onRemoverItem(separacao.id, item.id)}
              >
                Excluir
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
