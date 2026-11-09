import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  dispararWhatsappPlanejamento,
  obterPlanejamentoObra,
  salvarPlanejamentoObra,
  type DadosPlanejamentoObra,
  type PlanejamentoAtividadeItem,
  type SalvarPlanejamentoPayload,
} from '../../lib/api/planejamento';
import { api } from '../../lib/api';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { StatusBadge } from '../ui/StatusBadge';
import {
  MultiSelectColaboradores,
  filtrarApenasColaboradores,
} from './MultiSelectColaboradores';

interface PlanejamentoObraProps {
  obraId: number;
  onObraAtualizada?: () => void;
}

interface AtividadeFormState {
  atividadeId: string;
  colaboradorId: number | null;
  colaboradoresIds: number[];
  dataPrevisao: string;
  dataDisparoWhatsapp: string;
  veiculoId: number | null;
  materiais: Array<{ materialId: number; quantidade: number }>;
  epis: Array<{ epiId: number; quantidade: number }>;
  equipamentos: Array<{ equipamentoId: number }>;
}

function montarDescricaoAtividade(ativ: PlanejamentoAtividadeItem): string {
  const termos = [ativ.verbo?.nome, ativ.objeto?.nome]
    .filter((p): p is string => Boolean(p && p.trim()))
    .join(' ');
  if (!termos) return ativ.descricao?.trim() || '—';

  let texto = termos;
  if (ativ.local?.nome?.trim()) texto += ` ${ativ.local.nome.trim()}`;
  if (ativ.caracteristica?.nome?.trim()) {
    texto += ` — ${ativ.caracteristica.nome.trim()}`;
  }
  if (ativ.descricao?.trim()) texto += ` · ${ativ.descricao.trim()}`;
  return texto;
}

