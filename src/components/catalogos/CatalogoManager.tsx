import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  catalogos as catApi,
  type CatalogoItem,
  type CorItem,
  type FornecedorItem,
  type RecursoCatalogo,
  type SubcategoriaItem,
  type TipoDespesaItem,
  type TipoInsumo,
  type UnidadeMedidaItem,
  RECURSO_LABEL,
  RECURSO_TIPO_FIXO,
  RECURSO_TIPOS_PERMITIDOS,
} from '../../lib/api';
import { cn } from '../../lib/utils';
import { RecordsFilter } from '../RecordsFilter';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { CpfCnpjInput } from '../ui/cpf-cnpj-input';
import { EmailInput } from '../ui/email-input';
import { selectClasses } from '../ui/form-classes';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PhoneInput } from '../ui/phone-input';

export type InsumoFiltro =
  | 'TODOS'
  | 'MATERIAL'
  | 'EQUIPAMENTO'
  | 'EPI'
  | 'DESPESAS_EXTRAS'
  | 'VEICULO';

export const TIPO_LABEL: Record<TipoInsumo, string> = {
  MATERIAL: 'Material',
  EQUIPAMENTO: 'Equipamento',
  EPI: 'EPI',
  DESPESAS_EXTRAS: 'Despesas Extras',
  VEICULO: 'Veículo',
  SERVICO: 'Serviço',
};

const TIPO_BADGE_CLASS: Record<TipoInsumo, string> = {
  MATERIAL: 'bg-blue-500/10 text-blue-600 border-blue-200',
  EQUIPAMENTO: 'bg-amber-500/10 text-amber-700 border-amber-200',
  EPI: 'bg-purple-500/10 text-purple-600 border-purple-200',
  DESPESAS_EXTRAS: 'bg-rose-500/10 text-rose-600 border-rose-200',
  VEICULO: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
  SERVICO: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
};

interface CrudApi {
  listar: (tipoInsumo?: TipoInsumo) => Promise<CatalogoItem[]>;
  criar: (
    input: Record<string, unknown>,
    tipoInsumo: TipoInsumo,
  ) => Promise<unknown>;
  atualizar: (
    id: number,
    input: Record<string, unknown>,
    tipoInsumo?: TipoInsumo,
  ) => Promise<unknown>;
  desativar: (id: number) => Promise<unknown>;
}

const APIS: Record<RecursoCatalogo, CrudApi> = {
  categorias: catApi.categoriasApi as unknown as CrudApi,
  subcategorias: catApi.subcategoriasApi as unknown as CrudApi,
  marcas: catApi.marcasApi as unknown as CrudApi,
  fornecedores: catApi.fornecedoresApi as unknown as CrudApi,
  localizacoes: catApi.localizacoesApi as unknown as CrudApi,
  'unidades-medida': catApi.unidadesMedidaApi as unknown as CrudApi,
  cores: catApi.coresApi as unknown as CrudApi,
  tamanhos: catApi.tamanhosApi as unknown as CrudApi,
  'status-equipamento': catApi.statusEquipamentoApi as unknown as CrudApi,
  'estados-conservacao': catApi.estadosConservacaoApi as unknown as CrudApi,
  'tipos-manutencao': catApi.tiposManutencaoApi as unknown as CrudApi,
  'tipos-despesas': catApi.tiposDespesasApi as unknown as CrudApi,
};

export interface CatalogoManagerProps {
  recurso: RecursoCatalogo;
  titulo?: string;
  descricao?: string;
  viewAtiva?: 'lista' | 'novo';
  onNavegar?: (view: 'lista' | 'novo') => void;
}

interface ItemExtendido extends CatalogoItem {
  categoriaId?: number;
  categoria?: { id: number; nome: string } | null;
  cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  codigoHex?: string | null;
  requerObra?: boolean;
  sigla?: string | null;
}

