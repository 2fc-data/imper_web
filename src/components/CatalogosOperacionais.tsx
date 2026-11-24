import { type ReactNode, useState } from 'react';
import {
  catalogos as catApi,
  type RecursoCatalogo,
  type TipoInsumo,
  type CatalogoItem,
  type SubcategoriaCatalogoItem,
  type FornecedorCatalogoItem,
  type CorItem,
  type TipoDespesaItem,
  type UnidadeMedidaItem,
  RECURSO_TIPO_FIXO,
  RECURSO_TIPOS_PERMITIDOS,
} from '../lib/api';
import { cn } from '../lib/utils';
import { Accordion } from './Accordion';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Input } from './ui/input';
import { PhoneInput } from './ui/phone-input';
import { CpfCnpjInput } from './ui/cpf-cnpj-input';
import { EmailInput } from './ui/email-input';
import { Label } from './ui/label';
import { selectClasses } from './ui/form-classes';

type ItemLookup = CatalogoItem & {
  descricao?: string | null;
  sigla?: string | null;
  cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  codigoHex?: string | null;
  requerObra?: boolean;
};

interface CrudApi {
  criar: (input: Record<string, unknown>, tipoInsumo: TipoInsumo) => Promise<unknown>;
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
  'unidades-medida': catApi.unidadesMedidaApi as unknown as CrudApi,
  cores: catApi.coresApi as unknown as CrudApi,
  tamanhos: catApi.tamanhosApi as unknown as CrudApi,
  'status-equipamento': catApi.statusEquipamentoApi as unknown as CrudApi,
  'estados-conservacao': catApi.estadosConservacaoApi as unknown as CrudApi,
  'tipos-manutencao': catApi.tiposManutencaoApi as unknown as CrudApi,
  'tipos-despesas': catApi.tiposDespesasApi as unknown as CrudApi,
};

const TIPO_LABEL: Record<TipoInsumo, string> = {
  EQUIPAMENTO: 'Equipamento',
  EPI: 'EPI',
  MATERIAL: 'Material',
  DESPESAS_EXTRAS: 'Despesas Extras',
  VEICULO: 'Veículo',
  SERVICO: 'Serviço',
};

interface CatalogosOperacionaisProps {
  payload: catApi.CatalogosPayload;
  relerLookups: () => Promise<void>;
}

function ModalEditarLookup({
  item,
  api,
  tipoFixo,
  tiposPermitidos,
  aoSalvar,
  onFechar,
}: {
  item: ItemLookup;
  api: CrudApi;
  tipoFixo?: TipoInsumo;
  tiposPermitidos: TipoInsumo[];
  aoSalvar: () => Promise<void>;
  onFechar: () => void;
}) {
  const [nome, setNome] = useState(item.nome);
  const [descricao, setDescricao] = useState(item.descricao ?? '');
  const [tipoInsumo, setTipoInsumo] = useState<TipoInsumo>(item.tipoInsumo);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await api.atualizar(
        item.id,
        {
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          ...(tipoFixo ? {} : { tipoInsumo }),
        },
        tipoFixo ?? tipoInsumo,
      );
      await aoSalvar();
      onFechar();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Falha ao salvar');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={salvar}
        className="w-full max-w-md space-y-4 rounded-xl border bg-background p-6 shadow-xl"
      >
        <h3 className="text-lg font-bold">Editar Item</h3>
        {!tipoFixo && tiposPermitidos.length > 1 && (
          <div className="space-y-2">
            <Label>Tipo de insumo</Label>
            <select
              value={tipoInsumo}
              onChange={(e) => setTipoInsumo(e.target.value as TipoInsumo)}
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
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value.toUpperCase())}
            placeholder="Nome do item"
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label>Descrição (opcional)</Label>
          <Input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição"
          />
        </div>
        {err && <span className="text-xs text-destructive">{err}</span>}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={onFechar}
          >
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={busy || !nome.trim()}>
            {busy ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function LinhaLookup({
  item,
  api,
  tipoFixo,
  tiposPermitidos,
  aoSalvar,
  extra,
}: {
  item: ItemLookup;
  api: CrudApi;
  tipoFixo?: TipoInsumo;
  tiposPermitidos: TipoInsumo[];
  aoSalvar: () => Promise<void>;
  extra?: ReactNode;
}) {
  const [toggling, setToggling] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  async function alternarAtivo() {
    setToggling(true);
    setErr(null);
    try {
      await api.atualizar(
        item.id,
        { ativo: !item.ativo },
        tipoFixo ?? item.tipoInsumo,
      );
      await aoSalvar();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Falha ao atualizar');
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{item.nome}</span>
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
            <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-600">
              {TIPO_LABEL[item.tipoInsumo]}
            </span>
          )}
        </div>
        {item.descricao && (
          <span className="text-xs text-muted-foreground">{item.descricao}</span>
        )}
        {extra}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setEditing(true)}
        >
          Editar
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={toggling}
          onClick={alternarAtivo}
        >
          {item.ativo ? 'Desativar' : 'Ativar'}
        </Button>
      </div>
      {editing && (
        <ModalEditarLookup
          item={item}
          api={api}
          tipoFixo={tipoFixo}
          tiposPermitidos={tiposPermitidos}
          aoSalvar={aoSalvar}
          onFechar={() => setEditing(false)}
        />
      )}
      {err && <span className="w-full text-xs text-destructive">{err}</span>}
    </div>
  );
}