function paraDateTimeLocal(valor?: string | null): string {
  if (!valor) return '';
  const dt = new Date(valor);
  if (Number.isNaN(dt.getTime())) return '';
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  const hh = String(dt.getHours()).padStart(2, '0');
  const min = String(dt.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function PlanejamentoObra({ obraId, onObraAtualizada }: PlanejamentoObraProps) {
  const [dados, setDados] = useState<DadosPlanejamentoObra | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [disparando, setDisparando] = useState(false);
  const [concluindoObra, setConcluindoObra] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  // Estados do formulário
  const [dataInicioPrevista, setDataInicioPrevista] = useState<string>('');
  const [atividadesState, setAtividadesState] = useState<
    Record<string, AtividadeFormState>
  >({});
  const [insumosAbertos, setInsumosAbertos] = useState<Record<string, boolean>>(
    {},
  );

  // Estados para adição de itens extras e busca de equipamentos
  const [adicionandoMaterialAtiv, setAdicionandoMaterialAtiv] = useState<string | null>(null);
  const [materialSelecionadoParaAdd, setMaterialSelecionadoParaAdd] = useState<number | ''>('');

  const [adicionandoEpiAtiv, setAdicionandoEpiAtiv] = useState<string | null>(null);
  const [epiSelecionadoParaAdd, setEpiSelecionadoParaAdd] = useState<number | ''>('');

  const [buscaEquipamentoPorAtiv, setBuscaEquipamentoPorAtiv] = useState<
    Record<string, string>
  >({});

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await obterPlanejamentoObra(obraId);
      setDados(res);

      if (res.obra.dataInicioPrevista) {
        setDataInicioPrevista(
          new Date(res.obra.dataInicioPrevista).toISOString().split('T')[0],
        );
      }
      // Prepara estado inicial das atividades
      const estadoAtivs: Record<string, AtividadeFormState> = {};
      for (const etapa of res.obra.etapas) {
        for (const ativ of etapa.atividades) {
          const exec = ativ.execucoes?.[0];
          const separacaoItens = exec?.separacoes?.[0]?.itens ?? [];

          // Regra 2: Traga apenas os Materiais ou EPIs selecionados na obra durante o orçamento
          // Se já tem itens na separação, carrega deles; senão, carrega estritamente os materiais orçados da atividade
          let mats: Array<{ materialId: number; quantidade: number }> = [];
          if (separacaoItens.length > 0) {
            mats = separacaoItens
              .filter((i) => i.materialId != null)
              .map((i) => ({
                materialId: i.materialId!,
                quantidade: Number(i.quantidadeNecessaria),
              }));
          } else if (ativ.materiais?.length) {
            mats = ativ.materiais.map((m) => ({
              materialId: m.materialId,
              quantidade: Number(m.quantidade),
            }));
          }

          const epis = separacaoItens
            .filter((i) => i.epiId != null)
            .map((i) => ({
              epiId: i.epiId!,
              quantidade: Number(i.quantidadeNecessaria),
            }));

          const equipamentos = separacaoItens
            .filter((i) => i.equipamentoId != null)
            .map((i) => ({
              equipamentoId: i.equipamentoId!,
            }));

          const colabIds = Array.from(
            new Set(
              (ativ.execucoes ?? [])
                .filter((e) => e.status !== 'CANCELADA' && e.atribuidoAId != null)
                .map((e) => e.atribuidoAId as number),
            ),
          );

          estadoAtivs[ativ.id] = {
            atividadeId: ativ.id,
            colaboradorId: colabIds[0] ?? null,
            colaboradoresIds: colabIds,
            dataPrevisao: exec?.dataPrevisao
              ? new Date(exec.dataPrevisao).toISOString().split('T')[0]
              : '',
            dataDisparoWhatsapp: paraDateTimeLocal(ativ.dataDisparoWhatsapp),
            veiculoId: exec?.veiculoId ?? null,
            materiais: mats,
            epis,
            equipamentos,
          };
        }
      }
      setAtividadesState(estadoAtivs);
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : 'Falha ao carregar planejamento da obra',
      );
    } finally {
      setCarregando(false);
    }
  }, [obraId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Garante que somente usuários com papéis de colaboradores sejam apresentados na seleção (Hook no topo do componente)
  const colaboradoresEspecialistas = useMemo(() => {
    return filtrarApenasColaboradores(dados?.catalogos?.colaboradores ?? []);
  }, [dados?.catalogos?.colaboradores]);

  const toggleInsumos = (ativId: string) => {
    setInsumosAbertos((prev) => ({ ...prev, [ativId]: !prev[ativId] }));
  };

  const atualizarColaboradoresAtividade = (
    ativId: string,
    ids: number[],
  ) => {
    setAtividadesState((prev) => ({
      ...prev,
      [ativId]: {
        ...prev[ativId],
        colaboradoresIds: ids,
        colaboradorId: ids[0] ?? null,
      },
    }));
  };

  const atualizarAtividadeCampo = <
    K extends 'colaboradorId' | 'veiculoId' | 'dataDisparoWhatsapp',
  >(
    ativId: string,
    campo: K,
    valor: AtividadeFormState[K],
  ) => {
    setAtividadesState((prev) => ({
      ...prev,
      [ativId]: {
        ...prev[ativId],
        [campo]: valor,
        ...(campo === 'colaboradorId' && {
          colaboradoresIds: valor ? [Number(valor)] : [],
        }),
      },
    }));
  };

  const atualizarQtdMaterial = (
    ativId: string,
    materialId: number,
    qtd: number,
  ) => {
    setAtividadesState((prev) => {
      const ativ = prev[ativId];
      if (!ativ) return prev;
      const novos = ativ.materiais.map((m) =>
        m.materialId === materialId ? { ...m, quantidade: qtd } : m,
      );
      return {
        ...prev,
        [ativId]: { ...ativ, materiais: novos },
      };
    });
  };

  const removerMaterial = (ativId: string, materialId: number) => {
    setAtividadesState((prev) => {
      const ativ = prev[ativId];
      if (!ativ) return prev;
      return {
        ...prev,
        [ativId]: {
          ...ativ,
          materiais: ativ.materiais.filter((m) => m.materialId !== materialId),
        },
      };
    });
  };

  const adicionarMaterialExtra = (ativId: string, materialId: number) => {
    setAtividadesState((prev) => {
      const ativ = prev[ativId];
      if (!ativ) return prev;
      if (ativ.materiais.some((m) => m.materialId === materialId)) {
        return prev;
      }
      return {
        ...prev,
        [ativId]: {
          ...ativ,
          materiais: [...ativ.materiais, { materialId, quantidade: 1 }],
        },
      };
    });
    setAdicionandoMaterialAtiv(null);
    setMaterialSelecionadoParaAdd('');
  };

  const atualizarQtdEpi = (ativId: string, epiId: number, qtd: number) => {
    setAtividadesState((prev) => {
      const ativ = prev[ativId];
      if (!ativ) return prev;
      const novos = ativ.epis.map((e) =>
        e.epiId === epiId ? { ...e, quantidade: qtd } : e,
      );
      return {
        ...prev,
        [ativId]: { ...ativ, epis: novos },
      };
    });
  };

  const removerEpi = (ativId: string, epiId: number) => {
    setAtividadesState((prev) => {
      const ativ = prev[ativId];
      if (!ativ) return prev;
      return {
        ...prev,
        [ativId]: {
          ...ativ,
          epis: ativ.epis.filter((e) => e.epiId !== epiId),
        },
      };
    });
  };

  const adicionarEpiExtra = (ativId: string, epiId: number) => {
    setAtividadesState((prev) => {
      const ativ = prev[ativId];
      if (!ativ) return prev;
      if (ativ.epis.some((e) => e.epiId === epiId)) {
        return prev;
      }
      return {
        ...prev,
        [ativId]: {
          ...ativ,
          epis: [...ativ.epis, { epiId, quantidade: 1 }],
        },
      };
    });
    setAdicionandoEpiAtiv(null);
    setEpiSelecionadoParaAdd('');
  };

  const adicionarEquipamento = (ativId: string, equipamentoId: number) => {
    setAtividadesState((prev) => {
      const ativ = prev[ativId];
      if (!ativ) return prev;
      if (ativ.equipamentos.some((e) => e.equipamentoId === equipamentoId)) {
        return prev;
      }
      return {
        ...prev,
        [ativId]: {
          ...ativ,
          equipamentos: [...ativ.equipamentos, { equipamentoId }],
        },
      };
    });
    // Limpa a busca
    setBuscaEquipamentoPorAtiv((prev) => ({ ...prev, [ativId]: '' }));
  };

  const removerEquipamento = (ativId: string, equipamentoId: number) => {
    setAtividadesState((prev) => {
      const ativ = prev[ativId];
      if (!ativ) return prev;
      return {
        ...prev,
        [ativId]: {
          ...ativ,
          equipamentos: ativ.equipamentos.filter(
            (eq) => eq.equipamentoId !== equipamentoId,
          ),
        },
      };
    });
  };

  const salvar = async (dispararAgora = false) => {
    setSalvando(true);
    setErro(null);
    setSucesso(null);
    try {
      const payload: SalvarPlanejamentoPayload = {
        dataInicioPrevista: dataInicioPrevista
          ? new Date(dataInicioPrevista).toISOString()
          : null,
        dispararAgora,
        atividades: Object.values(atividadesState).map((a) => {
          const cIds =
            a.colaboradoresIds && a.colaboradoresIds.length > 0
              ? a.colaboradoresIds
              : a.colaboradorId
                ? [Number(a.colaboradorId)]
                : [];
          return {
            atividadeId: a.atividadeId,
            colaboradorId: cIds[0] ?? null,
            colaboradoresIds: cIds,
            dataPrevisao: a.dataPrevisao
              ? new Date(a.dataPrevisao).toISOString()
              : null,
            dataDisparoWhatsapp: a.dataDisparoWhatsapp
              ? new Date(a.dataDisparoWhatsapp).toISOString()
              : null,
            veiculoId: a.veiculoId ? Number(a.veiculoId) : null,
            materiais: a.materiais.filter((m) => m.quantidade > 0),
            epis: a.epis.filter((e) => e.quantidade > 0),
            equipamentos: a.equipamentos,
          };
        }),
      };

      await salvarPlanejamentoObra(obraId, payload);
      setSucesso(
        dispararAgora
          ? 'Planejamento salvo e mensagens de WhatsApp disparadas com sucesso!'
          : 'Planejamento de execução salvo com sucesso!',
      );
      await carregar();
      onObraAtualizada?.();
    } catch (err) {
      setErro(
        err instanceof Error ? err.message : 'Falha ao salvar planejamento',
      );
    } finally {
      setSalvando(false);
    }
  };

  const dispararManual = async () => {
    setDisparando(true);
    setErro(null);
    setSucesso(null);
    try {
      const res = await dispararWhatsappPlanejamento(obraId);
      setSucesso(
        `Disparo concluído: ${res.enviosSucesso} de ${res.totalColaboradores} colaboradores notificados.`,
      );
      await carregar();
      onObraAtualizada?.();
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : 'Falha ao disparar mensagens WhatsApp',
      );
    } finally {
      setDisparando(false);
    }
  };

  const concluirObra = async () => {
    if (!dados) return;
    if (
      !window.confirm(
        `Confirmar a conclusão formal da Obra ${dados.obra.codigo}? Todas as atividades foram realizadas.`,
      )
    ) {
      return;
    }

    setConcluindoObra(true);
    setErro(null);
    setSucesso(null);
    try {
      await api.post(`/obras/${obraId}/concluir`);
      setSucesso(`Obra ${dados.obra.codigo} concluída com sucesso! 🎉`);
      await carregar();
      onObraAtualizada?.();
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : 'Não foi possível concluir a obra.',
      );
    } finally {
      setConcluindoObra(false);
    }
  };

  if (carregando) {
    return (
      <div className="py-12 text-center text-muted-foreground animate-pulse">
        Carregando dados do planejamento de execução...
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="py-8 text-center text-destructive">
        {erro || 'Não foi possível carregar os dados da obra.'}
      </div>
    );
  }

  const { obra, catalogos } = dados;

  // Cálculos de Validação de Regras de Negócio
  const todasAtividades = obra.etapas.flatMap((e) => e.atividades);
  const totalAtividades = todasAtividades.length;

  // 1. O botão "Disparar WhatsApp Agora" só deve aparecer após as atividades serem distribuídas aos colaboradores
  const atividadesDistribuidasCount = todasAtividades.filter((a) => {
    const estado = atividadesState[a.id];
    return (
      (estado?.colaboradoresIds && estado.colaboradoresIds.length > 0) ||
      estado?.colaboradorId != null
    );
  }).length;
  const todasAtividadesDistribuidas =
    totalAtividades > 0 && atividadesDistribuidasCount === totalAtividades;

  // 4. O botão 'Concluir Obras' somente aparece após todas as atividades estarem concluídas
  const atividadesConcluidasCount = todasAtividades.filter((ativ) => {
    const execs = ativ.execucoes ?? [];
    return (
      execs.length > 0 && execs.every((ex) => ex.status === 'CONCLUIDA')
    );
  }).length;
  const todasAtividadesConcluidas =
    totalAtividades > 0 && atividadesConcluidasCount === totalAtividades;
  const podeConcluirObra =
    obra.status !== 'CONCLUIDA' &&
    obra.status !== 'CANCELADA' &&
    todasAtividadesConcluidas;

  return (
    <div className="space-y-6">
      {/* Mensagens de Sucesso ou Erro */}
      {sucesso && (
        <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-success font-medium">
          {sucesso}
        </div>
      )}
      {erro && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {erro}
        </div>
      )}

      {/* Cartão 1: Informações Gerais & Cronograma */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-lg">
                Planejamento de Execução — Obra {obra.codigo}
              </CardTitle>
              <CardDescription>
                Cliente: <span className="font-semibold text-foreground">{obra.cliente}</span> • {obra.enderecoCompleto}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={obra.status} />
              {podeConcluirObra && (
                <Button
                  type="button"
                  onClick={concluirObra}
                  disabled={concluindoObra}
                  className="bg-success text-success-foreground hover:bg-success/90 text-xs font-bold gap-1 shadow-sm"
                >
                  ✓ Concluir Obra
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="dataInicio">Data de Início da Obra</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicioPrevista}
                onChange={(e) => setDataInicioPrevista(e.target.value)}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Confirmação oficial do início das frentes de trabalho.
              </p>
            </div>

            {/* Regra 1: O botão 'Disparar WhatsApp Agora' só deve aparecer após as atividades serem distribuídas */}
            {todasAtividadesDistribuidas && (
              <div className="flex flex-col justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={dispararManual}
                  disabled={disparando || salvando}
                  className="w-full text-xs font-semibold hover:border-primary hover:text-primary"
                >
                  {disparando ? 'Disparando...' : '📲 Disparar WhatsApp Agora'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cartão 2: Atribuição de Tarefas por Etapa */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">
            Distribuição de Tarefas & Insumos das Etapas
          </h3>
          <span className="text-xs text-muted-foreground">
            {atividadesConcluidasCount}/{totalAtividades} atividades concluídas
          </span>
        </div>

        {obra.etapas.map((etapa) => (
          <Card key={etapa.id}>
            <CardHeader className="bg-muted/30 py-3 rounded-t-xl">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  <span className="mr-2 text-muted-foreground">#{etapa.ordem}</span>
                  {etapa.nome}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {etapa.atividades.length} atividades
                </span>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-border/60 p-0">
              {etapa.atividades.map((ativ) => {
                const formState = atividadesState[ativ.id] || {
                  atividadeId: ativ.id,
                  colaboradorId: null,
                  colaboradoresIds: [],
                  dataPrevisao: '',
                  dataDisparoWhatsapp: '',
                  veiculoId: null,
                  materiais: [],
                  epis: [],
                  equipamentos: [],
                };
                const expandido = Boolean(insumosAbertos[ativ.id]);
                const buscaEquip = buscaEquipamentoPorAtiv[ativ.id] || '';

                // Filtro para input com 3 letras de ferramentas/equipamentos
                const equipamentosFiltrados =
                  buscaEquip.trim().length >= 3
                    ? catalogos.equipamentos.filter(
                        (eq) =>
                          (eq.descricao.toLowerCase().includes(buscaEquip.toLowerCase()) ||
                            eq.codigo.toLowerCase().includes(buscaEquip.toLowerCase()) ||
                            (eq.modelo && eq.modelo.toLowerCase().includes(buscaEquip.toLowerCase()))) &&
                          !formState.equipamentos.some((e) => e.equipamentoId === eq.id),
                      )
                    : [];

                return (
                  <div key={ativ.id} className="p-4 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              Descrição
                            </span>
                            <p className="font-medium text-sm text-foreground">
                              {montarDescricaoAtividade(ativ)}
                            </p>
                          </div>
                          <div className="shrink-0 sm:text-right">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              Qtde
                            </span>
                            <p className="font-mono text-sm font-semibold text-foreground">
                              {ativ.quantidade ?? '—'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {ativ.areaM2 != null && <span>Área: {ativ.areaM2} m²</span>}
                          <span className="text-primary/80 font-medium">
                            {formState.materiais.length} materiais • {formState.epis.length} EPIs • {formState.equipamentos.length} ferramentas
                          </span>
                          {formState.colaboradoresIds?.length > 0 && (
                            <span className="text-primary/90 font-medium">
                              • {formState.colaboradoresIds.length}{' '}
                              {formState.colaboradoresIds.length === 1 ? 'especialista' : 'especialistas'}
                            </span>
                          )}
                          {ativ.execucoes?.some((ex) => ex.status === 'CONCLUIDA') && (
                            <span className="text-xs font-bold text-success bg-success/15 px-2 py-0.5 rounded-full">
                              ✓ Concluída
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleInsumos(ativ.id)}
                        className="text-xs shrink-0 self-start md:self-center"
                      >
                        {expandido ? '▲ Ocultar Insumos' : '▼ Insumos & Ferramentas'}
                      </Button>
                    </div>

                    {/* Linha de Configuração do Colaborador, Veículo e Disparo */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-muted/10 p-3 rounded-lg border border-border/40">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">
                          Colaborador Especialista
                        </Label>
                        <MultiSelectColaboradores
                          colaboradores={colaboradoresEspecialistas}
                          value={
                            formState.colaboradoresIds && formState.colaboradoresIds.length > 0
                              ? formState.colaboradoresIds
                              : formState.colaboradorId
                                ? [formState.colaboradorId]
                                : []
                          }
                          onChange={(ids) => atualizarColaboradoresAtividade(ativ.id, ids)}
                          placeholder="Selecione o(s) colaborador(es)..."
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Veículo Designado
                        </Label>
                        <select
                          value={formState.veiculoId ?? ''}
                          onChange={(e) =>
                            atualizarAtividadeCampo(
                              ativ.id,
                              'veiculoId',
                              e.target.value ? Number(e.target.value) : null,
                            )
                          }
                          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">Nenhum / Não necessário</option>
                          {catalogos.veiculos.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.nome} - {v.placa} {v.modelo ? `(${v.modelo})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <Label className="text-xs text-muted-foreground">
                            Agendamento Disparo WhatsApp
                          </Label>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              ativ.statusWhatsapp === 'ENVIADO'
                                ? 'bg-success/15 text-success'
                                : 'bg-warning/15 text-warning'
                            }`}
                          >
                            {ativ.statusWhatsapp === 'ENVIADO'
                              ? 'ENVIADO'
                              : 'PENDENTE'}
                          </span>
                        </div>
                        <Input
                          type="datetime-local"
                          value={formState.dataDisparoWhatsapp}
                          onChange={(e) =>
                            atualizarAtividadeCampo(
                              ativ.id,
                              'dataDisparoWhatsapp',
                              e.target.value,
                            )
                          }
                          className="mt-1 text-xs"
                        />
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Cada atividade é disparada independentemente.
                        </p>
                      </div>
                    </div>

                    {/* Painel Expansível de Insumos & Ferramentas */}
                    {expandido && (
                      <div className="mt-3 p-3.5 rounded-lg border border-primary/25 bg-primary/5 space-y-4 text-xs">
                        {/* 1. Materiais Sugeridos para a Atividade (Apenas os selecionados no orçamento + botão '+') */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-foreground">
                              📦 Materiais Sugeridos para a Atividade:
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setAdicionandoMaterialAtiv(
                                  adicionandoMaterialAtiv === ativ.id ? null : ativ.id,
                                );
                                setMaterialSelecionadoParaAdd('');
                              }}
                              className="h-6 text-[11px] px-2 gap-1 border-primary/40 text-primary hover:bg-primary/10"
                            >
                              <span>+</span> Adicionar Material
                            </Button>
                          </div>

                          {/* Seletor inline ao clicar em '+' */}
                          {adicionandoMaterialAtiv === ativ.id && (
                            <div className="mb-2.5 p-2 bg-background border border-primary/30 rounded-md flex items-center gap-2">
                              <select
                                value={materialSelecionadoParaAdd}
                                onChange={(e) =>
                                  setMaterialSelecionadoParaAdd(
                                    e.target.value ? Number(e.target.value) : '',
                                  )
                                }
                                className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs"
                              >
                                <option value="">Selecione o material para incluir...</option>
                                {catalogos.materiais
                                  .filter(
                                    (m) =>
                                      !formState.materiais.some(
                                        (fm) => fm.materialId === m.id,
                                      ),
                                  )
                                  .map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.nome} ({m.unidade?.nome ?? 'un'})
                                    </option>
                                  ))}
                              </select>
                              <Button
                                type="button"
                                size="sm"
                                disabled={!materialSelecionadoParaAdd}
                                onClick={() =>
                                  adicionarMaterialExtra(
                                    ativ.id,
                                    Number(materialSelecionadoParaAdd),
                                  )
                                }
                                className="h-7 text-xs"
                              >
                                Adicionar
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setAdicionandoMaterialAtiv(null)}
                                className="h-7 text-xs text-muted-foreground"
                              >
                                Cancelar
                              </Button>
                            </div>
                          )}

                          {formState.materiais.length === 0 ? (
                            <p className="text-muted-foreground italic py-1">
                              Nenhum material previsto no orçamento para esta atividade. Use o botão "+" acima caso precise adicionar.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {formState.materiais.map((matItem) => {
                                const matCat = catalogos.materiais.find(
                                  (m) => m.id === matItem.materialId,
                                );
                                const nome = matCat?.nome ?? `Material #${matItem.materialId}`;
                                const unidade = matCat?.unidade?.nome ?? 'un';

                                return (
                                  <div
                                    key={matItem.materialId}
                                    className="flex items-center justify-between gap-2 p-1.5 rounded border border-border/50 bg-background shadow-2xs"
                                  >
                                    <span className="truncate flex-1" title={nome}>
                                      {nome}
                                    </span>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Input
                                        type="number"
                                        step="any"
                                        min="0"
                                        value={matItem.quantidade || ''}
                                        placeholder="0"
                                        onChange={(e) =>
                                          atualizarQtdMaterial(
                                            ativ.id,
                                            matItem.materialId,
                                            Number(e.target.value),
                                          )
                                        }
                                        className="h-6 w-16 text-center text-xs p-1"
                                      />
                                      <span className="text-[10px] text-muted-foreground w-6">
                                        {unidade}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removerMaterial(ativ.id, matItem.materialId)
                                        }
                                        title="Remover material da atividade"
                                        className="text-muted-foreground hover:text-destructive px-1 text-xs"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* 2. EPIs Recomendados (Apenas os selecionados + botão '+') */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-foreground">
                              🦺 EPIs Recomendados:
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setAdicionandoEpiAtiv(
                                  adicionandoEpiAtiv === ativ.id ? null : ativ.id,
                                );
                                setEpiSelecionadoParaAdd('');
                              }}
                              className="h-6 text-[11px] px-2 gap-1 border-primary/40 text-primary hover:bg-primary/10"
                            >
                              <span>+</span> Adicionar EPI
                            </Button>
                          </div>

                          {/* Seletor inline ao clicar em '+' */}
                          {adicionandoEpiAtiv === ativ.id && (
                            <div className="mb-2.5 p-2 bg-background border border-primary/30 rounded-md flex items-center gap-2">
                              <select
                                value={epiSelecionadoParaAdd}
                                onChange={(e) =>
                                  setEpiSelecionadoParaAdd(
                                    e.target.value ? Number(e.target.value) : '',
                                  )
                                }
                                className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs"
                              >
                                <option value="">Selecione o EPI para incluir...</option>
                                {catalogos.epis
                                  .filter(
                                    (epi) =>
                                      !formState.epis.some(
                                        (fe) => fe.epiId === epi.id,
                                      ),
                                  )
                                  .map((epi) => (
                                    <option key={epi.id} value={epi.id}>
                                      {epi.nome} {epi.numeroCa ? `(CA ${epi.numeroCa})` : ''}
                                    </option>
                                  ))}
                              </select>
                              <Button
                                type="button"
                                size="sm"
                                disabled={!epiSelecionadoParaAdd}
                                onClick={() =>
                                  adicionarEpiExtra(
                                    ativ.id,
                                    Number(epiSelecionadoParaAdd),
                                  )
                                }
                                className="h-7 text-xs"
                              >
                                Adicionar
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setAdicionandoEpiAtiv(null)}
                                className="h-7 text-xs text-muted-foreground"
                              >
                                Cancelar
                              </Button>
                            </div>
                          )}

                          {formState.epis.length === 0 ? (
                            <p className="text-muted-foreground italic py-1">
                              Nenhum EPI vinculado a esta atividade. Use o botão "+" acima caso deseje sugerir EPIs.
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {formState.epis.map((epiItem) => {
                                const epiCat = catalogos.epis.find(
                                  (e) => e.id === epiItem.epiId,
                                );
                                const nome = epiCat?.nome ?? `EPI #${epiItem.epiId}`;

                                return (
                                  <div
                                    key={epiItem.epiId}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-primary/30 bg-background text-xs font-medium shadow-2xs"
                                  >
                                    <span>
                                      {nome} {epiCat?.numeroCa ? `(CA ${epiCat.numeroCa})` : ''}
                                    </span>
                                    <span className="text-muted-foreground text-[10px]">
                                      Qtd:
                                    </span>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={epiItem.quantidade || 1}
                                      onChange={(e) =>
                                        atualizarQtdEpi(
                                          ativ.id,
                                          epiItem.epiId,
                                          Number(e.target.value) || 1,
                                        )
                                      }
                                      className="h-5 w-12 text-center text-[11px] p-0"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removerEpi(ativ.id, epiItem.epiId)}
                                      title="Remover EPI"
                                      className="text-muted-foreground hover:text-destructive ml-1"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* 3. Ferramentas & Equipamentos (Input com 3 letras traz lista relacionada) */}
                        <div className="space-y-2">
                          <p className="font-semibold text-foreground">
                            🛠️ Ferramentas & Equipamentos do Almoxarifado:
                          </p>

                          {/* Equipamentos Selecionados */}
                          {formState.equipamentos.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {formState.equipamentos.map((eqItem) => {
                                const eqCat = catalogos.equipamentos.find(
                                  (eq) => eq.id === eqItem.equipamentoId,
                                );
                                const rotulo = eqCat
                                  ? `${eqCat.descricao} [${eqCat.codigo}]`
                                  : `Equipamento #${eqItem.equipamentoId}`;

                                return (
                                  <span
                                    key={eqItem.equipamentoId}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-primary/40 bg-primary/10 text-primary text-xs font-semibold"
                                  >
                                    {rotulo}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removerEquipamento(
                                          ativ.id,
                                          eqItem.equipamentoId,
                                        )
                                      }
                                      className="hover:text-destructive ml-1"
                                    >
                                      ✕
                                    </button>
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {/* Input com busca a partir de 3 letras */}
                          <div className="space-y-1.5">
                            <div className="relative">
                              <Input
                                type="text"
                                value={buscaEquip}
                                onChange={(e) =>
                                  setBuscaEquipamentoPorAtiv((prev) => ({
                                    ...prev,
                                    [ativ.id]: e.target.value,
                                  }))
                                }
                                placeholder="Digite ao menos 3 letras para buscar ferramentas/equipamentos..."
                                className="h-8 text-xs bg-background pr-7"
                              />
                              {buscaEquip && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setBuscaEquipamentoPorAtiv((prev) => ({
                                      ...prev,
                                      [ativ.id]: '',
                                    }))
                                  }
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                                  title="Limpar busca"
                                >
                                  ✕
                                </button>
                              )}
                            </div>

                            {/* Mensagem enquanto digita menos de 3 letras */}
                            {buscaEquip.trim().length > 0 &&
                              buscaEquip.trim().length < 3 && (
                                <p className="text-[11px] text-muted-foreground px-1">
                                  Digite mais {3 - buscaEquip.trim().length} letra(s) para pesquisar ferramentas...
                                </p>
                              )}

                            {/* Caixa de resultados em fluxo (não cortada por overflow) */}
                            {buscaEquip.trim().length >= 3 && (
                              <div className="mt-1.5 w-full rounded-md border border-primary/30 bg-background p-1.5 shadow-md max-h-60 overflow-y-auto">
                                <div className="px-2 py-1 text-[11px] font-semibold text-primary border-b border-border/40 flex items-center justify-between">
                                  <span>
                                    {equipamentosFiltrados.length}{' '}
                                    {equipamentosFiltrados.length === 1
                                      ? 'opção encontrada'
                                      : 'opções encontradas'}{' '}
                                    (clique para adicionar):
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setBuscaEquipamentoPorAtiv((prev) => ({
                                        ...prev,
                                        [ativ.id]: '',
                                      }))
                                    }
                                    className="text-[10px] text-muted-foreground hover:text-foreground"
                                  >
                                    Fechar
                                  </button>
                                </div>

                                {equipamentosFiltrados.length === 0 ? (
                                  <p className="p-3 text-xs text-muted-foreground text-center">
                                    Nenhum equipamento disponível encontrado para "{buscaEquip}".
                                  </p>
                                ) : (
                                  <div className="divide-y divide-border/30 mt-1">
                                    {equipamentosFiltrados.map((eq) => (
                                      <button
                                        key={eq.id}
                                        type="button"
                                        onClick={() =>
                                          adicionarEquipamento(ativ.id, eq.id)
                                        }
                                        className="w-full text-left px-2.5 py-2 text-xs hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-between gap-2 rounded group"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <p className="font-semibold text-foreground group-hover:text-primary truncate">
                                            {eq.descricao}
                                          </p>
                                          {eq.modelo && (
                                            <p className="text-[10px] text-muted-foreground truncate">
                                              Modelo: {eq.modelo}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <span className="text-[10px] text-primary/90 font-mono font-medium bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                            {eq.codigo}
                                          </span>
                                          <span className="text-xs text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                            +
                                          </span>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Barra de Ações no Rodapé */}
      <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-xl">
        <div className="text-xs text-muted-foreground">
          {atividadesDistribuidasCount} de {totalAtividades} atividades atribuídas a colaboradores.
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => salvar(false)}
            disabled={salvando}
            className="text-xs"
          >
            {salvando ? 'Salvando...' : 'Salvar Planejamento'}
          </Button>

          {/* O botão de disparo só aparece após todas as atividades serem distribuídas */}
          {todasAtividadesDistribuidas && (
            <Button
              type="button"
              onClick={() => salvar(true)}
              disabled={salvando || disparando}
              className="text-xs font-semibold"
            >
              {salvando ? 'Salvando...' : 'Salvar & Notificar Equipe via WhatsApp 📲'}
            </Button>
          )}

          {/* Regra 4: O botão 'Concluir Obra' somente aparece após todas as atividades estarem concluídas */}
          {podeConcluirObra && (
            <Button
              type="button"
              onClick={concluirObra}
              disabled={concluindoObra}
              className="bg-success text-success-foreground hover:bg-success/90 text-xs font-bold gap-1 shadow-sm"
            >
              {concluindoObra ? 'Concluindo...' : '✓ Concluir Obra'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
