import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  aprovarListaCompras,
  catalogos,
  enviarListaCompras,
  listarEquipamentos,
  listarEpis,
  listarMateriais,
  listarRodadasListaCompras,
  listarTiposDespesas,
  obterListaCompras,
  obterListaComprasPorId,
  recusarItemListaCompras,
  recusarListaCompras,
  reverterItemListaCompras,
  comprarItemListaCompras,
  conferirItemListaCompras,
  desfazerConferenciaItemListaCompras,
  salvarItensListaCompras,
  type ListaCompraDto,
  type ListaCompraItemDto,
  type OpcaoCatalogo,
  type RodadaResumoDto,
} from '../../lib/api';
import { gerarPdfListaCompras } from '../../lib/export/lista-compras-pdf';
import { brl } from '../../lib/format';
import {
  dataCompraItem,
  formatarData,
  fornecedorItem,
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
  valorTotalItem,
  valorUnitarioItem,
} from '../../lib/lista-compras';
import type { SetorCompra, StatusListaCompra, TipoListaCompra } from '../../schemas';
import { type TipoDespesa } from '../../lib/api';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { InputMoeda } from '../ui/input-moeda';
import { Label } from '../ui/label';
import { StatusBadge } from '../ui/StatusBadge';
import { selectCompactClasses as selectClasses } from '../ui/form-classes';

type RascunhoItem = {
  itemId: number;
  quantidade: number;
  fornecedorId: number | null;
  valorUnitario: number | null;
  dataCompra: string | null;
};

type EdicaoCompra = {
  fornecedorId: string;
  valorUnitario: string;
  dataCompra: string;
};

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

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
      fornecedorId: item.fornecedorId ?? fornecedorItem(item)?.id ?? null,
      valorUnitario: valorUnitarioItem(item),
      dataCompra: dataCompraItem(item),
    }))
    .filter((r) => r.itemId > 0 && r.quantidade > 0);
}

