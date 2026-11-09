import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  concluirTarefaColaborador,
  obterTarefasColaborador,
  type DadosPortalColaborador,
  type TarefaColaboradorItem,
} from '../lib/api/planejamento';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';

export default function ColaboradorTarefasPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [dados, setDados] = useState<DadosPortalColaborador | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tarefaSelecionada, setTarefaSelecionada] =
    useState<TarefaColaboradorItem | null>(null);
  const [fotoWebpBase64, setFotoWebpBase64] = useState<string | null>(null);
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    if (!token) {
      setErro('Link de acesso inválido. Por favor, acesse através do link recebido pelo WhatsApp.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErro(null);
    try {
      const res = await obterTarefasColaborador(token);
      setDados(res);
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : 'Falha ao carregar suas tarefas. Link pode estar expirado.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Conversão de arquivo de imagem para WebP comprimido no navegador
  const handleSelecionarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1280;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Converte diretamente para WEBP
          const webpDataUrl = canvas.toDataURL('image/webp', 0.82);
          setFotoWebpBase64(webpDataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const abrirModalConclusao = (tarefa: TarefaColaboradorItem) => {
    setTarefaSelecionada(tarefa);
    setFotoWebpBase64(null);
    setObservacao(tarefa.observacaoConclusao ?? '');
  };

  const confirmarConclusao = async (concluido: boolean) => {
    if (!tarefaSelecionada) return;

    setSalvando(true);
    try {
      await concluirTarefaColaborador(tarefaSelecionada.id, {
        token,
        concluido,
        fotoWebpBase64: fotoWebpBase64 ?? undefined,
        observacao: observacao.trim() || undefined,
      });
      setTarefaSelecionada(null);
      await carregar();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Erro ao salvar conclusão da atividade.',
      );
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm font-medium text-slate-600">
            Carregando suas tarefas...
          </p>
        </div>
      </div>
    );
  }

  if (erro || !dados) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive text-lg">
              Acesso Não Disponível
            </CardTitle>
            <CardDescription className="text-slate-600">
              {erro || 'Não foi possível carregar as informações da sua escala.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { colaborador, obra, veiculo, tarefas } = dados;
  const concluidasCount = tarefas.filter((t) => t.concluido).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Topo fixo com logo e identificação */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-slate-900">
              Impermeabilização BOS
            </h1>
            <p className="text-xs text-slate-500">
              Portal do Colaborador • {colaborador.nome}
            </p>
          </div>
          <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
            {concluidasCount}/{tarefas.length} Concluídas
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Card da Obra & Local */}
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Escala de Serviço
                </p>
                <CardTitle className="text-lg font-bold text-white">
                  Obra {obra.codigo}
                </CardTitle>
              </div>
              {colaborador.cargo && (
                <span className="text-xs bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700">
                  {colaborador.cargo.nome}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div>
              <p className="font-semibold text-slate-900 mb-0.5">📍 Local da Obra:</p>
              <p className="text-slate-600 leading-relaxed">{obra.endereco}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(obra.endereco)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-primary font-bold hover:underline"
              >
                🗺️ Abrir no Google Maps / Waze
              </a>
            </div>

            {veiculo && (
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <span className="text-base">🚗</span>
                <div>
                  <p className="font-semibold text-slate-900">
                    Veículo Designado:
                  </p>
                  <p className="text-slate-600">
                    {veiculo.nome} • Placa: <span className="font-mono font-bold">{veiculo.placa}</span>
                    {veiculo.modelo ? ` (${veiculo.modelo})` : ''}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Atividades com Checkbox */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Suas Atividades Programadas
          </h2>

          {tarefas.map((tarefa, idx) => {
            const isConcluida = tarefa.concluido;

            return (
              <Card
                key={tarefa.id}
                className={`border transition-all shadow-xs ${
                  isConcluida
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-slate-200 bg-white hover:border-primary/40'
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Linha principal com Checkbox grande */}
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        isConcluida
                          ? confirmarConclusaoRapida(tarefa.id, false)
                          : abrirModalConclusao(tarefa)
                      }
                      className={`mt-0.5 h-6 w-6 shrink-0 rounded-md flex items-center justify-center border-2 transition-colors ${
                        isConcluida
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-400 bg-white hover:border-primary'
                      }`}
                      aria-label="Marcar tarefa concluída"
                    >
                      {isConcluida && (
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-4 w-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Etapa: {tarefa.etapa}
                        </span>
                        {isConcluida ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            ✓ Concluída
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            Pendente
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm font-semibold mt-0.5 ${
                          isConcluida
                            ? 'text-slate-500 line-through'
                            : 'text-slate-900'
                        }`}
                      >
                        {idx + 1}. {tarefa.descricao}
                      </p>
                      {tarefa.dataPrevisao && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          📅 Previsão: {new Date(tarefa.dataPrevisao).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Detalhes de Insumos da Tarefa */}
                  <div className="pt-2 border-t border-slate-100/80 space-y-1.5 text-[11px]">
                    {tarefa.materiais.length > 0 && (
                      <p className="text-slate-600">
                        <strong className="text-slate-700">📦 Materiais:</strong>{' '}
                        {tarefa.materiais.join(', ')}
                      </p>
                    )}
                    {tarefa.epis.length > 0 && (
                      <p className="text-slate-600">
                        <strong className="text-slate-700">🦺 EPIs:</strong>{' '}
                        {tarefa.epis.join(', ')}
                      </p>
                    )}
                    {tarefa.equipamentos.length > 0 && (
                      <p className="text-slate-600">
                        <strong className="text-slate-700">🛠️ Ferramentas:</strong>{' '}
                        {tarefa.equipamentos.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Foto e Observações registradas */}
                  {(tarefa.fotoConclusaoUrl || tarefa.observacaoConclusao) && (
                    <div className="pt-2 border-t border-emerald-100 flex gap-2 items-center text-xs text-slate-600">
                      {tarefa.fotoConclusaoUrl && (
                        <a
                          href={tarefa.fotoConclusaoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0"
                        >
                          <img
                            src={tarefa.fotoConclusaoUrl}
                            alt="Foto da conclusão"
                            className="h-10 w-10 object-cover rounded border border-emerald-300"
                          />
                        </a>
                      )}
                      {tarefa.observacaoConclusao && (
                        <p className="italic text-slate-700 truncate">
                          "{tarefa.observacaoConclusao}"
                        </p>
                      )}
                    </div>
                  )}

                  {!isConcluida && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => abrirModalConclusao(tarefa)}
                      className="w-full text-xs font-semibold border-slate-300 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-700"
                    >
                      ✓ Marcar como Concluída (com Foto)
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Modal / Dialog de Conclusão com Foto WebP e Observação */}
      {tarefaSelecionada && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Concluir Atividade
              </h3>
              <button
                type="button"
                onClick={() => setTarefaSelecionada(null)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-sm font-medium text-slate-700">
              {tarefaSelecionada.descricao}
            </p>

            {/* Captura de Foto WebP */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                📸 Foto de Comprovação do Serviço (salva em WebP)
              </label>

              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleSelecionarFoto}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />

              {fotoWebpBase64 && (
                <div className="mt-2 relative rounded-lg overflow-hidden border border-slate-200">
                  <img
                    src={fotoWebpBase64}
                    alt="Preview WebP"
                    className="w-full h-40 object-cover"
                  />
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                    WebP Otimizado
                  </span>
                </div>
              )}
            </div>

            {/* Observação Opcional */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Observação (opcional)
              </label>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: Concluído conforme especificações técnicas sem pendências."
                rows={3}
                className="w-full rounded-md border border-slate-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTarefaSelecionada(null)}
                className="flex-1 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => confirmarConclusao(true)}
                disabled={salvando}
                className="flex-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {salvando ? 'Salvando...' : 'Confirmar Conclusão'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  async function confirmarConclusaoRapida(tarefaId: string, concluido: boolean) {
    if (!confirm('Deseja desmarcar a conclusão desta atividade?')) return;
    setSalvando(true);
    try {
      await concluirTarefaColaborador(tarefaId, {
        token,
        concluido,
      });
      await carregar();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Erro ao atualizar status da atividade.',
      );
    } finally {
      setSalvando(false);
    }
  }
}