function CardCatalogo<T extends ItemLookup>({
  recurso,
  titulo,
  descricao,
  itens,
  aoSalvar,
  tipos,
  mostrarTipoNaLinha = false,
  formularioExtra,
  montarPayload,
  bloqueadoQuandoTipoAtivo = false,
}: {
  recurso: RecursoCatalogo;
  titulo: string;
  descricao: string;
  itens: T[];
  aoSalvar: () => Promise<void>;
  tipos?: TipoInsumo[];
  mostrarTipoNaLinha?: boolean;
  formularioExtra?: (
    form: Record<string, unknown>,
    setForm: (f: Record<string, unknown>) => void,
  ) => ReactNode;
  montarPayload?: (form: Record<string, unknown>) => Record<string, unknown>;
  bloqueadoQuandoTipoAtivo?: boolean;
}) {
  const tipoFixo = RECURSO_TIPO_FIXO[recurso];
  const tiposPermitidos = tipos ?? RECURSO_TIPOS_PERMITIDOS[recurso] ?? [];
  const [form, setForm] = useState<Record<string, unknown>>({
    nome: '',
    descricao: '',
  });
  const [tipoInsumoForm, setTipoInsumoForm] = useState<TipoInsumo | ''>(
    tipoFixo ?? '',
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const tipoEfetivo = tipoFixo ?? (tipoInsumoForm || undefined);

  async function criar() {
    const nome = String(form.nome ?? '').trim();
    if (!nome) return;
    if (!tipoEfetivo) {
      setErr('Selecione o tipo de insumo');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const base = montarPayload ? montarPayload(form) : {
        nome,
        descricao: form.descricao || undefined,
      };
      await APIS[recurso].criar(
        { ...base, nome },
        tipoEfetivo,
      );
      setForm({ nome: '', descricao: '' });
      if (!tipoFixo) setTipoInsumoForm('');
      await aoSalvar();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Falha ao cadastrar');
    } finally {
      setSaving(false);
    }
  }

  const tipoAviso = bloqueadoQuandoTipoAtivo ? tipoEfetivo : undefined;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{titulo}</CardTitle>
        <CardDescription>{descricao}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input
              value={form.nome as string}
              onChange={(e) =>
                setForm({ ...form, nome: e.target.value.toUpperCase() })
              }
              placeholder="Nome do item"
            />
          </div>
          {formularioExtra?.(form, setForm)}
          {!tipoFixo && tiposPermitidos.length > 0 && (
            <div className="space-y-1.5">
              <Label>Tipo de insumo</Label>
              <select
                value={tipoInsumoForm}
                onChange={(e) =>
                  setTipoInsumoForm(e.target.value as TipoInsumo | '')
                }
                className={selectClasses}
              >
                <option value="">Selecione...</option>
                {tiposPermitidos.map((t) => (
                  <option key={t} value={t}>
                    {TIPO_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {tipoAviso && (
          <p className="text-xs text-muted-foreground">
            {titulo} é fixo em {TIPO_LABEL[tipoAviso]}. Registros de veículo são
            gerenciados na Frota.
          </p>
        )}
        {form.descricao !== undefined && (
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input
              value={(form.descricao ?? '') as string}
              onChange={(e) =>
                setForm({ ...form, descricao: e.target.value })
              }
              placeholder="Descrição (opcional)"
            />
          </div>
        )}
        {err && <span className="text-xs text-destructive">{err}</span>}
        <Button type="button" size="sm" disabled={saving} onClick={criar}>
          {saving ? 'Salvando...' : 'Adicionar'}
        </Button>
        <div className="space-y-2 pt-2">
          {itens.map((item) => (
            <LinhaLookup
              key={item.id}
              item={item}
              api={APIS[recurso]}
              tipoFixo={tipoFixo}
              tiposPermitidos={tiposPermitidos}
              aoSalvar={aoSalvar}
              extra={
                mostrarTipoNaLinha && (
                  <span className="text-xs text-muted-foreground">
                    Tipo: {TIPO_LABEL[item.tipoInsumo]}
                  </span>
                )
              }
            />
          ))}
          {itens.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum item cadastrado.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ItemFornecedor({ item }: { item: FornecedorCatalogoItem }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">
        {[
          item.cnpj && `CNPJ: ${item.cnpj}`,
          item.telefone && `Tel: ${item.telefone}`,
          item.email && `Email: ${item.email}`,
        ]
          .filter(Boolean)
          .join(' · ') || 'Sem contato'}
      </span>
    </div>
  );
}

function CardFornecedores({
  itens,
  aoSalvar,
}: {
  itens: FornecedorCatalogoItem[];
  aoSalvar: () => Promise<void>;
}) {
  const [form, setForm] = useState<Partial<FornecedorCatalogoItem>>({
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
  });
  const [tipoInsumo, setTipoInsumo] = useState<TipoInsumo | ''>('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const tipos = RECURSO_TIPOS_PERMITIDOS.fornecedores;

  async function criar() {
    if (!form.nome?.trim()) return;
    if (!tipoInsumo) {
      setErr('Selecione o tipo de insumo');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await catApi.fornecedoresApi.criar(
        {
          nome: form.nome.trim(),
          cnpj: form.cnpj || undefined,
          telefone: form.telefone || undefined,
          email: form.email || undefined,
        },
        tipoInsumo,
      );
      setForm({ nome: '', cnpj: '', telefone: '', email: '' });
      setTipoInsumo('');
      await aoSalvar();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Falha ao cadastrar fornecedor');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Fornecedores</CardTitle>
        <CardDescription>Empresas fornecedoras.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input
              value={form.nome ?? ''}
              onChange={(e) =>
                setForm({ ...form, nome: e.target.value.toUpperCase() })
              }
              placeholder="Nome do fornecedor"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de insumo</Label>
            <select
              value={tipoInsumo}
              onChange={(e) => setTipoInsumo(e.target.value as TipoInsumo | '')}
              className={selectClasses}
            >
              <option value="">Selecione...</option>
              {tipos.map((t) => (
                <option key={t} value={t}>
                  {TIPO_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>CNPJ</Label>
            <CpfCnpjInput
              value={form.cnpj ?? ''}
              onChange={(valor) => setForm({ ...form, cnpj: valor })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <PhoneInput
              value={form.telefone ?? ''}
              onChange={(valor) => setForm({ ...form, telefone: valor })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <EmailInput
              value={form.email ?? ''}
              onChange={(val) => setForm({ ...form, email: val })}
              placeholder="Opcional"
            />
          </div>
        </div>
        {err && <span className="text-xs text-destructive">{err}</span>}
        <Button type="button" size="sm" disabled={saving} onClick={criar}>
          {saving ? 'Salvando...' : 'Adicionar'}
        </Button>
        <div className="space-y-2 pt-2">
          {itens.map((item) => (
            <LinhaLookup
              key={item.id}
              item={item}
              api={APIS.fornecedores}
              tiposPermitidos={tipos}
              aoSalvar={aoSalvar}
              extra={<ItemFornecedor item={item} />}
            />
          ))}
          {itens.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum fornecedor cadastrado.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CatalogosOperacionais({
  payload,
  relerLookups,
}: CatalogosOperacionaisProps) {
  const [categoriaParaSub, setCategoriaParaSub] = useState<number | ''>('');
  const [formSub, setFormSub] = useState<Partial<SubcategoriaCatalogoItem>>({
    nome: '',
    descricao: '',
  });
  const [savingSub, setSavingSub] = useState(false);
  const [errSub, setErrSub] = useState<string | null>(null);

  async function criarSubcategoria() {
    if (!formSub.nome || !categoriaParaSub) return;
    setSavingSub(true);
    setErrSub(null);
    try {
      const categoria = payload.categorias.find(
        (c) => c.id === Number(categoriaParaSub),
      );
      if (!categoria) {
        setErrSub('Selecione uma categoria válida');
        return;
      }
      await catApi.subcategoriasApi.criar(
        {
          nome: formSub.nome.trim(),
          descricao: formSub.descricao || undefined,
          categoriaId: Number(categoriaParaSub),
        } as unknown as { nome: string } & Partial<SubcategoriaCatalogoItem>,
        categoria.tipoInsumo,
      );
      setFormSub({ nome: '', descricao: '' });
      setCategoriaParaSub('');
      await relerLookups();
    } catch (e) {
      setErrSub(
        e instanceof Error ? e.message : 'Falha ao cadastrar subcategoria',
      );
    } finally {
      setSavingSub(false);
    }
  }

  const subcategoriasAtivas = payload.subcategorias;

  const corForm = (
    form: Record<string, unknown>,
    setForm: (f: Record<string, unknown>) => void,
  ) => (
    <div className="space-y-1.5">
      <Label>Código da cor</Label>
      <Input
        value={(form.codigoHex ?? '') as string}
        onChange={(e) => setForm({ ...form, codigoHex: e.target.value })}
        placeholder="#000000 (opcional)"
      />
    </div>
  );

  const despesaForm = (
    form: Record<string, unknown>,
    setForm: (f: Record<string, unknown>) => void,
  ) => (
    <div className="space-y-1.5">
      <Label>Requer obra</Label>
      <select
        value={String(form.requerObra ?? 'false')}
        onChange={(e) =>
          setForm({ ...form, requerObra: e.target.value === 'true' })
        }
        className={selectClasses}
      >
        <option value="false">Não</option>
        <option value="true">Sim</option>
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      <Accordion
        items={[
          {
            titulo: 'Categorias',
            descricao: 'Agrupamentos gerais.',
            conteudo: (
              <CardCatalogo
                recurso="categorias"
                titulo="Categorias"
                descricao="Agrupamentos gerais."
                itens={payload.categorias}
                aoSalvar={relerLookups}
              />
            ),
          },
          {
            titulo: 'Subcategorias',
            descricao: 'Refinamento das categorias.',
            conteudo: (
              <Card>
                <CardDescription className="px-6 pt-4">
                  O tipo é herdado da categoria pai.
                </CardDescription>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Categoria pai</Label>
                      <select
                        value={categoriaParaSub}
                        onChange={(e) =>
                          setCategoriaParaSub(
                            e.target.value ? Number(e.target.value) : '',
                          )
                        }
                        className={selectClasses}
                      >
                        <option value="">Selecione...</option>
                        {payload.categorias.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome} — {TIPO_LABEL[c.tipoInsumo]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Nome</Label>
                      <Input
                        value={formSub.nome ?? ''}
                        onChange={(e) =>
                          setFormSub({
                            ...formSub,
                            nome: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="Nome da subcategoria"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Descrição</Label>
                    <Input
                      value={formSub.descricao ?? ''}
                      onChange={(e) =>
                        setFormSub({ ...formSub, descricao: e.target.value })
                      }
                      placeholder="Descrição (opcional)"
                    />
                  </div>
                  {errSub && (
                    <span className="text-xs text-destructive">{errSub}</span>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingSub}
                    onClick={criarSubcategoria}
                  >
                    {savingSub ? 'Salvando...' : 'Adicionar'}
                  </Button>
                  <div className="space-y-2 pt-2">
                    {subcategoriasAtivas.map((s) => {
                      const nomeCategoria = payload.categorias.find(
                        (c) => c.id === s.categoriaId,
                      )?.nome;

                      return (
                        <LinhaLookup
                          key={s.id}
                          item={s}
                          api={APIS.subcategorias}
                          tiposPermitidos={RECURSO_TIPOS_PERMITIDOS.subcategorias}
                          aoSalvar={relerLookups}
                          extra={
                            <span className="text-xs text-muted-foreground">
                              Categoria: {nomeCategoria ?? '—'}
                            </span>
                          }
                        />
                      );
                    })}
                    {subcategoriasAtivas.length === 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        Nenhuma subcategoria cadastrada.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ),
          },
          {
            titulo: 'Marcas',
            descricao: 'Fabricantes.',
            conteudo: (
              <CardCatalogo
                recurso="marcas"
                titulo="Marcas"
                descricao="Fabricantes."
                itens={payload.marcas}
                aoSalvar={relerLookups}
              />
            ),
          },
          {
            titulo: 'Unidades de Medida',
            descricao: 'Unidades usadas em materiais, serviços e orçamentos.',
            conteudo: (
              <CardCatalogo<UnidadeMedidaItem>
                recurso="unidades-medida"
                titulo="Unidades de Medida"
                descricao="Unidades usadas em materiais, serviços e orçamentos."
                itens={payload.unidadesMedida}
                aoSalvar={relerLookups}
              />
            ),
          },
          {
            titulo: 'Cores',
            descricao: 'Cores disponíveis.',
            conteudo: (
              <CardCatalogo<CorItem>
                recurso="cores"
                titulo="Cores"
                descricao="Cores disponíveis."
                itens={payload.cores}
                aoSalvar={relerLookups}
                formularioExtra={corForm}
              />
            ),
          },
          {
            titulo: 'Tamanhos',
            descricao: 'Tamanhos disponíveis (EPI).',
            conteudo: (
              <CardCatalogo
                recurso="tamanhos"
                titulo="Tamanhos"
                descricao="Tamanhos disponíveis (EPI)."
                itens={payload.tamanhos}
                aoSalvar={relerLookups}
              />
            ),
          },
          {
            titulo: 'Status de equipamento',
            descricao: 'Situação operacional do equipamento.',
            conteudo: (
              <CardCatalogo
                recurso="status-equipamento"
                titulo="Status de equipamento"
                descricao="Situação operacional do equipamento."
                itens={payload.statusEquipamento}
                aoSalvar={relerLookups}
                bloqueadoQuandoTipoAtivo
              />
            ),
          },
          {
            titulo: 'Estados de conservação',
            descricao: 'Condição física do equipamento.',
            conteudo: (
              <CardCatalogo
                recurso="estados-conservacao"
                titulo="Estados de conservação"
                descricao="Condição física do equipamento."
                itens={payload.estadosConservacao}
                aoSalvar={relerLookups}
                bloqueadoQuandoTipoAtivo
              />
            ),
          },
          {
            titulo: 'Tipos de manutenção',
            descricao: 'Classificação das manutenções.',
            conteudo: (
              <CardCatalogo
                recurso="tipos-manutencao"
                titulo="Tipos de manutenção"
                descricao="Classificação das manutenções."
                itens={payload.tiposManutencao}
                aoSalvar={relerLookups}
                bloqueadoQuandoTipoAtivo
              />
            ),
          },
          {
            titulo: 'Tipos de despesa',
            descricao: 'Tipos de despesas extras.',
            conteudo: (
              <CardCatalogo<TipoDespesaItem>
                recurso="tipos-despesas"
                titulo="Tipos de despesa"
                descricao="Tipos de despesas extras."
                itens={payload.tiposDespesas}
                aoSalvar={relerLookups}
                formularioExtra={despesaForm}
                montarPayload={(form) => ({
                  descricao: form.descricao || undefined,
                  requerObra: Boolean(form.requerObra),
                })}
                bloqueadoQuandoTipoAtivo
              />
            ),
          },
          {
            titulo: 'Fornecedores',
            descricao: 'Empresas fornecedoras.',
            conteudo: (
              <CardFornecedores
                itens={payload.fornecedores}
                aoSalvar={relerLookups}
              />
            ),
          },
        ]}
      />
    </div>
  );
}