function normalizarRotulo(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function carregarCatalogo(tipo: TipoListaCompra): Promise<OpcaoCatalogo[]> {
  let itens: any[];
  if (tipo === 'DESPESAS_EXTRAS' || tipo === 'MATERIAL') {
    itens = await listarMateriais({ tipo });
  } else if (tipo === 'EPI') {
    itens = await listarEpis({ ativo: true });
  } else {
    itens = await listarEquipamentos({ ativo: true });
  }
  const filtrados = itens.filter((item) => {
    if (tipo === 'EPI' || tipo === 'EQUIPAMENTO') return item.ativo;
    return item.status === 'ATIVO';
  });

  if (tipo === 'EQUIPAMENTO') {
    // Equipamentos têm `descricao` (não `nome`) e vários registros podem
    // compartilhar a mesma descrição. Exibe o nome uma única vez por descrição.
    const vistosId = new Set<number>();
    const vistosNome = new Set<string>();
    const opcoes: OpcaoCatalogo[] = [];
    for (const e of filtrados) {
      if (vistosId.has(e.id)) continue;
      vistosId.add(e.id);
      const descricao = String(e.descricao ?? '').trim();
      if (!descricao) continue;
      const chave = normalizarRotulo(descricao);
      if (vistosNome.has(chave)) continue;
      vistosNome.add(chave);
      opcoes.push({
        id: e.id,
        nome: descricao,
        unidade: null,
        saldo: null,
        custoUnitario: null,
        fornecedorId: e.fornecedorId ?? null,
      });
    }
    return opcoes;
  }

  const mapItem = tipo === 'EPI'
    ? (e: any) => ({
        id: e.id,
        nome: e.nome,
        unidade: e.unidadeMedida?.nome ?? null,
        saldo: e.quantidade,
        custoUnitario: e.custoUnitario ?? null,
        fornecedorId: e.fornecedorId ?? null,
        numeroPatrimonio: e.numeroPatrimonio ?? null,
      })
    : (m: any) => ({
        id: m.id,
        nome: m.nome,
        unidade: m.unidade?.nome ?? null,
        saldo: m.saldo?.saldo ?? null,
        custoUnitario: m.custoUnitario ?? null,
        fornecedorId: m.fornecedorId ?? null,
      });
  const maped = filtrados.map(mapItem);
  // Remove duplicates by id, keeping first occurrence
  const seen = new Set<number>();
  return maped.filter((op) => {
    if (seen.has(op.id)) return false;
    seen.add(op.id);
    return true;
  });
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

  const [fornecedores, setFornecedores] = useState<
    { id: number; nome: string }[]
  >([]);
  const [compras, setCompras] = useState<Record<number, EdicaoCompra>>({});

  const [selItemId, setSelItemId] = useState<number | ''>('');
  const [selQtd, setSelQtd] = useState('1');
  const [selFornecedorId, setSelFornecedorId] = useState<number | ''>('');
  const [selValorUnitario, setSelValorUnitario] = useState('');
  const [selDataCompra, setSelDataCompra] = useState(hoje);
  const [novoItemAberto, setNovoItemAberto] = useState(false);
  const [tipoDespesaId, setTipoDespesaId] = useState<number | ''>('');
  const [tiposDespesas, setTiposDespesas] = useState<TipoDespesa[]>([]);
  
  // Load expense types when component mounts
  useEffect(() => {
    listarTiposDespesas()
      .then(setTiposDespesas)
      .catch(() => {});
  }, []);

  const [novoItemId, setNovoItemId] = useState<number | ''>('');
  const [novoItemQtd, setNovoItemQtd] = useState('1');
  const [novoItemFornecedorId, setNovoItemFornecedorId] = useState<number | ''>('');
  const [novoItemValor, setNovoItemValor] = useState('');
  const [novoItemData, setNovoItemData] = useState(hoje);

  const modo = modoDaLista(lista?.status ?? null);
  const ehMaterial = tipo === 'MATERIAL' || tipo === 'DESPESAS_EXTRAS';

  const [rodadas, setRodadas] = useState<RodadaResumoDto[]>([]);
  const chaveRodadas = `${tipo}|${setor}|${mesAtual}|${ano}|${tipoDespesaId}`;
  const [selecaoRodada, setSelecaoRodada] = useState<{
    chave: string;
    id: number;
  } | null>(null);
  const rodadaSelecionadaId =
    selecaoRodada?.chave === chaveRodadas ? selecaoRodada.id : null;

  const carregamentoRef = useRef(0);
  const carregarLista = useCallback(async () => {
    if (tipo === 'DESPESAS_EXTRAS' && tipoDespesaId === '') {
      setLista(null);
      setRascunho([]);
      setRodadas([]);
      return;
    }
    const id = ++carregamentoRef.current;
    const chave = {
      tipo,
      setor,
      mes: mesAtual,
      ano,
      tipoDespesaId: tipoDespesaId === '' ? undefined : tipoDespesaId,
    };
    const [respostaRodadas, respostaLista] = await Promise.all([
      listarRodadasListaCompras(chave),
      rodadaSelecionadaId !== null
        ? obterListaComprasPorId(rodadaSelecionadaId)
        : obterListaCompras(chave),
    ]);
    if (id !== carregamentoRef.current) return;
    setRodadas(respostaRodadas);
    const nova = respostaLista ?? null;
    setLista(nova);
    setRascunho(itensParaRascunho(nova));
  }, [tipo, setor, mesAtual, ano, tipoDespesaId, rodadaSelecionadaId]);

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

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      const doTipo = await catalogos.fornecedoresApi.listar(tipo);
      let ativos = doTipo.filter((f) => f.ativo);
      if (ativos.length === 0) {
        const todos = await catalogos.fornecedoresApi.listar();
        ativos = todos.filter((f) => f.ativo);
      }
      if (cancelado) return;
      setFornecedores(ativos.map((f) => ({ id: f.id, nome: f.nome })));
    }
    carregar().catch((e: unknown) => {
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

  function selecionarItemDoCatalogo(valor: number | '') {
    setSelItemId(valor);
    const op = opcoes.find((o) => o.id === valor);
    setSelFornecedorId(op?.fornecedorId ?? '');
    setSelValorUnitario(op?.custoUnitario != null ? String(op.custoUnitario) : '');
    setSelDataCompra(hoje());
  }

  function numero(valor: string): number | null {
    const limpo = valor.trim().replace(',', '.');
    if (!limpo) return null;
    const n = Number(limpo);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  function adicionarAoRascunho() {
    if (selItemId === '') return;
    const qtd = Number(selQtd);
    if (!Number.isFinite(qtd) || qtd <= 0) {
      setErro('Quantidade inválida.');
      return;
    }
    const fornecedorId = selFornecedorId === '' ? null : selFornecedorId;
    const valorUnitario = numero(selValorUnitario);
    const dataCompra = selDataCompra || null;
    setRascunho((atual) => {
      const existente = atual.find((r) => r.itemId === selItemId);
      if (existente) {
        return atual.map((r) =>
          r.itemId === selItemId
            ? {
                ...r,
                quantidade: r.quantidade + qtd,
                fornecedorId,
                valorUnitario,
                dataCompra,
              }
            : r,
        );
      }
      return [
        ...atual,
        { itemId: selItemId, quantidade: qtd, fornecedorId, valorUnitario, dataCompra },
      ];
    });
    setSelItemId('');
    setSelQtd('1');
    setSelFornecedorId('');
    setSelValorUnitario('');
    setSelDataCompra(hoje());
    setErro(null);
  }

  function atualizarRascunho(itemId: number, patch: Partial<RascunhoItem>) {
    setRascunho((atual) =>
      atual.map((r) => (r.itemId === itemId ? { ...r, ...patch } : r)),
    );
  }

  function edicaoCompra(item: ListaCompraItemDto): EdicaoCompra {
    return (
      compras[item.id] ?? {
        fornecedorId: String(
          item.fornecedorId ?? fornecedorItem(item)?.id ?? '',
        ),
        valorUnitario:
          item.valorUnitario != null
            ? String(item.valorUnitario)
            : valorUnitarioItem(item) != null
              ? String(valorUnitarioItem(item))
              : '',
        dataCompra: (item.dataCompra ?? hoje()).slice(0, 10),
      }
    );
  }

  function atualizarCompra(itemId: number, patch: Partial<EdicaoCompra>) {
    setCompras((atual) => ({
      ...atual,
      [itemId]: { ...edicaoCompraById(itemId), ...patch },
    }));
  }

  function edicaoCompraById(itemId: number): EdicaoCompra {
    const item = lista?.itens.find((i) => i.id === itemId);
    if (!item) return { fornecedorId: '', valorUnitario: '', dataCompra: hoje() };
    return edicaoCompra(item);
  }

  async function salvarRascunho() {
    await executar(() =>
      salvarItensListaCompras(
        tipo,
        setor,
        mesAtual,
        ano,
        rascunho,
        tipoDespesaId === '' ? (lista?.tipoDespesaId ?? undefined) : tipoDespesaId,
      ),
    );
  }

  async function enviar() {
    if (!lista) return;
    await executar(async () => {
      await salvarItensListaCompras(
        tipo,
        setor,
        mesAtual,
        ano,
        rascunho,
        tipoDespesaId === '' ? (lista?.tipoDespesaId ?? undefined) : tipoDespesaId,
      );
      await enviarListaCompras(lista.id);
    });
  }

  async function criarListaMes() {
    if (tipo === 'DESPESAS_EXTRAS' && tipoDespesaId === '') {
      setErro('Selecione um tipo de despesa para criar a lista.');
      return;
    }
    setSelecaoRodada(null);
    await executar(() =>
      salvarItensListaCompras(
        tipo,
        setor,
        mesAtual,
        ano,
        [],
        tipoDespesaId === '' ? undefined : tipoDespesaId,
      ),
    );
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

  async function conferirItem(itemId: number) {
    if (!lista) return;
    await executar(() => conferirItemListaCompras(lista.id, itemId));
  }

  async function desfazerConferenciaItem(itemId: number) {
    if (!lista) return;
    await executar(() => desfazerConferenciaItemListaCompras(lista.id, itemId));
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
        {
          itemId: novoItemId,
          quantidade: (atual?.quantidade ?? 0) + qtd,
          fornecedorId:
            novoItemFornecedorId === '' ? (atual?.fornecedorId ?? null) : novoItemFornecedorId,
          valorUnitario: numero(novoItemValor) ?? atual?.valorUnitario ?? null,
          dataCompra: novoItemData || atual?.dataCompra || null,
        },
      ];
    })();
    const salvo = await executar(() =>
      salvarItensListaCompras(
        tipo,
        setor,
        mesAtual,
        ano,
        mesclados,
        tipoDespesaId === '' ? (lista.tipoDespesaId ?? undefined) : tipoDespesaId,
      ),
    );
    if (salvo) {
      setNovoItemAberto(false);
      setNovoItemId('');
      setNovoItemQtd('1');
      setNovoItemFornecedorId('');
      setNovoItemValor('');
      setNovoItemData(hoje());
    }
  }

  function itensPendentesCompra(): ListaCompraItemDto[] {
    if (!lista) return [];
    return lista.itens.filter(
      (item) =>
        item.status !== 'COMPRADO' &&
        item.status !== 'CONFERIDO' &&
        item.status !== 'RECUSADO',
    );
  }

  async function comprarLista() {
    if (!lista) return;
    const pendentes = itensPendentesCompra();
    if (pendentes.length === 0) return;
    if (
      !window.confirm(
        `Confirmar compra de ${pendentes.length} item(ns) da lista?`,
      )
    ) {
      return;
    }
    setOcupado(true);
    setErro(null);
    try {
      for (const item of pendentes) {
        const edicao = edicaoCompra(item);
        const valorUnitario = numero(edicao.valorUnitario);
        const dataCompra = edicao.dataCompra || null;
        const fornecedorId =
          edicao.fornecedorId === '' ? null : Number(edicao.fornecedorId);
        await comprarItemListaCompras(lista.id, item.id, {
          valorUnitario: valorUnitario ?? undefined,
          fornecedorId,
          dataCompra,
        });
      }
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      await recarregarSilencioso();
      setOcupado(false);
    }
  }

  function tabelaItens() {
    if (!lista) return null;
    if (lista.itens.length === 0) {
      return <p className="text-sm text-muted-foreground">Nenhum item na lista.</p>;
    }
    const mostrarDetalhesMaterial = ehMaterial;
    const mostrarAcoes =
      modo === 'aprovacao' ||
      lista.itens.some((i) => i.status === 'COMPRADO' || i.status === 'CONFERIDO');
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
              <th className="px-3 py-2 text-right">Qtd</th>
              <th className="px-3 py-2">Fornecedor</th>
              <th className="px-3 py-2 text-right">Valor unit.</th>
              <th className="px-3 py-2 text-right">Valor total</th>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Status</th>
              {mostrarAcoes && <th className="px-3 py-2 text-right">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {lista.itens.map((item) => {
              const editavel =
                modo === 'compra' &&
                item.status !== 'COMPRADO' &&
                item.status !== 'CONFERIDO';
              const edicao = edicaoCompra(item);
              const unitarioExibido = editavel
                ? numero(edicao.valorUnitario)
                : valorUnitarioItem(item);
              const totalExibido = editavel
                ? unitarioExibido !== null
                  ? unitarioExibido * Number(item.quantidade)
                  : valorTotalItem(item)
                : valorTotalItem(item);
              return (
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
                  <td className="px-3 py-2 text-right">{fmtQtd(item.quantidade)}</td>
                  <td className="px-3 py-2">
                    {editavel ? (
                      <select
                        value={edicao.fornecedorId}
                        onChange={(e) =>
                          atualizarCompra(item.id, { fornecedorId: e.target.value })
                        }
                        className={selectClasses}
                        disabled={ocupado || !acaoCompra}
                      >
                        <option value="">—</option>
                        {fornecedores.map((f) => (
                          <option key={f.id} value={f.id}>{f.nome}</option>
                        ))}
                      </select>
                    ) : (
                      fornecedorItem(item)?.nome ?? '—'
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {editavel ? (
                      <InputMoeda
                        id={`compra-valor-${item.id}`}
                        value={edicao.valorUnitario}
                        onChange={(v) =>
                          atualizarCompra(item.id, { valorUnitario: v !== undefined ? String(v) : '' })
                        }
                        disabled={ocupado || !acaoCompra}
                      />
                    ) : unitarioExibido !== null ? (
                      brl(unitarioExibido)
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {totalExibido !== null ? brl(totalExibido) : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {editavel ? (
                      <Input
                        type="date"
                        value={edicao.dataCompra}
                        onChange={(e) =>
                          atualizarCompra(item.id, { dataCompra: e.target.value })
                        }
                        className="w-36"
                        disabled={ocupado || !acaoCompra}
                      />
                    ) : (
                      formatarData(dataCompraItem(item))
                    )}
                  </td>
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
                      {item.status === 'COMPRADO' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={ocupado}
                          className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                          onClick={() => conferirItem(item.id)}
                        >
                          Conferir
                        </Button>
                      )}
                      {item.status === 'CONFERIDO' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={ocupado}
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => desfazerConferenciaItem(item.id)}
                        >
                          Desfazer
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function conteudoEdicao() {
    return (
      <>
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/30 p-3 sm:grid-cols-3 lg:grid-cols-[minmax(0,2.25fr)_5.5rem_minmax(0,1.4fr)_7.5rem_9.5rem_auto]">
          <div className="col-span-2 space-y-1.5 sm:col-span-3 lg:col-span-1">
            <Label htmlFor="item-catalogo">Item do catálogo</Label>
            <select
              id="item-catalogo"
              value={selItemId === '' ? '' : String(selItemId)}
              onChange={(e) =>
                selecionarItemDoCatalogo(
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
              className={selectClasses}
            >
              <option value="">Selecione um item...</option>
              {opcoes.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.nome}
                  {op.numeroPatrimonio ? ` — Patr. ${op.numeroPatrimonio}` : ''}
                  {op.unidade ? ` (${op.unidade})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
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
          <div className="space-y-1.5">
              <Label htmlFor="item-fornecedor">Fornecedor</Label>
            <select
              id="item-fornecedor"
              value={selFornecedorId === '' ? '' : String(selFornecedorId)}
              onChange={(e) =>
                setSelFornecedorId(
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
              className={selectClasses}
            >
              <option value="">—</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="item-valor">Valor unit.</Label>
            <InputMoeda
              id="item-valor"
              value={selValorUnitario}
              onChange={(v) => setSelValorUnitario(v !== undefined ? String(v) : '')}
            />
          </div>
          <div className="space-y-1.5">
              <Label htmlFor="item-data">Data</Label>
            <Input
              id="item-data"
              type="date"
              value={selDataCompra}
              onChange={(e) => setSelDataCompra(e.target.value)}
            />
          </div>
          <Button
            className="col-span-2 h-11 self-end sm:col-span-1"
            onClick={adicionarAoRascunho}
            disabled={ocupado || !podeCriar || selItemId === ''}
          >
            Adicionar
          </Button>
        </div>

        {rascunho.length === 0 ? (
          <p className="rounded-lg border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhum item no rascunho.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Fornecedor</th>
                  <th className="px-3 py-2 text-right">Valor unit.</th>
                  <th className="px-3 py-2 text-right">Qtd</th>
                  <th className="px-3 py-2 text-right">Valor total</th>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rascunho.map((r) => (
                  <tr key={r.itemId} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">
                      {nomesRascunho.get(r.itemId) ?? `#${r.itemId}`}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={r.fornecedorId === null ? '' : String(r.fornecedorId)}
                        onChange={(e) =>
                          atualizarRascunho(r.itemId, {
                            fornecedorId:
                              e.target.value === '' ? null : Number(e.target.value),
                          })
                        }
                        className={selectClasses}
                        disabled={ocupado || !podeCriar}
                      >
                        <option value="">—</option>
                        {fornecedores.map((f) => (
                          <option key={f.id} value={f.id}>{f.nome}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <InputMoeda
                        id={`rascunho-valor-${r.itemId}`}
                        value={r.valorUnitario ?? undefined}
                        onChange={(v) =>
                          atualizarRascunho(r.itemId, {
                            valorUnitario: v !== undefined ? v : null,
                          })
                        }
                        disabled={ocupado || !podeCriar}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Input
                        type="number"
                        min="0.001"
                        step="any"
                        value={String(r.quantidade)}
                        onChange={(e) => {
                          const qtd = Number(e.target.value);
                          if (Number.isFinite(qtd) && qtd > 0) {
                            atualizarRascunho(r.itemId, { quantidade: qtd });
                          }
                        }}
                        className="w-20 text-right"
                        disabled={ocupado || !podeCriar}
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {r.valorUnitario !== null
                        ? brl(r.valorUnitario * r.quantidade)
                        : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="date"
                        value={r.dataCompra ? r.dataCompra.slice(0, 10) : ''}
                        onChange={(e) =>
                          atualizarRascunho(r.itemId, {
                            dataCompra: e.target.value || null,
                          })
                        }
                        className="w-36"
                        disabled={ocupado || !podeCriar}
                      />
                    </td>
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

        <div className="flex flex-wrap gap-2 border-t pt-3 sm:justify-end">
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
          {acao && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={aprovar} disabled={ocupado || !lista}>
                Aprovar
              </Button>
              <Button
                variant="destructive"
                onClick={recusar}
                disabled={ocupado || !lista}
              >
                Recusar
              </Button>
            </div>
          )}
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
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/30 p-3 sm:grid-cols-3 lg:grid-cols-[minmax(0,2.25fr)_5.5rem_minmax(0,1.4fr)_7.5rem_9.5rem_auto]">
            <div className="col-span-2 space-y-1.5 sm:col-span-3 lg:col-span-1">
              <Label htmlFor="novo-item-cat">Item do catálogo</Label>
              <select
                id="novo-item-cat"
                value={novoItemId === '' ? '' : String(novoItemId)}
                onChange={(e) => {
                  const valor = e.target.value === '' ? '' : Number(e.target.value);
                  setNovoItemId(valor);
                  const op = opcoes.find((o) => o.id === valor);
                  setNovoItemFornecedorId(op?.fornecedorId ?? '');
                  setNovoItemValor(
                    op?.custoUnitario != null ? String(op.custoUnitario) : '',
                  );
                  setNovoItemData(hoje());
                }}
                className={selectClasses}
              >
                <option value="">Selecione um item...</option>
                {opcoes.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.nome}
                    {op.numeroPatrimonio ? ` — Patr. ${op.numeroPatrimonio}` : ''}
                    {op.unidade ? ` (${op.unidade})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <Label htmlFor="novo-item-fornecedor">Fornecedor</Label>
              <select
                id="novo-item-fornecedor"
                value={
                  novoItemFornecedorId === '' ? '' : String(novoItemFornecedorId)
                }
                onChange={(e) =>
                  setNovoItemFornecedorId(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
                className={selectClasses}
              >
                <option value="">—</option>
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="novo-item-valor">Valor unit.</Label>
              <InputMoeda
                id="novo-item-valor"
                value={novoItemValor}
                onChange={(v) => setNovoItemValor(v !== undefined ? String(v) : '')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="novo-item-data">Data</Label>
              <Input
                id="novo-item-data"
                type="date"
                value={novoItemData}
                onChange={(e) => setNovoItemData(e.target.value)}
              />
            </div>
            <div className="col-span-2 flex items-end gap-2 sm:col-span-1">
              <Button
                className="h-11"
                onClick={adicionarItemNaAprovacao}
                disabled={ocupado || !podeCriar || !podeAprovar(modo) || novoItemId === ''}
              >
                Adicionar
              </Button>
              <Button
                className="h-11"
                variant="ghost"
                onClick={() => setNovoItemAberto(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function conteudoCompra() {
    const acao = podeAprovarPerm && podeComprar(modo);
    const pendentes = itensPendentesCompra().length;
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            {lista?.itens.length ?? 0} item(ns) · {pendentes} pendente(s)
          </span>
          {acao && (
            <Button
              onClick={comprarLista}
              disabled={ocupado || !lista || pendentes === 0}
            >
              Comprar
            </Button>
          )}
        </div>

        {tabelaItens()}
      </div>
    );
  }

  const tipoDespesaObj = tiposDespesas.find((t) => t.id === tipoDespesaId);
  const tituloExibido =
    tipo === 'DESPESAS_EXTRAS' && tipoDespesaObj
      ? `${titulo} - ${tipoDespesaObj.nome}`
      : titulo;

  const indiceRodada = lista
    ? rodadas.findIndex((r) => r.id === lista.id)
    : -1;
  const numeroRodada = indiceRodada >= 0 ? indiceRodada + 1 : null;
  const ultimaRodada = rodadas.length > 0 ? rodadas[rodadas.length - 1] : null;
  const podeNovaCompra = podeCriar && ultimaRodada?.status === 'COMPRADA';

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {tituloExibido}
          </h1>
          <p className="text-sm text-muted-foreground">
            {rotuloSetor} · {MESES_CURTOS[mesAtual - 1]}/{ano}
            {numeroRodada !== null && ` · Compra ${numeroRodada}`}
          </p>
        </div>
      </header>

      {erro && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erro}
        </p>
      )}

      {tipo === 'DESPESAS_EXTRAS' && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3 shadow-sm">
          <Label htmlFor="tipo-despesa-filtro" className="text-sm font-medium">
            Tipo de despesa:
          </Label>
          <select
            id="tipo-despesa-filtro"
            value={tipoDespesaId === '' ? '' : String(tipoDespesaId)}
            onChange={(e) =>
              setTipoDespesaId(
                e.target.value === '' ? '' : Number(e.target.value),
              )
            }
            className="h-9 min-w-64 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            disabled={ocupado}
          >
            <option value="">Selecione um tipo de despesa...</option>
            {tiposDespesas
              .filter((t) => t.ativo)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
          </select>
        </div>
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

      {(rodadas.length > 1 || podeNovaCompra) && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3 shadow-sm">
          {rodadas.length > 1 && (
            <>
              <Label htmlFor="rodada-filtro" className="text-sm font-medium">
                Rodada:
              </Label>
              <select
                id="rodada-filtro"
                value={lista ? String(lista.id) : ''}
                onChange={(e) => {
                  const escolhido = Number(e.target.value);
                  if (Number.isFinite(escolhido) && escolhido > 0) {
                    setSelecaoRodada({ chave: chaveRodadas, id: escolhido });
                  }
                }}
                className={selectClasses}
                disabled={ocupado}
              >
                {[...rodadas]
                  .sort((a, b) => b.id - a.id)
                  .map((r) => {
                    const numero = rodadas.findIndex((x) => x.id === r.id) + 1;
                    return (
                      <option key={r.id} value={r.id}>
                        {`Compra ${numero} · ${ROTULOS_STATUS[r.status]} · ${formatarData(r.createdAt)}`}
                      </option>
                    );
                  })}
              </select>
            </>
          )}
          {podeNovaCompra && (
            <Button
              size="sm"
              className="ml-auto"
              onClick={criarListaMes}
              disabled={ocupado}
            >
              Nova compra
            </Button>
          )}
        </div>
      )}

      {carregando ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Carregando...
        </p>
      ) : tipo === 'DESPESAS_EXTRAS' && tipoDespesaId === '' ? (
        <div className="space-y-3 rounded-lg border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Selecione um tipo de despesa acima para visualizar ou criar a lista de compras deste mês.
          </p>
        </div>
      ) : !lista ? (
        <div className="space-y-3 rounded-lg border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {tipo === 'DESPESAS_EXTRAS' && tipoDespesaObj
              ? `Nenhuma lista de "${tipoDespesaObj.nome}" para este mês`
              : 'Nenhuma lista para este mês'}
          </p>
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
                <CardTitle className="text-base">
                  Itens da lista
                  {numeroRodada !== null && ` · Compra ${numeroRodada}`}
                </CardTitle>
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
                <Button
                  variant="outline"
                  size="sm"
                  disabled={ocupado}
                  onClick={() =>
                    void gerarPdfListaCompras(
                      lista,
                      tituloExibido,
                      numeroRodada ?? undefined,
                    )
                  }
                >
                  Baixar PDF
                </Button>
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
            {modo === 'compra' && conteudoCompra()}
            {modo === 'historico' && tabelaItens()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ListaComprasView;
