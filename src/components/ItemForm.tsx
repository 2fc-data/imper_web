import { type FormEvent, useMemo, useEffect, useState } from 'react';
import type { EpiLookups, EquipamentoLookups } from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { selectClasses, textareaClasses } from './ui/form-classes';
import type { PatrimoniosDisponiveis } from '../lib/api/equipamentos';
import { obterPatrimoniosDisponiveis } from '../lib/api/equipamentos';

export interface ItemFormData {
  codigo: string;
  nome?: string;
  descricao?: string;
  numeroPatrimonio?: string;
  modelo?: string;
  numeroSerie?: string;
  numeroCa?: string;
  dataValidade?: string;
  custoUnitario?: number;
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

  const [patrimonios, setPatrimonios] = useState<PatrimoniosDisponiveis | null>(null);

  useEffect(() => {
    if (!isEpi) {
      obterPatrimoniosDisponiveis().then(setPatrimonios);
    }
  }, [isEpi]);

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-4 border-b border-border/40">
        <CardTitle className="text-base font-semibold tracking-tight">
          {editando ? `Editar ${isEpi ? 'EPI' : 'Equipamento'}` : `Novo ${isEpi ? 'EPI' : 'Equipamento'}`}
        </CardTitle>
        <CardDescription>
          Preencha as informações abaixo. Os campos marcados com{' '}
          <span className="text-destructive/80 font-bold">*</span> são obrigatórios.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Código */}
            <div className="space-y-1.5 sm:col-span-1 lg:col-span-1">
              <Label htmlFor="codigo" required>
                Código
              </Label>
              <Input
                id="codigo"
                readOnly
                placeholder={isEpi ? 'EPI-001' : 'EQP-001'}
                value={form.codigo}
                className="bg-muted/50 cursor-not-allowed font-mono text-xs"
              />
            </div>

            {/* Nome (EPI) / Descrição (Equipamento) */}
            {isEpi ? (
              <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
                <Label htmlFor="nome" required>
                  Descrição
                </Label>
                <Input
                  id="nome"
                  required
                  minLength={2}
                  placeholder="Ex.: Capacete de segurança com carneira"
                  value={form.nome ?? ''}
                  onChange={(e) => setForm({ ...form, nome: e.target.value.toUpperCase() })}
                />
              </div>
            ) : (
              <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
                <Label htmlFor="descricao" required>
                  Descrição
                </Label>
                <Input
                  id="descricao"
                  required
                  minLength={3}
                  placeholder="Ex.: Compressor de ar 100L monofásico"
                  value={form.descricao ?? ''}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value.toUpperCase() })}
                />
              </div>
            )}

            {/* Linha 2 EPI: Patrimônio, CA e Validade */}
            {isEpi && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="numeroPatrimonio">Nº de Patrimônio</Label>
                  <Input
                    id="numeroPatrimonio"
                    placeholder="Opcional"
                    value={form.numeroPatrimonio ?? ''}
                    onChange={(e) => setForm({ ...form, numeroPatrimonio: e.target.value || undefined })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="numeroCa">Número do CA</Label>
                  <Input
                    id="numeroCa"
                    placeholder="Ex.: 12345"
                    value={form.numeroCa ?? ''}
                    onChange={(e) => setForm({ ...form, numeroCa: e.target.value || undefined })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dataValidade">Data de Validade</Label>
                  <Input
                    id="dataValidade"
                    type="datetime-local"
                    value={form.dataValidade ?? ''}
                    onChange={(e) => setForm({ ...form, dataValidade: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Linha 2 Equipamento: Patrimônio, Status e Conservação */}
            {!isEpi && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="numeroPatrimonio">Nº de Patrimônio</Label>
                  <select
                    id="numeroPatrimonio"
                    className={selectClasses}
                    value={form.numeroPatrimonio ?? ''}
                    onChange={(e) => setForm({ ...form, numeroPatrimonio: e.target.value || undefined })}
                  >
                    <option value="">Sem patrimônio</option>
                    {patrimonios?.disponiveis.map((num) => (
                      <option key={num} value={num.toString()}>{num}</option>
                    ))}
                    {patrimonios && (
                      <option key={patrimonios.proximo} value={patrimonios.proximo.toString()}>
                        {patrimonios.proximo} (Próximo na sequência)
                      </option>
                    )}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="statusId" required>
                    Status
                  </Label>
                  <select
                    id="statusId"
                    required
                    value={form.statusId || ''}
                    onChange={(e) => setForm({ ...form, statusId: Number(e.target.value) })}
                    className={selectClasses}
                  >
                    <option value="" disabled>Selecione um status...</option>
                    {[...(lookups?.statuses ?? [])]
                      .sort((a, b) => a.nome.localeCompare(b.nome))
                      .map((s) => (
                        <option key={s.id} value={s.id}>{s.nome}</option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="estadoConservacaoId">Estado de Conservação</Label>
                  <select
                    id="estadoConservacaoId"
                    value={form.estadoConservacaoId ?? ''}
                    onChange={(e) => setForm({
                      ...form,
                      estadoConservacaoId: e.target.value ? Number(e.target.value) : undefined,
                    })}
                    className={selectClasses}
                  >
                    <option value="">Sem estado definido</option>
                    {[...(lookups?.estadosConservacao ?? [])]
                      .sort((a, b) => a.nome.localeCompare(b.nome))
                      .map((s) => (
                        <option key={s.id} value={s.id}>{s.nome}</option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input
                    id="modelo"
                    placeholder="Opcional"
                    value={form.modelo ?? ''}
                    onChange={(e) => setForm({ ...form, modelo: e.target.value || undefined })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="numeroSerie">Nº de Série</Label>
                  <Input
                    id="numeroSerie"
                    placeholder="Opcional"
                    value={form.numeroSerie ?? ''}
                    onChange={(e) => setForm({ ...form, numeroSerie: e.target.value || undefined })}
                  />
                </div>
              </>
            )}

            {/* Estoque e Custos (EPI) */}
            {isEpi && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="quantidade" required>
                    Quantidade
                  </Label>
                  <Input
                    id="quantidade"
                    type="number"
                    required
                    min={0}
                    step="0.001"
                    placeholder="0"
                    value={form.quantidade ?? ''}
                    onChange={(e) => setForm({
                      ...form,
                      quantidade: e.target.value === '' ? undefined : Number(e.target.value),
                    })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quantidadeMinima">Qtde. Mínima</Label>
                  <Input
                    id="quantidadeMinima"
                    type="number"
                    min={0}
                    step="0.001"
                    placeholder="0"
                    value={form.quantidadeMinima ?? ''}
                    onChange={(e) => setForm({
                      ...form,
                      quantidadeMinima: e.target.value === '' ? undefined : Number(e.target.value),
                    })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="custoUnitario">Custo Unitário (R$)</Label>
                  <Input
                    id="custoUnitario"
                    type="number"
                    min={0}
                    step="any"
                    placeholder="0,00"
                    value={form.custoUnitario ?? ''}
                    onChange={(e) => setForm({
                      ...form,
                      custoUnitario: e.target.value === '' ? undefined : Number(e.target.value),
                    })}
                  />
                </div>
              </>
            )}

            {/* Classificação: Marca, Categoria e Subcategoria */}
            <div className="space-y-1.5">
              <Label htmlFor="marcaId">Marca</Label>
              <select
                id="marcaId"
                value={form.marcaId ?? ''}
                onChange={(e) => setForm({ ...form, marcaId: e.target.value ? Number(e.target.value) : undefined })}
                className={selectClasses}
              >
                <option value="">Sem marca</option>
                {[...(lookups?.marcas ?? [])]
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((m) => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="categoriaId">Categoria</Label>
              <select
                id="categoriaId"
                value={form.categoriaId ?? ''}
                onChange={(e) => setForm({
                  ...form,
                  categoriaId: e.target.value ? Number(e.target.value) : undefined,
                  subcategoriaId: undefined,
                })}
                className={selectClasses}
              >
                <option value="">Sem categoria</option>
                {[...(lookups?.categorias ?? [])]
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subcategoriaId">Subcategoria</Label>
              <select
                id="subcategoriaId"
                value={form.subcategoriaId ?? ''}
                disabled={!form.categoriaId}
                onChange={(e) => setForm({
                  ...form,
                  subcategoriaId: e.target.value ? Number(e.target.value) : undefined,
                })}
                className={selectClasses}
              >
                <option value="">{form.categoriaId ? 'Selecione uma subcategoria...' : 'Selecione a categoria primeiro'}</option>
                {[...subcategoriasDaCategoria]
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((s) => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
              </select>
            </div>

            {/* Operacional: Localização, Fornecedor e Unidade de Medida */}
            <div className="space-y-1.5">
              <Label htmlFor="localizacaoId">Localização</Label>
              <select
                id="localizacaoId"
                value={form.localizacaoId ?? ''}
                onChange={(e) => setForm({
                  ...form,
                  localizacaoId: e.target.value ? Number(e.target.value) : undefined,
                })}
                className={selectClasses}
              >
                <option value="">Sem localização</option>
                {[...(lookups?.localizacoes ?? [])]
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((l) => (
                    <option key={l.id} value={l.id}>{l.nome}</option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fornecedorId">Fornecedor</Label>
              <select
                id="fornecedorId"
                value={form.fornecedorId ?? ''}
                onChange={(e) => setForm({
                  ...form,
                  fornecedorId: e.target.value ? Number(e.target.value) : undefined,
                })}
                className={selectClasses}
              >
                <option value="">Sem fornecedor</option>
                {[...(lookups?.fornecedores ?? [])]
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((f) => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unidadeMedidaId">Unidade de Medida</Label>
              <select
                id="unidadeMedidaId"
                value={form.unidadeMedidaId ?? ''}
                onChange={(e) => setForm({
                  ...form,
                  unidadeMedidaId: e.target.value ? Number(e.target.value) : undefined,
                })}
                className={selectClasses}
              >
                <option value="">Sem unidade</option>
                {[...(lookups?.unidadesMedida ?? [])]
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((u) => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                  ))}
              </select>
            </div>

            {/* Dados Financeiros / Garantia */}
            <div className="space-y-1.5">
              <Label htmlFor="dataAquisicao">Data de Aquisição</Label>
              <Input
                id="dataAquisicao"
                type="datetime-local"
                value={form.dataAquisicao ?? ''}
                onChange={(e) => setForm({ ...form, dataAquisicao: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="valorAquisicao">Valor de Aquisição (R$)</Label>
              <Input
                id="valorAquisicao"
                type="number"
                min={0}
                step="0.01"
                placeholder="0,00"
                value={form.valorAquisicao ?? ''}
                onChange={(e) => setForm({
                  ...form,
                  valorAquisicao: e.target.value === '' ? undefined : Number(e.target.value),
                })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dataGarantia">Fim da Garantia</Label>
              <Input
                id="dataGarantia"
                type="datetime-local"
                value={form.dataGarantia ?? ''}
                onChange={(e) => setForm({ ...form, dataGarantia: e.target.value })}
              />
            </div>

            {/* Observações: largura total */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="observacoes">Observações</Label>
              <textarea
                id="observacoes"
                placeholder="Informações adicionais, particularidades ou histórico..."
                className={textareaClasses}
                value={form.observacoes ?? ''}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value || undefined })}
              />
            </div>
          </div>

          {/* Barra de Ações do Formulário (Alinhada à direita no desktop, total no mobile) */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-5 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 mr-1.5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto shadow-sm"
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {editando ? 'Salvar alterações' : 'Cadastrar'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
