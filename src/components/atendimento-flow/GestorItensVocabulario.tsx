import { useEffect, useState } from 'react';
import {
  type AtendimentoItemVocabulario,
  type UnidadeMedida,
  unidadesMedidaApi,
  type VisitaItemVocabulario,
} from '../../lib/api';
import { CascataVocabulario } from '../orcamentos/CascataVocabulario';
import {
  btnPerigoClasses,
  btnPrimarioClasses,
  cascataVazia,
  inputClasses,
  labelClasses,
  selectClasses,
  type ValorCascata,
} from '../orcamentos/tipos';

export interface NovoItemVocabularioInput {
  etapaId: number;
  subServicoId: number;
  verboId: number;
  objetoId: number;
  localId?: number | null;
  caracteristicaId?: number | null;
  unidadeId?: number | null;
  quantidade?: number | null;
  areaM2?: number | null;
  observacoes?: string | null;
}

interface Props {
  modo: 'atendimento' | 'visita';
  itens: (AtendimentoItemVocabulario | VisitaItemVocabulario)[];
  onAdicionar: (item: NovoItemVocabularioInput) => Promise<void>;
  onRemover: (id: number) => Promise<void>;
  disabled?: boolean;
}

export function GestorItensVocabulario({
  modo,
  itens,
  onAdicionar,
  onRemover,
  disabled = false,
}: Props) {
  const [cascata, setCascata] = useState<ValorCascata>(cascataVazia());
  const [areaM2, setAreaM2] = useState<string>('');
  const [quantidade, setQuantidade] = useState<string>('');
  const [unidadeId, setUnidadeId] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [unidades, setUnidades] = useState<UnidadeMedida[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [removendoId, setRemovendoId] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (modo === 'visita') {
      unidadesMedidaApi
        .listar()
        .then((res) => setUnidades(res))
        .catch(() => {});
    }
  }, [modo]);

  const podeAdicionar =
    cascata.etapaId != null &&
    cascata.subServicoId != null &&
    cascata.verboId != null &&
    cascata.objetoId != null;

  const handleAdicionar = async () => {
    if (!podeAdicionar || salvando || disabled) return;
    setSalvando(true);
    setErro(null);

    try {
      await onAdicionar({
        etapaId: cascata.etapaId!,
        subServicoId: cascata.subServicoId!,
        verboId: cascata.verboId!,
        objetoId: cascata.objetoId!,
        localId: cascata.localId,
        caracteristicaId: cascata.caracteristicaId,
        unidadeId: unidadeId ? Number(unidadeId) : null,
        quantidade: quantidade ? Number(quantidade) : null,
        areaM2: areaM2 ? Number(areaM2) : null,
        observacoes: observacoes.trim() || null,
      });

      // Limpa os campos do formulário
      setCascata(cascataVazia());
      setAreaM2('');
      setQuantidade('');
      setUnidadeId('');
      setObservacoes('');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao adicionar item');
    } finally {
      setSalvando(false);
    }
  };

  const handleRemover = async (id: number) => {
    if (removendoId !== null || disabled) return;
    setRemovendoId(id);
    setErro(null);
    try {
      await onRemover(id);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao remover item');
    } finally {
      setRemovendoId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {modo === 'visita'
              ? 'Levantamento Técnico da Vistoria'
              : 'Classificação de Serviço (Vocabulário)'}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {itens.length} {itens.length === 1 ? 'item registrado' : 'itens registrados'}
          </span>
        </div>

        {/* Seletor de Vocabulário Cascata */}
        <CascataVocabulario
          valor={cascata}
          onChange={setCascata}
          modo="completa"
        />

        {/* Campos extras para Visita (Medições) */}
        {modo === 'visita' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-1">
            <div>
              <label className={labelClasses}>Área (m²)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 85.5"
                value={areaM2}
                onChange={(e) => setAreaM2(e.target.value)}
                disabled={disabled || salvando}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Quantidade</label>
              <input
                type="number"
                step="0.001"
                min="0"
                placeholder="Ex: 1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                disabled={disabled || salvando}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Unidade de Medida</label>
              <select
                value={unidadeId}
                onChange={(e) => setUnidadeId(e.target.value)}
                disabled={disabled || salvando}
                className={selectClasses}
              >
                <option value="">Selecione...</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Observações do Item */}
        <div>
          <label className={labelClasses}>Observações do item</label>
          <input
            type="text"
            placeholder={
              modo === 'visita'
                ? 'Ex: Fissura de 2mm com umidade ascendente detectada'
                : 'Ex: Cliente relatou goteira no teto do quarto'
            }
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            disabled={disabled || salvando}
            className={inputClasses}
          />
        </div>

        {erro && <p className="text-xs text-destructive">{erro}</p>}

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleAdicionar}
            disabled={!podeAdicionar || salvando || disabled}
            className={btnPrimarioClasses}
          >
            {salvando ? 'Adicionando…' : '+ Adicionar Serviço'}
          </button>
        </div>
      </div>

      {/* Lista de Itens Cadastrados */}
      {itens.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-background/50">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-semibold">Etapa / Sub-serviço</th>
                <th className="px-3 py-2 font-semibold">Termos</th>
                {modo === 'visita' && (
                  <th className="px-3 py-2 font-semibold">Medições</th>
                )}
                <th className="px-3 py-2 font-semibold">Observações</th>
                <th className="px-3 py-2 text-right font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {itens.map((it) => {
                const etapaNome = it.etapa?.nome ?? `Etapa #${it.etapaId}`;
                const subNome = it.subServico?.nome ?? `Sub #${it.subServicoId}`;
                const termos = [
                  it.verbo?.nome ?? `Verbo #${it.verboId}`,
                  it.objeto?.nome ?? `Objeto #${it.objetoId}`,
                  it.local?.nome,
                  it.caracteristica?.nome,
                ]
                  .filter(Boolean)
                  .join(' · ');

                const visitaIt = modo === 'visita' ? (it as VisitaItemVocabulario) : null;

                return (
                  <tr key={it.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 font-medium text-foreground">
                      <div>{subNome}</div>
                      <div className="text-[10px] text-muted-foreground">{etapaNome}</div>
                    </td>
                    <td className="px-3 py-2 text-foreground">{termos}</td>
                    {modo === 'visita' && (
                      <td className="px-3 py-2 text-foreground">
                        {visitaIt?.areaM2 != null && (
                          <span className="font-medium mr-2">
                            {Number(visitaIt.areaM2)} m²
                          </span>
                        )}
                        {visitaIt?.quantidade != null && (
                          <span className="text-muted-foreground">
                            qtd: {Number(visitaIt.quantidade)}{' '}
                            {visitaIt.unidade?.nome ?? ''}
                          </span>
                        )}
                        {visitaIt?.areaM2 == null && visitaIt?.quantidade == null && (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-3 py-2 text-muted-foreground max-w-xs truncate">
                      {it.observacoes || '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemover(it.id)}
                        disabled={removendoId === it.id || disabled}
                        className="rounded px-2 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        {removendoId === it.id ? '…' : 'Remover'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
