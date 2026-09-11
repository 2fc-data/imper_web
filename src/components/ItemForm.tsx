import { type FormEvent, useMemo } from 'react';
import type { EpiLookups, EquipamentoLookups } from '../lib/api';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

const textareaClasses =
  'flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

const selectClasses =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

export interface ItemFormData {
  codigo: string;
  nome?: string;
  descricao?: string;
  numeroPatrimonio?: string;
  modelo?: string;
  numeroSerie?: string;
  numeroCa?: string;
  dataValidade?: string;
  quantidade?: number;
  quantidadeMinima?: number;
  marcaId?: number;
  categoriaId?: number;
  subcategoriaId?: number;
  localizacaoId?: number;
  fornecedorId?: number;
  unidadeMedidaId?: number;
  statusId?: number;
  estadoConservacaoId?: number;
  dataAquisicao?: string;
  valorAquisicao?: number;
  dataGarantia?: string;
  observacoes?: string;
}

interface ItemFormProps {
  tipo: 'EQUIPAMENTO' | 'EPI';
  editando: boolean;
  saving: boolean;
  form: ItemFormData;
  setForm: (form: ItemFormData) => void;
  lookups: EquipamentoLookups | EpiLookups | null;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export function ItemForm({
  tipo,
  editando,
  saving,
  form,
  setForm,
  lookups,
  onSubmit,
  onCancel,
}: ItemFormProps) {
  const isEpi = tipo === 'EPI';

  const subcategorias = useMemo(
    () => (lookups?.subcategorias ?? []).filter((s) => s.ativo),
    [lookups],
  );

  const subcategoriasDaCategoria = useMemo(
    () => subcategorias.filter((s) => s.categoriaId === form.categoriaId),
    [subcategorias, form.categoriaId],
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {editando
            ? `Editar ${isEpi ? 'EPI' : 'Equipamento'}`
            : `Novo ${isEpi ? 'EPI' : 'Equipamento'}`}
        </CardTitle>
        <CardDescription>
          Preencha os dados. Os campos com asterisco (*) são obrigatórios.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                required
                minLength={2}
                placeholder={isEpi ? 'EPI-001' : 'EQ-001'}
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              />
            </div>

            {isEpi ? (
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                <Label htmlFor="nome">Nome do EPI *</Label>
                <Input
                  id="nome"
                  required
                  minLength={2}
                  placeholder="Ex.: Capacete de segurança"
                  value={form.nome ?? ''}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
            ) : (
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  required
                  minLength={3}
                  placeholder="Ex.: Compressor de ar 100L"
                  value={form.descricao ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, descricao: e.target.value })
                  }
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="numeroPatrimonio">Nº de patrimônio</Label>
              <Input
                id="numeroPatrimonio"
                placeholder="Opcional"
                value={form.numeroPatrimonio ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    numeroPatrimonio: e.target.value || undefined,
                  })
                }
              />
            </div>

