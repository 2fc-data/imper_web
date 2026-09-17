import { type ReactNode, useState } from 'react';
import {
  type BaseLookup,
  categoriasApi,
  categoriasEpiApi,
  categoriasMaterialApi,
  coresEpiApi,
  coresMaterialApi,
  type EpiLookups,
  type EquipamentoLookups,
  estadosConservacaoApi,
  type FornecedorInput,
  type FornecedorItem,
  fornecedoresApi,
  fornecedoresEpiApi,
  type LookupInput,
  localizacoesApi,
  localizacoesEpiApi,
  type MaterialLookups,
  marcasApi,
  marcasEpiApi,
  marcasMaterialApi,
  type SubcategoriaInput,
  statusEquipamentoApi,
  subcategoriasApi,
  subcategoriasEpiApi,
  subcategoriasMaterialApi,
  tamanhosEpiApi,
  tiposManutencaoApi,
  unidadesMedidaApi,
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

const selectClasses =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

type Modulo = 'EQUIPAMENTO' | 'EPI' | 'MATERIAIS';

interface CatalogosOperacionaisProps {
  modulo: Modulo;
  lookups: EquipamentoLookups | EpiLookups | MaterialLookups | null;
  relerLookups: () => Promise<void>;
  ocultarTitulo?: boolean;
}

function ModalEditarLookup({
  item,
  api,
  aoSalvar,
  onFechar,
}: {
  item: BaseLookup & { descricao?: string | null };
  api: {
    atualizar: (
      id: number,
      input: Partial<LookupInput> & { ativo?: boolean },
    ) => Promise<unknown>;
  };
  aoSalvar: () => Promise<void>;
  onFechar: () => void;
}) {
  const [nome, setNome] = useState(item.nome);
  const [descricao, setDescricao] = useState(item.descricao ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await api.atualizar(item.id, {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
      });
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
        className="w-full max-w-md space-y-4 rounded-xl bg-background p-6 shadow-xl border"
      >
        <h3 className="text-lg font-bold">Editar Item</h3>
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

function SeletorAtualizacaoLookup({
  item,
  api,
  aoSalvar,
}: {
  item: BaseLookup & { descricao?: string | null };
  api: {
    atualizar: (
      id: number,
      input: Partial<LookupInput> & { ativo?: boolean },
    ) => Promise<unknown>;
  };
  aoSalvar: () => Promise<void>;
}) {
  const [value, setValue] = useState(item.descricao ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function salvar() {
    setBusy(true);
    setErr(null);
    try {
      await api.atualizar(item.id, { descricao: value || undefined });
      await aoSalvar();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Falha ao atualizar');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={salvar}
        placeholder="Descrição (opcional)"
        className="h-9 max-w-[220px]"
      />
      {busy && (
        <span className="text-xs text-muted-foreground">Salvando...</span>
      )}
      {err && <span className="text-xs text-destructive">{err}</span>}
    </div>
  );
}

function LinhaLookup({
  item,
  api,
  aoSalvar,
  extra,
}: {
  item: BaseLookup & { descricao?: string | null };
  api: {
    atualizar: (
      id: number,
      input: Partial<LookupInput> & { ativo?: boolean },
    ) => Promise<unknown>;
    desativar: (id: number) => Promise<unknown>;
  };
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
      await api.atualizar(item.id, { ativo: !item.ativo });
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
        </div>
        {item.descricao && (
          <span className="text-xs text-muted-foreground">
            {item.descricao}
          </span>
        )}
        {extra}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SeletorAtualizacaoLookup item={item} api={api} aoSalvar={aoSalvar} />
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
          aoSalvar={aoSalvar}
          onFechar={() => setEditing(false)}
        />
      )}
      {err && <span className="w-full text-xs text-destructive">{err}</span>}
    </div>
  );
}

function CardCatologo({
  titulo,
  descricao,
  itens,
  api,
  aoSalvar,
  formularioNovo,
}: {
  titulo: string;
  descricao: string;
  itens: (BaseLookup & { descricao?: string | null })[];
  api: {
    criar: (input: LookupInput) => Promise<unknown>;
    atualizar: (
      id: number,
      input: Partial<LookupInput> & { ativo?: boolean },
    ) => Promise<unknown>;
    desativar: (id: number) => Promise<unknown>;
  };
  aoSalvar: () => Promise<void>;
  formularioNovo?: (
    form: LookupInput,
    setForm: (f: LookupInput) => void,
  ) => ReactNode;
}) {
  const [form, setForm] = useState<LookupInput>({ nome: '', descricao: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function criar() {
    if (!form.nome.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      await api.criar({
        nome: form.nome.trim(),
        descricao: form.descricao || undefined,
      });
      setForm({ nome: '', descricao: '' });
      await aoSalvar();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Falha ao cadastrar');
    } finally {
      setSaving(false);
    }
  }

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
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value.toUpperCase() })}
              placeholder="Nome do item"
            />
          </div>
          {formularioNovo?.(form, setForm)}
        </div>
        {form.descricao !== undefined && (
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input
              value={form.descricao ?? ''}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
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
              api={api}
              aoSalvar={aoSalvar}
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

function ItemFornecedor({ item }: { item: FornecedorItem }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{item.nome}</span>
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

export function CatalogosOperacionais({
  modulo,
  lookups,
  relerLookups,
  ocultarTitulo,
}: CatalogosOperacionaisProps) {
  const [categoriaParaSub, setCategoriaParaSub] = useState<number | ''>('');
  const [formFornecedor, setFormFornecedor] = useState<FornecedorInput>({
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
  });
  const [savingFornecedor, setSavingFornecedor] = useState(false);
  const [formSub, setFormSub] = useState<LookupInput>({
    nome: '',
    descricao: '',
  });
  const [savingSub, setSavingSub] = useState(false);
  const [errSub, setErrSub] = useState<string | null>(null);
  const [errFornecedor, setErrFornecedor] = useState<string | null>(null);

  if (!lookups) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Carregando catálogos...
      </p>
    );
  }

  const somenteEpi = modulo === 'EPI';
  const somenteMaterial = modulo === 'MATERIAIS';

  async function criarSubcategoria() {
    if (!formSub.nome.trim() || !categoriaParaSub) return;
    setSavingSub(true);
    setErrSub(null);
    try {
      const input: SubcategoriaInput = {
        nome: formSub.nome.trim(),
        descricao: formSub.descricao || undefined,
        categoriaId: Number(categoriaParaSub),
      };
      if (somenteMaterial) {
        await subcategoriasMaterialApi.criar(input);
      } else if (somenteEpi) {
        await subcategoriasEpiApi.criar(input);
      } else {
        await subcategoriasApi.criar(input);
      }
      setFormSub({ nome: '', descricao: '' });
      await relerLookups();
    } catch (e) {
      setErrSub(
        e instanceof Error ? e.message : 'Falha ao cadastrar subcategoria',
      );
    } finally {
      setSavingSub(false);
    }
  }

  async function criarFornecedor() {
    if (!formFornecedor.nome.trim()) return;
    setSavingFornecedor(true);
    setErrFornecedor(null);
    try {
      const input: FornecedorInput = {
        nome: formFornecedor.nome.trim(),
        cnpj: formFornecedor.cnpj || undefined,
        telefone: formFornecedor.telefone || undefined,
        email: formFornecedor.email || undefined,
      };
      if (somenteEpi) {
        await fornecedoresEpiApi.criar(input);
      } else {
        await fornecedoresApi.criar(input);
      }
      setFormFornecedor({ nome: '', cnpj: '', telefone: '', email: '' });
      await relerLookups();
    } catch (e) {
      setErrFornecedor(
        e instanceof Error ? e.message : 'Falha ao cadastrar fornecedor',
      );
    } finally {
      setSavingFornecedor(false);
    }
  }

  const titulo = somenteMaterial
    ? 'Catálogos de Materiais'
    : somenteEpi
      ? 'Catálogos de EPIs'
      : 'Catálogos de Equipamentos';
  const descricao = somenteMaterial
    ? 'Tabelas auxiliares usadas no cadastro de materiais.'
    : somenteEpi
      ? 'Tabelas auxiliares usadas no cadastro de EPIs.'
      : 'Tabelas auxiliares usadas no cadastro de equipamentos.';
  const subcategoriasAtivas = lookups.subcategorias.filter((s) => s.ativo);

  return (
    <div className="space-y-6">
      {!ocultarTitulo && (
        <div>
          <h2 className="text-xl font-bold tracking-tight">{titulo}</h2>
          <p className="text-sm text-muted-foreground">{descricao}</p>
        </div>
      )}

      <Accordion
        items={[
          {
            titulo: 'Categorias',
            descricao: 'Agrupamentos gerais.',
            conteudo: (
              <CardCatologo
                titulo="Categorias"
                descricao="Agrupamentos gerais."
                itens={lookups.categorias}
                api={
                  somenteMaterial
                    ? categoriasMaterialApi
                    : somenteEpi
                      ? categoriasEpiApi
                      : categoriasApi
                }
                aoSalvar={relerLookups}
              />
            ),
          },
          {
            titulo: 'Subcategorias',
            descricao: 'Refinamento das categorias.',
            conteudo: (
              <Card>
                <CardContent className="space-y-3 pt-0">
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
                        {lookups.categorias.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Nome</Label>
                      <Input
                        value={formSub.nome}
                        onChange={(e) =>
                          setFormSub({ ...formSub, nome: e.target.value.toUpperCase() })
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
                      const nomeCategoria = lookups.categorias.find(
                        (c) => c.id === s.categoriaId,
                      )?.nome;

                      return (
                        <LinhaLookup
                          key={s.id}
                          item={s}
                          api={
                            somenteMaterial
                              ? subcategoriasMaterialApi
                              : somenteEpi
                                ? subcategoriasEpiApi
                                : subcategoriasApi
                          }
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
              <CardCatologo
                titulo="Marcas"
                descricao="Fabricantes."
                itens={lookups.marcas}
                api={
                  somenteMaterial
                    ? marcasMaterialApi
                    : somenteEpi
                      ? marcasEpiApi
                      : marcasApi
                }
                aoSalvar={relerLookups}
              />
            ),
          },
          {
            titulo: 'Unidades de Medida',
            descricao: 'Unidades usadas em materiais, serviços e orçamentos.',
            conteudo: (
              <CardCatologo
                titulo="Unidades de Medida"
                descricao="Unidades usadas em materiais, serviços e orçamentos."
                itens={lookups.unidadesMedida ?? []}
                api={unidadesMedidaApi}
                aoSalvar={relerLookups}
              />
            ),
          },
          ...(!somenteMaterial
            ? [
                {
                  titulo: 'Localizações',
                  descricao: 'Onde os itens ficam instalados.',
                  conteudo: (
                    <CardCatologo
                      titulo="Localizações"
                      descricao="Onde os itens ficam instalados."
                      itens={lookups.localizacoes ?? []}
                      api={somenteEpi ? localizacoesEpiApi : localizacoesApi}
                      aoSalvar={relerLookups}
                    />
                  ),
                },
              ]
            : []),
          ...(somenteEpi && 'cores' in lookups
            ? [
                {
                  titulo: 'Cores',
                  descricao: 'Cores disponíveis.',
                  conteudo: (
                    <CardCatologo
                      titulo="Cores"
                      descricao="Cores disponíveis."
                      itens={lookups.cores}
                      api={coresEpiApi}
                      aoSalvar={relerLookups}
                    />
                  ),
                },
                {
                  titulo: 'Tamanhos',
                  descricao: 'Tamanhos disponíveis.',
                  conteudo: (
                    <CardCatologo
                      titulo="Tamanhos"
                      descricao="Tamanhos disponíveis."
                      itens={lookups.tamanhos ?? []}
                      api={tamanhosEpiApi}
                      aoSalvar={relerLookups}
                    />
                  ),
                },
              ]
            : []),
          ...(!somenteEpi && !somenteMaterial
            ? [
                {
                  titulo: 'Status de equipamento',
                  descricao: 'Situação operacional do equipamento.',
                  conteudo: (
                    <CardCatologo
                      titulo="Status de equipamento"
                      descricao="Situação operacional do equipamento."
                      itens={lookups.statuses ?? []}
                      api={statusEquipamentoApi}
                      aoSalvar={relerLookups}
                    />
                  ),
                },
                {
                  titulo: 'Estados de conservação',
                  descricao: 'Condição física do equipamento.',
                  conteudo: (
                    <CardCatologo
                      titulo="Estados de conservação"
                      descricao="Condição física do equipamento."
                      itens={lookups.estadosConservacao ?? []}
                      api={estadosConservacaoApi}
                      aoSalvar={relerLookups}
                    />
                  ),
                },
                {
                  titulo: 'Tipos de manutenção',
                  descricao: 'Classificação das manutenções.',
                  conteudo: (
                    <CardCatologo
                      titulo="Tipos de manutenção"
                      descricao="Classificação das manutenções."
                      itens={lookups.tiposManutencao ?? []}
                      api={tiposManutencaoApi}
                      aoSalvar={relerLookups}
                    />
                  ),
                },
              ]
            : []),
          ...(somenteMaterial && 'cores' in lookups
            ? [
                {
                  titulo: 'Cores',
                  descricao: 'Cores disponíveis.',
                  conteudo: (
                    <CardCatologo
                      titulo="Cores"
                      descricao="Cores disponíveis."
                      itens={lookups.cores}
                      api={coresMaterialApi}
                      aoSalvar={relerLookups}
                    />
                  ),
                },
              ]
            : []),
          {
            titulo: 'Fornecedores',
            descricao: 'Empresas fornecedoras.',
            conteudo: (
              <Card>
                <CardContent className="space-y-3 pt-0">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Nome</Label>
                      <Input
                        value={formFornecedor.nome}
                        onChange={(e) =>
                          setFormFornecedor({
                            ...formFornecedor,
                            nome: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="Nome do fornecedor"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>CNPJ</Label>
                      <CpfCnpjInput
                        value={formFornecedor.cnpj ?? ''}
                        onChange={(valor) =>
                          setFormFornecedor({
                            ...formFornecedor,
                            cnpj: valor,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Telefone</Label>
                      <PhoneInput
                        value={formFornecedor.telefone ?? ''}
                        onChange={(valor) =>
                          setFormFornecedor({
                            ...formFornecedor,
                            telefone: valor,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <EmailInput
                        value={formFornecedor.email ?? ''}
                        onChange={(val) =>
                          setFormFornecedor({
                            ...formFornecedor,
                            email: val,
                          })
                        }
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  {errFornecedor && (
                    <span className="text-xs text-destructive">
                      {errFornecedor}
                    </span>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingFornecedor}
                    onClick={criarFornecedor}
                  >
                    {savingFornecedor ? 'Salvando...' : 'Adicionar'}
                  </Button>
                  <div className="space-y-2 pt-2">
                    {(lookups.fornecedores ?? []).map((item) => (
                      <LinhaLookup
                        key={item.id}
                        item={item}
                        api={somenteEpi ? fornecedoresEpiApi : fornecedoresApi}
                        aoSalvar={relerLookups}
                        extra={<ItemFornecedor item={item} />}
                      />
                    ))}
                    {(lookups.fornecedores ?? []).length === 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        Nenhum fornecedor cadastrado.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
