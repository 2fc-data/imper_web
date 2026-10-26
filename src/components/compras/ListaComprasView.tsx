import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  aprovarListaCompras,
  comprarItemListaCompras,
  enviarListaCompras,
  listarEquipamentos,
  listarEpis,
  listarMateriais,
  obterListaCompras,
  recusarItemListaCompras,
  recusarListaCompras,
  reverterItemListaCompras,
  salvarItensListaCompras,
  type ListaCompraDto,
  type ListaCompraItemDto,
  type OpcaoCatalogo,
} from '../../lib/api';
import { gerarPdfListaCompras } from '../../lib/export/lista-compras-pdf';
import { brl } from '../../lib/format';
import {
  estaComprada,
  MESES_CURTOS,
  modoDaLista,
  nomeItem,
  podeAprovar,
  podeComprar,
  podeEditarItens,
  podeEnviar,
  progressoCompras,
  saldoItem,
  subtituloItem,
  totalEstimado,
  totalGasto,
  unidadeItem,
} from '../../lib/lista-compras';
import type { SetorCompra, StatusListaCompra, TipoListaCompra } from '../../schemas';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { StatusBadge } from '../ui/StatusBadge';

type RascunhoItem = { itemId: number; quantidade: number };

const SETORES: { valor: SetorCompra; rotulo: string }[] = [
  { valor: 'LOJA', rotulo: 'Loja' },
  { valor: 'ALMOXARIFADO', rotulo: 'Almoxarifado' },
];

const ROTULOS_STATUS: Record<StatusListaCompra, string> = {
  ABERTA: 'Aberta',
  ENVIADA: 'Aguardando Aprovação',
  APROVADA: 'Aprovada',
  RECUSADA: 'Recusada',
  COMPRADA: 'Comprada',
};

const selectClasses =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

function mensagemErro(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  return 'Erro inesperado. Tente novamente.';
}