            {!isEpi && (
              <div className="space-y-1.5">
                <Label htmlFor="statusId">Status *</Label>
                <select
                  id="statusId"
                  required
                  value={form.statusId || ''}
                  onChange={(e) =>
                    setForm({ ...form, statusId: Number(e.target.value) })
                  }
                  className={selectClasses}
                >
                  <option value="" disabled>
                    Selecione...
                  </option>
                  {[...(lookups?.statuses ?? [])]
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {!isEpi && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input
                    id="modelo"
                    placeholder="Opcional"
                    value={form.modelo ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, modelo: e.target.value || undefined })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="numeroSerie">Nº de série</Label>
                  <Input
                    id="numeroSerie"
                    placeholder="Opcional"
                    value={form.numeroSerie ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        numeroSerie: e.target.value || undefined,
                      })
                    }
                  />
                </div>
              </>
            )}

            {isEpi && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="numeroCa">Número do CA</Label>
                  <Input
                    id="numeroCa"
                    placeholder="Opcional"
                    value={form.numeroCa ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        numeroCa: e.target.value || undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dataValidade">Data de Validade</Label>
                  <Input
                    id="dataValidade"
                    type="datetime-local"
                    value={form.dataValidade ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, dataValidade: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quantidade">Quantidade *</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    required
                    min={0}
                    step="0.001"
                    value={form.quantidade ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        quantidade:
                          e.target.value === ''
                            ? undefined
                            : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quantidadeMinima">Qtde. Mínima</Label>
                  <Input
                    id="quantidadeMinima"
                    type="number"
                    min={0}
                    step="0.001"
                    value={form.quantidadeMinima ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        quantidadeMinima:
                          e.target.value === ''
                            ? undefined
                            : Number(e.target.value),
                      })
                    }
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="marcaId">Marca</Label>
              <select
                id="marcaId"
                value={form.marcaId ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    marcaId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                className={selectClasses}
              >
                <option value="">Sem marca</option>
                {[...(lookups?.marcas ?? [])]
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="categoriaId">Categoria</Label>
              <select
                id="categoriaId"
                value={form.categoriaId ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    categoriaId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                    subcategoriaId: undefined,
                  })
                }
                className={selectClasses}
              >
                <option value="">Sem categoria</option>
                {[...(lookups?.categorias ?? [])]
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subcategoriaId">Subcategoria</Label>
              <select
                id="subcategoriaId"
                value={form.subcategoriaId ?? ''}
                disabled={!form.categoriaId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    subcategoriaId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                className={selectClasses}
              >
                <option value="">Selecione a categoria primeiro</option>
                {[...subcategoriasDaCategoria]
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="localizacaoId">Localização</Label>
              <select
                id="localizacaoId"
                value={form.localizacaoId ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    localizacaoId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                className={selectClasses}
              >
                <option value="">Sem localização</option>
                {[...(lookups?.localizacoes ?? [])]
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fornecedorId">Fornecedor</Label>
              <select
                id="fornecedorId"
                value={form.fornecedorId ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    fornecedorId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                className={selectClasses}
              >
                <option value="">Sem fornecedor</option>
                {[...(lookups?.fornecedores ?? [])]
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unidadeMedidaId">Unidade de Medida</Label>
              <select
                id="unidadeMedidaId"
                value={form.unidadeMedidaId ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    unidadeMedidaId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                className={selectClasses}
              >
                <option value="">Sem unidade</option>
                {[...(lookups?.unidadesMedida ?? [])]
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
              </select>
            </div>

            {!isEpi && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="estadoConservacaoId">
                    Estado de conservação
                  </Label>
                  <select
                    id="estadoConservacaoId"
                    value={form.estadoConservacaoId ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        estadoConservacaoId: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    className={selectClasses}
                  >
                    <option value="">Sem estado</option>
                    {[...(lookups?.estadosConservacao ?? [])]
                      .sort((a, b) => a.nome.localeCompare(b.nome))
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nome}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dataAquisicao">Data de aquisição</Label>
                  <Input
                    id="dataAquisicao"
                    type="datetime-local"
                    value={form.dataAquisicao ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, dataAquisicao: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="valorAquisicao">
                    Valor de aquisição (R$)
                  </Label>
                  <Input
                    id="valorAquisicao"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0,00"
                    value={form.valorAquisicao ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        valorAquisicao:
                          e.target.value === ''
                            ? undefined
                            : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dataGarantia">Fim da garantia</Label>
                  <Input
                    id="dataGarantia"
                    type="datetime-local"
                    value={form.dataGarantia ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, dataGarantia: e.target.value })
                    }
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="observacoes">Observações</Label>
            <textarea
              id="observacoes"
              placeholder="Opcional"
              className={textareaClasses}
              value={form.observacoes ?? ''}
              onChange={(e) =>
                setForm({ ...form, observacoes: e.target.value || undefined })
              }
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving
                ? 'Salvando...'
                : editando
                  ? 'Salvar alterações'
                  : 'Cadastrar'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