export function CatalogoManager({
  recurso,
  titulo: tituloProp,
  descricao: descricaoProp,
  viewAtiva: viewAtivaProp,
  onNavegar,
}: CatalogoManagerProps) {
  const [viewLocal, setViewLocal] = useState<'lista' | 'novo'>('lista');
  const viewAtiva = viewAtivaProp ?? viewLocal;
  const setView = onNavegar ?? setViewLocal;

  const tipoFixo = RECURSO_TIPO_FIXO[recurso];
  const tiposPermitidos = useMemo<TipoInsumo[]>(() => {
    return RECURSO_TIPOS_PERMITIDOS[recurso] ?? ['MATERIAL', 'EQUIPAMENTO', 'EPI'];
  }, [recurso]);

  const [tipoFiltro, setTipoFiltro] = useState<InsumoFiltro>(() => {
    if (tipoFixo) return tipoFixo as InsumoFiltro;
    return 'TODOS';
  });

  const [itens, setItens] = useState<ItemExtendido[]>([]);
  const [categoriasLookup, setCategoriasLookup] = useState<CatalogoItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'ATIVO' | 'INATIVO'>('TODOS');
  const [itensPorPagina, setItensPorPagina] = useState(25);

  // Form states for "Cadastrar Novo"
  const [novoNome, setNovoNome] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novoTipo, setNovoTipo] = useState<TipoInsumo>(() => {
    if (tipoFixo) return tipoFixo;
    if (tipoFiltro !== 'TODOS' && tiposPermitidos.includes(tipoFiltro as TipoInsumo)) {
      return tipoFiltro as TipoInsumo;
    }
    return tiposPermitidos[0] ?? 'MATERIAL';
  });
  const [categoriaPaiId, setCategoriaPaiId] = useState<number | ''>('');
  const [cnpj, setCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [codigoHex, setCodigoHex] = useState('#2563eb');
  const [requerObra, setRequerObra] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Edit modal
  const [itemEditando, setItemEditando] = useState<ItemExtendido | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editTipo, setEditTipo] = useState<TipoInsumo>('MATERIAL');
  const [editCategoriaPaiId, setEditCategoriaPaiId] = useState<number | ''>('');
  const [editCnpj, setEditCnpj] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCodigoHex, setEditCodigoHex] = useState('');
  const [editRequerObra, setEditRequerObra] = useState(false);
  const [salvandoEdit, setSalvandoEdit] = useState(false);
  const [erroEdit, setErroEdit] = useState<string | null>(null);

  // Loading
  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setError(null);
    try {
      const api = APIS[recurso];
      const lista = (await api.listar()) as ItemExtendido[];
      setItens(lista);

      if (recurso === 'subcategorias') {
        const cats = await catApi.categoriasApi.listar();
        setCategoriasLookup(cats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do catálogo');
    } finally {
      setCarregando(false);
    }
  }, [recurso]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Keep type updated when tipoFiltro or recurso changes
  useEffect(() => {
    if (tipoFixo) {
      setNovoTipo(tipoFixo);
      setTipoFiltro(tipoFixo as InsumoFiltro);
    } else if (tipoFiltro !== 'TODOS' && tiposPermitidos.includes(tipoFiltro as TipoInsumo)) {
      setNovoTipo(tipoFiltro as TipoInsumo);
    } else {
      setNovoTipo(tiposPermitidos[0] ?? 'MATERIAL');
    }
  }, [recurso, tipoFixo, tipoFiltro, tiposPermitidos]);

  // Filtering
  const contagensPorTipo = useMemo(() => {
    const counts = {
      TODOS: itens.length,
      MATERIAL: 0,
      EQUIPAMENTO: 0,
      EPI: 0,
      DESPESAS_EXTRAS: 0,
      VEICULO: 0,
    };
    for (const it of itens) {
      if (it.tipoInsumo in counts) {
        counts[it.tipoInsumo as keyof typeof counts]++;
      }
    }
    return counts;
  }, [itens]);

  const filtrados = useMemo(() => {
    return itens
      .filter((it) => {
        if (tipoFiltro !== 'TODOS' && it.tipoInsumo !== tipoFiltro) {
          return false;
        }
        if (filtroStatus === 'ATIVO' && !it.ativo) return false;
        if (filtroStatus === 'INATIVO' && it.ativo) return false;
        if (busca.trim()) {
          const termo = busca.trim().toLowerCase();
          const nomeOk = it.nome.toLowerCase().includes(termo);
          const descOk = it.descricao?.toLowerCase().includes(termo) ?? false;
          const cnpjOk = it.cnpj?.toLowerCase().includes(termo) ?? false;
          const catOk =
            recurso === 'subcategorias' &&
            categoriasLookup
              .find((c) => c.id === it.categoriaId)
              ?.nome.toLowerCase()
              .includes(termo);
          return nomeOk || descOk || cnpjOk || catOk;
        }
        return true;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
  }, [itens, tipoFiltro, filtroStatus, busca, recurso, categoriasLookup]);

  // Toggle active
  async function handleToggleAtivo(item: ItemExtendido) {
    setError(null);
    try {
      await APIS[recurso].atualizar(
        item.id,
        { ativo: !item.ativo },
        tipoFixo ?? item.tipoInsumo,
      );
      setItens((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, ativo: !x.ativo } : x)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao alterar status');
    }
  }

  // Create
  async function handleCadastrar(e: FormEvent) {
    e.preventDefault();
    if (!novoNome.trim()) return;

    setSalvando(true);
    setErroForm(null);
    try {
      const payload: Record<string, unknown> = {
        nome: novoNome.trim().toUpperCase(),
        descricao: novaDescricao.trim() || undefined,
      };

      if (recurso === 'subcategorias') {
        if (!categoriaPaiId) {
          setErroForm('Selecione uma categoria pai para a subcategoria.');
          setSalvando(false);
          return;
        }
        payload.categoriaId = Number(categoriaPaiId);
      } else if (recurso === 'fornecedores') {
        if (cnpj.trim()) payload.cnpj = cnpj.trim();
        if (telefone.trim()) payload.telefone = telefone.trim();
        if (email.trim()) payload.email = email.trim();
      } else if (recurso === 'cores') {
        if (codigoHex.trim()) payload.codigoHex = codigoHex.trim();
      } else if (recurso === 'tipos-despesas') {
        payload.requerObra = Boolean(requerObra);
      }

      await APIS[recurso].criar(payload, tipoFixo ?? novoTipo);

      // Reset form
      setNovoNome('');
      setNovaDescricao('');
      setCategoriaPaiId('');
      setCnpj('');
      setTelefone('');
      setEmail('');
      setCodigoHex('#2563eb');
      setRequerObra(false);

      await carregarDados();
      setView('lista');
    } catch (err) {
      setErroForm(err instanceof Error ? err.message : 'Falha ao cadastrar item');
    } finally {
      setSalvando(false);
    }
  }

  // Edit
  function iniciarEdicao(item: ItemExtendido) {
    setItemEditando(item);
    setEditNome(item.nome);
    setEditDescricao(item.descricao ?? '');
    setEditTipo(item.tipoInsumo);
    setEditCategoriaPaiId(item.categoriaId ?? '');
    setEditCnpj(item.cnpj ?? '');
    setEditTelefone(item.telefone ?? '');
    setEditEmail(item.email ?? '');
    setEditCodigoHex(item.codigoHex ?? '#2563eb');
    setEditRequerObra(Boolean(item.requerObra));
    setErroEdit(null);
  }

  async function salvarEdicao(e: FormEvent) {
    e.preventDefault();
    if (!itemEditando || !editNome.trim()) return;

    setSalvandoEdit(true);
    setErroEdit(null);
    try {
      const payload: Record<string, unknown> = {
        nome: editNome.trim().toUpperCase(),
        descricao: editDescricao.trim() || undefined,
        ...(tipoFixo ? {} : { tipoInsumo: editTipo }),
      };

      if (recurso === 'subcategorias' && editCategoriaPaiId) {
        payload.categoriaId = Number(editCategoriaPaiId);
      } else if (recurso === 'fornecedores') {
        payload.cnpj = editCnpj.trim() || undefined;
        payload.telefone = editTelefone.trim() || undefined;
        payload.email = editEmail.trim() || undefined;
      } else if (recurso === 'cores') {
        payload.codigoHex = editCodigoHex.trim() || undefined;
      } else if (recurso === 'tipos-despesas') {
        payload.requerObra = Boolean(editRequerObra);
      }

      await APIS[recurso].atualizar(
        itemEditando.id,
        payload,
        tipoFixo ?? editTipo,
      );

      await carregarDados();
      setItemEditando(null);
    } catch (err) {
      setErroEdit(err instanceof Error ? err.message : 'Falha ao salvar alterações');
    } finally {
      setSalvandoEdit(false);
    }
  }

  const tituloExibido = tituloProp ?? RECURSO_LABEL[recurso] ?? 'Catálogo';
  const descricaoExibida =
    descricaoProp ??
    `Gerenciamento unificado de ${tituloExibido.toLowerCase()} para materiais, equipamentos e EPI.`;

  // Categories filtered for subcategoria creation/editing (em ordem alfabética)
  const categoriasDisponiveis = useMemo(() => {
    if (recurso !== 'subcategorias') return [];
    const tipoAlvo = tipoFixo ?? novoTipo;
    return categoriasLookup
      .filter((c) => c.tipoInsumo === tipoAlvo)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
  }, [recurso, tipoFixo, novoTipo, categoriasLookup]);

  const categoriasDisponiveisEdicao = useMemo(() => {
    if (recurso !== 'subcategorias') return [];
    const tipoAlvo = tipoFixo ?? editTipo;
    return categoriasLookup
      .filter((c) => c.tipoInsumo === tipoAlvo)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
  }, [recurso, tipoFixo, editTipo, categoriasLookup]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{tituloExibido}</h1>
        <p className="text-sm text-muted-foreground">{descricaoExibida}</p>
      </header>

      {/* Global Error Banner */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* TABS DE SELEÇÃO POR TIPO DE INSUMO (Materiais, Equipamentos e EPI) */}
      {!tipoFixo && (
        <div className="flex flex-wrap items-center gap-2 border-b pb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
            Insumo:
          </span>
          <button
            type="button"
            onClick={() => setTipoFiltro('TODOS')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              tipoFiltro === 'TODOS'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            Todos ({contagensPorTipo.TODOS})
          </button>
          {tiposPermitidos.includes('MATERIAL') && (
            <button
              type="button"
              onClick={() => setTipoFiltro('MATERIAL')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                tipoFiltro === 'MATERIAL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20',
              )}
            >
              Materiais ({contagensPorTipo.MATERIAL})
            </button>
          )}
          {tiposPermitidos.includes('EQUIPAMENTO') && (
            <button
              type="button"
              onClick={() => setTipoFiltro('EQUIPAMENTO')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                tipoFiltro === 'EQUIPAMENTO'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20',
              )}
            >
              Equipamentos ({contagensPorTipo.EQUIPAMENTO})
            </button>
          )}
          {tiposPermitidos.includes('EPI') && (
            <button
              type="button"
              onClick={() => setTipoFiltro('EPI')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                tipoFiltro === 'EPI'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-purple-500/10 text-purple-700 hover:bg-purple-500/20',
              )}
            >
              EPI ({contagensPorTipo.EPI})
            </button>
          )}
          {tiposPermitidos.includes('DESPESAS_EXTRAS') && (
            <button
              type="button"
              onClick={() => setTipoFiltro('DESPESAS_EXTRAS')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                tipoFiltro === 'DESPESAS_EXTRAS'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-500/10 text-rose-700 hover:bg-rose-500/20',
              )}
            >
              Despesas Extras ({contagensPorTipo.DESPESAS_EXTRAS})
            </button>
          )}
          {tiposPermitidos.includes('VEICULO') && (
            <button
              type="button"
              onClick={() => setTipoFiltro('VEICULO')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                tipoFiltro === 'VEICULO'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/20',
              )}
            >
              Veículos ({contagensPorTipo.VEICULO})
            </button>
          )}
        </div>
      )}

      {/* VIEW NOVO CADASTRO */}
      {viewAtiva === 'novo' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Cadastrar {RECURSO_LABEL[recurso] ?? 'Novo Item'}
            </CardTitle>
            <CardDescription>
              Preencha os dados abaixo para adicionar um novo registro ao catálogo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCadastrar} className="space-y-4">
              {/* Seleção do Tipo de Insumo no Formulário */}
              {!tipoFixo && tiposPermitidos.length > 1 && (
                <div className="space-y-1.5">
                  <Label>Tipo de Insumo</Label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {tiposPermitidos.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setNovoTipo(t);
                          if (recurso === 'subcategorias') setCategoriaPaiId('');
                        }}
                        className={cn(
                          'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                          novoTipo === t
                            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                            : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                      >
                        {TIPO_LABEL[t]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tipoFixo && (
                <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  Tipo de insumo fixo:{' '}
                  <span className="font-semibold text-foreground">
                    {TIPO_LABEL[tipoFixo]}
                  </span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="novo-nome">
                    Nome <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="novo-nome"
                    required
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value.toUpperCase())}
                    placeholder="Ex.: NOME DO ITEM..."
                    autoFocus
                  />
                </div>

                {/* Subcategoria: Categoria Pai */}
                {recurso === 'subcategorias' && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="categoria-pai">
                      Categoria Pai ({TIPO_LABEL[tipoFixo ?? novoTipo]}){' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="categoria-pai"
                      required
                      value={categoriaPaiId}
                      onChange={(e) =>
                        setCategoriaPaiId(e.target.value ? Number(e.target.value) : '')
                      }
                      className={selectClasses}
                    >
                      <option value="">Selecione uma categoria...</option>
                      {categoriasDisponiveis.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                    {categoriasDisponiveis.length === 0 && (
                      <p className="text-xs text-amber-600">
                        Nenhuma categoria de {TIPO_LABEL[tipoFixo ?? novoTipo]} encontrada.
                        Cadastre primeiro uma categoria desse tipo.
                      </p>
                    )}
                  </div>
                )}

                {/* Fornecedores: Contatos */}
                {recurso === 'fornecedores' && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="forn-cnpj">CNPJ</Label>
                      <CpfCnpjInput
                        id="forn-cnpj"
                        value={cnpj}
                        onChange={setCnpj}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="forn-tel">Telefone</Label>
                      <PhoneInput
                        id="forn-tel"
                        value={telefone}
                        onChange={setTelefone}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="forn-email">E-mail</Label>
                      <EmailInput
                        id="forn-email"
                        value={email}
                        onChange={setEmail}
                        placeholder="contato@fornecedor.com.br"
                      />
                    </div>
                  </>
                )}

                {/* Cores: Seletor Hex */}
                {recurso === 'cores' && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="cor-hex">Código Hexadecimal da Cor</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={codigoHex}
                        onChange={(e) => setCodigoHex(e.target.value)}
                        className="h-9 w-12 cursor-pointer rounded border bg-transparent p-1"
                      />
                      <Input
                        id="cor-hex"
                        value={codigoHex}
                        onChange={(e) => setCodigoHex(e.target.value)}
                        placeholder="#000000"
                        className="max-w-[160px] uppercase font-mono"
                      />
                      <div
                        className="h-8 w-8 rounded-full border shadow-inner"
                        style={{ backgroundColor: codigoHex }}
                        title="Pré-visualização da cor"
                      />
                    </div>
                  </div>
                )}

                {/* Tipos de Despesas: Requer Obra */}
                {recurso === 'tipos-despesas' && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="desp-obra">Vínculo com Obra</Label>
                    <select
                      id="desp-obra"
                      value={String(requerObra)}
                      onChange={(e) => setRequerObra(e.target.value === 'true')}
                      className={selectClasses}
                    >
                      <option value="false">Não requer vinculação com obra específica</option>
                      <option value="true">Sim, requer obra obrigatória</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="novo-desc">Descrição (opcional)</Label>
                  <Input
                    id="novo-desc"
                    value={novaDescricao}
                    onChange={(e) => setNovaDescricao(e.target.value)}
                    placeholder="Informações adicionais ou notas de uso..."
                  />
                </div>
              </div>

              {erroForm && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  {erroForm}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setView('lista')}
                  disabled={salvando}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={salvando || !novoNome.trim()}>
                  {salvando ? 'Cadastrando...' : 'Cadastrar Registro'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* VIEW LISTAGEM DOS QUE JÁ TEM */}
      {viewAtiva === 'lista' && (
        <div className="space-y-4">
          {/* Barra de Filtros e Busca no padrão de outras páginas */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={`Buscar ${tituloExibido.toLowerCase()} por nome, código ou dados...`}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <select
              value={filtroStatus}
              onChange={(e) =>
                setFiltroStatus(e.target.value as 'TODOS' | 'ATIVO' | 'INATIVO')
              }
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:w-44"
            >
              <option value="TODOS">Todos os status</option>
              <option value="ATIVO">Apenas Ativos</option>
              <option value="INATIVO">Apenas Inativos</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <RecordsFilter
              value={itensPorPagina}
              onChange={setItensPorPagina}
              total={filtrados.length}
            />
            <span className="text-xs text-muted-foreground">
              Exibindo{' '}
              {itensPorPagina > 0
                ? Math.min(itensPorPagina, filtrados.length)
                : filtrados.length}{' '}
              de {filtrados.length} registros
            </span>
          </div>

          {/* Lista de Registros */}
          <div className="space-y-2">
            {carregando && (
              <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
                Carregando registros...
              </div>
            )}

            {!carregando && filtrados.length === 0 && (
              <div className="rounded-xl border bg-card p-10 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-5 w-5 text-muted-foreground"
                    aria-hidden="true"
                  >
                    <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold">Nenhum registro encontrado</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {busca || filtroStatus !== 'TODOS' || tipoFiltro !== 'TODOS'
                    ? 'Tente ajustar os filtros ou a busca acima.'
                    : `Cadastre seu primeiro item em ${tituloExibido}.`}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setView('novo')}
                  className="mt-4 gap-1.5"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                  Cadastrar Agora
                </Button>
              </div>
            )}

            {(itensPorPagina > 0
              ? filtrados.slice(0, itensPorPagina)
              : filtrados
            ).map((item) => {
              const categoriaPaiNome =
                recurso === 'subcategorias'
                  ? categoriasLookup.find((c) => c.id === item.categoriaId)?.nome
                  : undefined;

              return (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm transition-colors hover:border-primary/30"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold tracking-tight text-foreground">
                        {item.nome}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          item.ativo
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {item.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                      {!tipoFixo && (
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-xs font-medium',
                            TIPO_BADGE_CLASS[item.tipoInsumo] ?? 'bg-muted',
                          )}
                        >
                          {TIPO_LABEL[item.tipoInsumo]}
                        </span>
                      )}
                      {categoriaPaiNome && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                          Categoria: {categoriaPaiNome}
                        </span>
                      )}
                      {item.codigoHex && (
                        <span className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-mono">
                          <span
                            className="inline-block h-3 w-3 rounded-full border shadow-sm"
                            style={{ backgroundColor: item.codigoHex }}
                          />
                          {item.codigoHex}
                        </span>
                      )}
                      {item.requerObra !== undefined && (
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            item.requerObra
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {item.requerObra ? 'Requer Obra' : 'Geral'}
                        </span>
                      )}
                    </div>

                    {item.descricao && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.descricao}
                      </p>
                    )}

                    {recurso === 'fornecedores' && (item.cnpj || item.telefone || item.email) && (
                      <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs text-muted-foreground">
                        {item.cnpj && <span>CNPJ: {item.cnpj}</span>}
                        {item.telefone && <span>Tel: {item.telefone}</span>}
                        {item.email && <span>E-mail: {item.email}</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => iniciarEdicao(item)}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAtivo(item)}
                    >
                      {item.ativo ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO */}
      {itemEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={salvarEdicao}
            className="w-full max-w-lg space-y-4 rounded-xl border bg-background p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-semibold">
                Editar {RECURSO_LABEL[recurso] ?? 'Item'}
              </h3>
              <button
                type="button"
                onClick={() => setItemEditando(null)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            {!tipoFixo && tiposPermitidos.length > 1 && (
              <div className="space-y-1.5">
                <Label>Tipo de Insumo</Label>
                <select
                  value={editTipo}
                  onChange={(e) => setEditTipo(e.target.value as TipoInsumo)}
                  className={selectClasses}
                >
                  {tiposPermitidos.map((t) => (
                    <option key={t} value={t}>
                      {TIPO_LABEL[t]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="edit-nome">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-nome"
                required
                value={editNome}
                onChange={(e) => setEditNome(e.target.value.toUpperCase())}
                autoFocus
              />
            </div>

            {recurso === 'subcategorias' && (
              <div className="space-y-1.5">
                <Label htmlFor="edit-cat-pai">
                  Categoria Pai ({TIPO_LABEL[tipoFixo ?? editTipo]})
                </Label>
                <select
                  id="edit-cat-pai"
                  value={editCategoriaPaiId}
                  onChange={(e) =>
                    setEditCategoriaPaiId(e.target.value ? Number(e.target.value) : '')
                  }
                  className={selectClasses}
                >
                  <option value="">Selecione a categoria...</option>
                  {categoriasDisponiveisEdicao.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {recurso === 'fornecedores' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-cnpj">CNPJ</Label>
                  <CpfCnpjInput
                    id="edit-cnpj"
                    value={editCnpj}
                    onChange={setEditCnpj}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-tel">Telefone</Label>
                  <PhoneInput
                    id="edit-tel"
                    value={editTelefone}
                    onChange={setEditTelefone}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="edit-email">E-mail</Label>
                  <EmailInput
                    id="edit-email"
                    value={editEmail}
                    onChange={setEditEmail}
                  />
                </div>
              </div>
            )}

            {recurso === 'cores' && (
              <div className="space-y-1.5">
                <Label htmlFor="edit-hex">Código Hexadecimal</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={editCodigoHex || '#2563eb'}
                    onChange={(e) => setEditCodigoHex(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border bg-transparent p-1"
                  />
                  <Input
                    id="edit-hex"
                    value={editCodigoHex}
                    onChange={(e) => setEditCodigoHex(e.target.value)}
                    className="font-mono uppercase"
                  />
                </div>
              </div>
            )}

            {recurso === 'tipos-despesas' && (
              <div className="space-y-1.5">
                <Label htmlFor="edit-desp-obra">Vínculo com Obra</Label>
                <select
                  id="edit-desp-obra"
                  value={String(editRequerObra)}
                  onChange={(e) => setEditRequerObra(e.target.value === 'true')}
                  className={selectClasses}
                >
                  <option value="false">Não requer vinculação com obra</option>
                  <option value="true">Sim, requer obra obrigatória</option>
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="edit-desc">Descrição (opcional)</Label>
              <Input
                id="edit-desc"
                value={editDescricao}
                onChange={(e) => setEditDescricao(e.target.value)}
                placeholder="Descrição do item"
              />
            </div>

            {erroEdit && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {erroEdit}
              </div>
            )}

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={salvandoEdit}
                onClick={() => setItemEditando(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={salvandoEdit || !editNome.trim()}
              >
                {salvandoEdit ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