function fmtQtd(v: number | string): string {
  return Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

function idDaEntidade(item: ListaCompraItemDto): number {
  return item.material?.id ?? item.epi?.id ?? item.equipamento?.id ?? 0;
}

function itensParaRascunho(lista: ListaCompraDto | null): RascunhoItem[] {
  if (!lista) return [];
  return lista.itens
    .map((item) => ({
      itemId: idDaEntidade(item),
      quantidade: Number(item.quantidade),
    }))
    .filter((r) => r.itemId > 0 && r.quantidade > 0);
}

async function carregarCatalogo(tipo: TipoListaCompra): Promise<OpcaoCatalogo[]> {
  if (tipo === 'DESPESAS_EXTRAS' || tipo === 'MATERIAL') {
    const materiais = await listarMateriais({ tipo });
    return materiais
      .filter((m) => m.status === 'ATIVO')
      .map((m) => ({
        id: m.id,
        nome: m.nome,
        unidade: m.unidade?.nome ?? null,
        saldo: m.saldo?.saldo ?? null,
        custoUnitario: m.custoUnitario ?? null,
      }));
  }
  if (tipo === 'EPI') {
    const epis = await listarEpis({ ativo: true });
    return epis
      .filter((e) => e.ativo)
      .map((e) => ({
        id: e.id,
        nome: e.nome,
        unidade: e.unidadeMedida?.nome ?? null,
        saldo: e.quantidade,
        custoUnitario: e.custoUnitario ?? null,
      }));
  }
  const equipamentos = await listarEquipamentos({ ativo: true });
  return equipamentos
    .filter((e) => e.ativo)
    .map((e) => ({
      id: e.id,
      nome: e.descricao,
      unidade: e.unidadeMedida?.nome ?? null,
      saldo: null,
      custoUnitario: e.valorAquisicao,
    }));
}

export function ListaComprasView({
  tipo,
  titulo,
}: {
  tipo: TipoListaCompra;
  titulo: string;
}) {
  const { user } = useAuth();
  const podeCriar = user?.permissoes.includes('criar_lista_compras') ?? false;
  const podeAprovarPerm = user?.permissoes.includes('aprovar_lista_compras') ?? false;

  const [ano, setAno] = useState(() => new Date().getFullYear());
  const [mesAtual, setMesAtual] = useState(() => new Date().getMonth() + 1);
  const [setor, setSetor] = useState<SetorCompra>('LOJA');

  const [lista, setLista] = useState<ListaCompraDto | null>(null);
  const [opcoes, setOpcoes] = useState<OpcaoCatalogo[]>([]);
  const [rascunho, setRascunho] = useState<RascunhoItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [selItemId, setSelItemId] = useState<number | ''>('');
  const [selQtd, setSelQtd] = useState('1');
  const [novoItemAberto, setNovoItemAberto] = useState(false);
  const [novoItemId, setNovoItemId] = useState<number | ''>('');
  const [novoItemQtd, setNovoItemQtd] = useState('1');

  const modo = modoDaLista(lista?.status ?? null);
  const ehMaterial = tipo === 'MATERIAL' || tipo === 'DESPESAS_EXTRAS';

  const carregamentoRef = useRef(0);
  const carregarLista = useCallback(async () => {
    const id = ++carregamentoRef.current;
    const resposta = await obterListaCompras({ tipo, setor, mes: mesAtual, ano });
    if (id !== carregamentoRef.current) return;
    const nova = resposta ?? null;
    setLista(nova);
    setRascunho(itensParaRascunho(nova));
  }, [tipo, setor, mesAtual, ano]);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);
    carregarLista()
      .then(() => {
        if (!cancelado) setCarregando(false);
      })
      .catch((e: unknown) => {
        if (!cancelado) {
          setErro(mensagemErro(e));
          setCarregando(false);
        }
      });
    return () => {
      cancelado = true;
    };
  }, [carregarLista]);

  useEffect(() => {
    let cancelado = false;
    carregarCatalogo(tipo)
      .then((ops) => {
        if (!cancelado) {
          setOpcoes(ops);
          setSelItemId('');
        }
      })
      .catch((e: unknown) => {
        if (!cancelado) setErro(mensagemErro(e));
      });
    return () => {
      cancelado = true;
    };
  }, [tipo]);

  const recarregarSilencioso = useCallback(async () => {
    try {
      await carregarLista();
      setErro(null);
    } catch (e) {
      setErro(mensagemErro(e));
    }
  }, [carregarLista]);

  const executar = useCallback(
    async (acao: () => Promise<unknown>): Promise<boolean> => {
      setOcupado(true);
      setErro(null);
      try {
        await acao();
        await recarregarSilencioso();
        return true;
      } catch (e) {
        setErro(mensagemErro(e));
        return false;
      } finally {
        setOcupado(false);
      }
    },
    [recarregarSilencioso],
  );

  const nomesRascunho = useMemo(() => {
    const mapa = new Map<number, string>();
    for (const op of opcoes) mapa.set(op.id, op.nome);
    for (const item of lista?.itens ?? []) mapa.set(idDaEntidade(item), nomeItem(item));
    return mapa;
  }, [lista, opcoes]);

  const estimado = useMemo(
    () => (lista ? totalEstimado(lista.itens) : null),
    [lista],
  );
  const gasto = useMemo(
    () => (lista ? totalGasto(lista.itens) : 0),
    [lista],
  );
  const temCustoReal = useMemo(
    () =>
      lista?.itens.some((i) => i.custoReal !== null && i.custoReal !== undefined) ??
      false,
    [lista],
  );
  const progresso = useMemo(
    () => progressoCompras(lista?.itens ?? []),
    [lista],
  );

  const rotuloSetor = SETORES.find((s) => s.valor === setor)?.rotulo ?? setor;

  function adicionarAoRascunho() {
    if (selItemId === '') return;
    const qtd = Number(selQtd);
    if (!Number.isFinite(qtd) || qtd <= 0) {
      setErro('Quantidade inválida.');
      return;
    }
    setRascunho((atual) => {
      const existente = atual.find((r) => r.itemId === selItemId);
      if (existente) {
        return atual.map((r) =>
          r.itemId === selItemId
            ? { ...r, quantidade: r.quantidade + qtd }
            : r,
        );
      }
      return [...atual, { itemId: selItemId, quantidade: qtd }];
    });
    setSelItemId('');
    setSelQtd('1');
    setErro(null);
  }

  async function salvarRascunho() {
    await executar(() =>
      salvarItensListaCompras(tipo, setor, mesAtual, ano, rascunho),
    );
  }

  async function enviar() {
    if (!lista) return;
    await executar(() => enviarListaCompras(lista.id));
  }

  async function criarListaMes() {
    await executar(() => salvarItensListaCompras(tipo, setor, mesAtual, ano, []));
  }

  async function aprovar() {
    if (!lista) return;
    await executar(() => aprovarListaCompras(lista.id));
  }

  async function recusar() {
    if (!lista) return;
    const motivo = window.prompt('Motivo da recusa:');
    if (motivo === null) return;
    const limpo = motivo.trim();
    if (!limpo) {
      setErro('Informe o motivo da recusa.');
      return;
    }
    await executar(() => recusarListaCompras(lista.id, limpo));
  }

  async function recusarItem(itemId: number) {
    if (!lista) return;
    await executar(() => recusarItemListaCompras(lista.id, itemId));
  }

  async function reverterItem(itemId: number) {
    if (!lista) return;
    await executar(() => reverterItemListaCompras(lista.id, itemId));
  }

  async function adicionarItemNaAprovacao() {
    if (!lista || novoItemId === '') return;
    const qtd = Number(novoItemQtd);
    if (!Number.isFinite(qtd) || qtd <= 0) {
      setErro('Quantidade inválida.');
      return;
    }
    const existentes = itensParaRascunho(lista);
    const mesclados = (() => {
      const base = existentes.filter((r) => r.itemId !== novoItemId);
      const atual = existentes.find((r) => r.itemId === novoItemId);
      return [
        ...base,
        { itemId: novoItemId, quantidade: (atual?.quantidade ?? 0) + qtd },
      ];
    })();
    const salvo = await executar(() =>
      salvarItensListaCompras(tipo, setor, mesAtual, ano, mesclados),
    );
    if (salvo) {
      setNovoItemAberto(false);
      setNovoItemId('');
      setNovoItemQtd('1');
    }
  }

  async function comprar(item: ListaCompraItemDto) {
    if (!lista) return;
    if (!window.confirm(`Confirmar compra de "${nomeItem(item)}"?`)) return;
    const bruto = window.prompt('Custo real (deixe vazio se não souber):');
    let custoReal: number | undefined;
    if (bruto !== null && bruto.trim() !== '') {
      const n = Number(bruto.trim().replace(',', '.'));
      if (!Number.isFinite(n) || n <= 0) {
        setErro(`Custo real inválido: "${bruto.trim()}".`);
        return;
      }
      custoReal = n;
    }
    await executar(() => comprarItemListaCompras(lista.id, item.id, custoReal));
  }

  function tabelaItens() {
    if (!lista) return null;
    if (lista.itens.length === 0) {
      return <p className="text-sm text-muted-foreground">Nenhum item na lista.</p>;
    }
    const mostrarDetalhesMaterial = ehMaterial;
    const mostrarCustoReal = modo === 'compra' || modo === 'historico';
    const mostrarAcoes = modo === 'aprovacao' || modo === 'compra';
    const acaoAprovacao = podeAprovarPerm && podeAprovar(modo);
    const acaoCompra = podeAprovarPerm && podeComprar(modo);

    return (
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2">Item</th>
              {mostrarDetalhesMaterial && <th className="px-3 py-2">Un.</th>}
              {mostrarDetalhesMaterial && (
                <th className="px-3 py-2 text-right">Saldo</th>
              )}
              {mostrarDetalhesMaterial && (
                <th className="px-3 py-2 text-right">Custo unit.</th>
              )}
              <th className="px-3 py-2 text-right">Qtd</th>
              {mostrarCustoReal && (
                <th className="px-3 py-2 text-right">Custo real</th>
              )}
              <th className="px-3 py-2">Status</th>
              {mostrarAcoes && <th className="px-3 py-2 text-right">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {lista.itens.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="px-3 py-2">
                  <span className="font-medium">{nomeItem(item)}</span>
                  {(tipo === 'EPI' || tipo === 'EQUIPAMENTO') && (
                    <span className="block text-xs text-muted-foreground">
                      {subtituloItem(item, tipo)}
                    </span>
                  )}
                </td>
                {mostrarDetalhesMaterial && (
                  <td className="px-3 py-2">{unidadeItem(item)}</td>
                )}
                {mostrarDetalhesMaterial && (
                  <td className="px-3 py-2 text-right">
                    {saldoItem(item) ?? '—'}
                  </td>
                )}
                {mostrarDetalhesMaterial && (
                  <td className="px-3 py-2 text-right">
                    {item.material?.custoUnitario != null
                      ? brl(item.material.custoUnitario)
                      : '—'}
                  </td>
                )}
                <td className="px-3 py-2 text-right">{fmtQtd(item.quantidade)}</td>
                {mostrarCustoReal && (
                  <td className="px-3 py-2 text-right">
                    {item.custoReal != null ? brl(item.custoReal) : '—'}
                  </td>
                )}
                <td className="px-3 py-2">
                  <StatusBadge status={item.status} size="sm" />
                </td>
                {mostrarAcoes && (
                  <td className="px-3 py-2 text-right">
                    {modo === 'aprovacao' && item.status === 'PENDENTE' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={ocupado || !acaoAprovacao}
                        onClick={() => recusarItem(item.id)}
                      >
                        Recusar item
                      </Button>
                    )}
                    {modo === 'aprovacao' && item.status === 'RECUSADO' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={ocupado || !acaoAprovacao}
                        onClick={() => reverterItem(item.id)}
                      >
                        Reverter
                      </Button>
                    )}
                    {modo === 'compra' && item.status !== 'COMPRADO' && (
                      <Button
                        size="sm"
                        disabled={ocupado || !acaoCompra}
                        onClick={() => comprar(item)}
                      >
                        Comprar
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function conteudoEdicao() {
    return (
      <>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-56 flex-1 space-y-1.5">
            <Label htmlFor="item-catalogo">Item do catálogo</Label>
            <select
              id="item-catalogo"
              value={selItemId === '' ? '' : String(selItemId)}
              onChange={(e) =>
                setSelItemId(
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
              className={selectClasses}
            >
              <option value="">Selecione um item...</option>
              {opcoes.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.nome}
                  {op.unidade ? ` (${op.unidade})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="w-24 space-y-1.5">
            <Label htmlFor="item-qtd">Qtd</Label>
            <Input
              id="item-qtd"
              type="number"
              min="0.001"
              step="any"
              value={selQtd}
              onChange={(e) => setSelQtd(e.target.value)}
            />
          </div>
          <Button
            onClick={adicionarAoRascunho}
            disabled={ocupado || !podeCriar || selItemId === ''}
          >
            Adicionar
          </Button>
        </div>

        {rascunho.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum item no rascunho.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2 text-right">Qtd</th>
                  <th className="px-3 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rascunho.map((r) => (
                  <tr key={r.itemId} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">
                      {nomesRascunho.get(r.itemId) ?? `#${r.itemId}`}
                    </td>
                    <td className="px-3 py-2 text-right">{fmtQtd(r.quantidade)}</td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={ocupado || !podeCriar}
                        onClick={() =>
                          setRascunho((atual) =>
                            atual.filter((x) => x.itemId !== r.itemId),
                          )
                        }
                      >
                        Remover
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={salvarRascunho} disabled={ocupado || !podeCriar}>
            Salvar
          </Button>
          <Button
            variant="secondary"
            onClick={enviar}
            disabled={
              ocupado ||
              !podeCriar ||
              !lista ||
              !podeEnviar(modo) ||
              rascunho.length === 0
            }
          >
            Enviar para aprovação
          </Button>
        </div>
      </>
    );
  }

  function conteudoAprovacao() {
    const acao = podeAprovarPerm && podeAprovar(modo);
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            {lista?.itens.length ?? 0} item(ns)
          </span>
          <div className="flex flex-wrap gap-2">
            <Button onClick={aprovar} disabled={ocupado || !acao || !lista}>
              Aprovar
            </Button>
            <Button
              variant="destructive"
              onClick={recusar}
              disabled={ocupado || !acao || !lista}
            >
              Recusar
            </Button>
          </div>
        </div>

        {tabelaItens()}

        {podeCriar && (!novoItemAberto ? (
          <button
            type="button"
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            onClick={() => setNovoItemAberto(true)}
          >
            + novo item
          </button>
        ) : (
          <div className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
            <div className="min-w-56 flex-1 space-y-1.5">
              <Label htmlFor="novo-item-cat">Item do catálogo</Label>
              <select
                id="novo-item-cat"
                value={novoItemId === '' ? '' : String(novoItemId)}
                onChange={(e) =>
                  setNovoItemId(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
                className={selectClasses}
              >
                <option value="">Selecione um item...</option>
                {opcoes.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.nome}
                    {op.unidade ? ` (${op.unidade})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24 space-y-1.5">
              <Label htmlFor="novo-item-qtd">Qtd</Label>
              <Input
                id="novo-item-qtd"
                type="number"
                min="0.001"
                step="any"
                value={novoItemQtd}
                onChange={(e) => setNovoItemQtd(e.target.value)}
              />
            </div>
            <Button
              onClick={adicionarItemNaAprovacao}
              disabled={ocupado || !podeCriar || !podeAprovar(modo) || novoItemId === ''}
            >
              Adicionar
            </Button>
            <Button variant="ghost" onClick={() => setNovoItemAberto(false)}>
              Cancelar
            </Button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
          <p className="text-sm text-muted-foreground">
            {rotuloSetor} · {MESES_CURTOS[mesAtual - 1]}/{ano}
          </p>
        </div>
        {modo === 'historico' && lista && estaComprada(lista) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => gerarPdfListaCompras(lista, titulo)}
          >
            Baixar PDF
          </Button>
        )}
      </header>

      {erro && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erro}
        </p>
      )}

      <div className="flex flex-wrap gap-1">
        {SETORES.map((s) => (
          <button
            key={s.valor}
            type="button"
            disabled={ocupado}
            onClick={() => setSetor(s.valor)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              setor === s.valor
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            {s.rotulo}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={ocupado}
            onClick={() => setAno((a) => Math.min(2100, Math.max(2020, a - 1)))}
            aria-label="Ano anterior"
          >
            −
          </Button>
          <span className="w-14 text-center text-sm font-semibold">{ano}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={ocupado}
            onClick={() => setAno((a) => Math.min(2100, Math.max(2020, a + 1)))}
            aria-label="Próximo ano"
          >
            +
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {MESES_CURTOS.map((nome, i) => {
            const numero = i + 1;
            return (
              <button
                key={nome}
                type="button"
                disabled={ocupado}
                onClick={() => setMesAtual(numero)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  mesAtual === numero
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                {nome}
              </button>
            );
          })}
        </div>
      </div>

      {carregando ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Carregando...
        </p>
      ) : !lista ? (
        <div className="space-y-3 rounded-lg border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma lista para este mês</p>
          {podeCriar && podeEditarItens(modo) && (
            <Button onClick={criarListaMes} disabled={ocupado}>
              Criar lista do mês
            </Button>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Itens da lista</CardTitle>
                <StatusBadge
                  status={lista.status}
                  labelOverride={ROTULOS_STATUS[lista.status]}
                  size="sm"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {estimado !== null && (
                  <span>
                    Estimado:{' '}
                    <strong className="text-foreground">{brl(estimado)}</strong>
                  </span>
                )}
                {temCustoReal && (
                  <span>
                    Gasto:{' '}
                    <strong className="text-foreground">{brl(gasto)}</strong>
                  </span>
                )}
                {modo === 'compra' && (
                  <span>
                    Progresso:{' '}
                    <strong className="text-foreground">
                      {progresso.comprados}/{progresso.total}
                    </strong>
                  </span>
                )}
              </div>
            </div>
            {lista.status === 'RECUSADA' && lista.motivoRecusa && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Motivo da recusa: {lista.motivoRecusa}
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {modo === 'edicao' && conteudoEdicao()}
            {modo === 'aprovacao' && conteudoAprovacao()}
            {(modo === 'compra' || modo === 'historico') && tabelaItens()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ListaComprasView;
