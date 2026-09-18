import { useState, useEffect } from 'react';
import {
  apiListarPadroes,
  apiCriarPadrao,
  apiAtualizarPadrao,
  apiExcluirPadrao,
  type DisponibilidadePadrao,
} from '../../lib/api';

const DIAS_SEMANA = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

interface GerenciarPadroesProps {
  userId: number;
}

export function GerenciarPadroes({ userId }: GerenciarPadroesProps) {
  const [padroes, setPadroes] = useState<DisponibilidadePadrao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Formulário Novo Padrão
  const [novoDia, setNovoDia] = useState(1);
  const [novoInicio, setNovoInicio] = useState('08:00');
  const [novoFim, setNovoFim] = useState('12:00');
  const [novaCapacidade, setNovaCapacidade] = useState(1);
  const [salvando, setSalvando] = useState(false);

  // Edição Inline de Padrão
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editDia, setEditDia] = useState(1);
  const [editInicio, setEditInicio] = useState('08:00');
  const [editFim, setEditFim] = useState('12:00');
  const [editCapacidade, setEditCapacidade] = useState(1);
  const [editAtivo, setEditAtivo] = useState(true);
  const [salvandoEdit, setSalvandoEdit] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const data = await apiListarPadroes(userId);
      setPadroes(data);
    } catch (err: any) {
      setErro(err?.message || 'Erro ao carregar padrões');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, [userId]);

  async function handleCriar() {
    if (novoInicio >= novoFim) {
      setErro('Hora início deve ser anterior à hora fim');
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await apiCriarPadrao({
        userId,
        diaSemana: novoDia,
        horaInicio: novoInicio,
        horaFim: novoFim,
        capacidade: novaCapacidade,
      });
      setNovoInicio('08:00');
      setNovoFim('12:00');
      setNovaCapacidade(1);
      await carregar();
    } catch (err: any) {
      setErro(err?.message || 'Erro ao criar padrão');
    } finally {
      setSalvando(false);
    }
  }

  function iniciarEdicao(p: DisponibilidadePadrao) {
    setEditandoId(p.id);
    setEditDia(p.diaSemana);
    setEditInicio(p.horaInicio);
    setEditFim(p.horaFim);
    setEditCapacidade(p.capacidade);
    setEditAtivo(p.ativo);
    setErro(null);
  }

  function cancelarEdicao() {
    setEditandoId(null);
  }

  async function handleSalvarEdicao(id: number) {
    if (editInicio >= editFim) {
      setErro('Hora início deve ser anterior à hora fim');
      return;
    }
    setSalvandoEdit(true);
    setErro(null);
    try {
      await apiAtualizarPadrao(id, {
        diaSemana: editDia,
        horaInicio: editInicio,
        horaFim: editFim,
        capacidade: editCapacidade,
        ativo: editAtivo,
      });
      setEditandoId(null);
      await carregar();
    } catch (err: any) {
      setErro(err?.message || 'Erro ao atualizar padrão');
    } finally {
      setSalvandoEdit(false);
    }
  }

  async function handleToggleAtivo(id: number, ativo: boolean) {
    try {
      await apiAtualizarPadrao(id, { ativo: !ativo });
      await carregar();
    } catch (err: any) {
      setErro(err?.message || 'Erro ao atualizar padrão');
    }
  }

  async function handleExcluir(id: number) {
    if (!confirm('Excluir este padrão?')) return;
    try {
      await apiExcluirPadrao(id);
      await carregar();
    } catch (err: any) {
      setErro(err?.message || 'Erro ao excluir padrão');
    }
  }

  if (carregando) {
    return <p className="text-sm text-muted-foreground py-4">Carregando padrões...</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Horários Recorrentes</h3>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <div className="border rounded-md p-3 space-y-3">
        <p className="text-sm font-medium">Novo horário recorrente</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Dia da semana</label>
            <select
              value={novoDia}
              onChange={(e) => setNovoDia(Number(e.target.value))}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              {[1, 2, 3, 4, 5, 6].map((d) => (
                <option key={d} value={d}>{DIAS_SEMANA[d]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Início</label>
            <input
              type="time"
              value={novoInicio}
              onChange={(e) => setNovoInicio(e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Fim</label>
            <input
              type="time"
              value={novoFim}
              onChange={(e) => setNovoFim(e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Capacidade</label>
            <input
              type="number"
              min={0}
              value={novaCapacidade}
              onChange={(e) => setNovaCapacidade(Number(e.target.value))}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleCriar}
              disabled={salvando}
              className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </div>
      </div>

      {padroes.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Nenhum padrão cadastrado.</p>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-3 py-2">Dia</th>
                <th className="text-left px-3 py-2">Horário</th>
                <th className="text-left px-3 py-2">Capacidade</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-right px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {padroes.map((p) => {
                const ehEditando = editandoId === p.id;
                if (ehEditando) {
                  return (
                    <tr key={p.id} className="border-t bg-muted/40">
                      <td className="px-3 py-2">
                        <select
                          value={editDia}
                          onChange={(e) => setEditDia(Number(e.target.value))}
                          className="border rounded px-2 py-1 text-sm bg-background"
                        >
                          {[1, 2, 3, 4, 5, 6].map((d) => (
                            <option key={d} value={d}>{DIAS_SEMANA[d]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="time"
                            value={editInicio}
                            onChange={(e) => setEditInicio(e.target.value)}
                            className="border rounded px-1 py-1 text-sm bg-background"
                          />
                          <span>-</span>
                          <input
                            type="time"
                            value={editFim}
                            onChange={(e) => setEditFim(e.target.value)}
                            className="border rounded px-1 py-1 text-sm bg-background"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          value={editCapacidade}
                          onChange={(e) => setEditCapacidade(Number(e.target.value))}
                          className="w-20 border rounded px-2 py-1 text-sm bg-background"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={editAtivo ? 'true' : 'false'}
                          onChange={(e) => setEditAtivo(e.target.value === 'true')}
                          className="border rounded px-2 py-1 text-sm bg-background"
                        >
                          <option value="true">Ativo</option>
                          <option value="false">Inativo</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleSalvarEdicao(p.id)}
                          disabled={salvandoEdit}
                          className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                        >
                          {salvandoEdit ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelarEdicao}
                          disabled={salvandoEdit}
                          className="text-xs text-muted-foreground hover:underline disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={p.id} className="border-t">
                    <td className="px-3 py-2 font-medium">{DIAS_SEMANA[p.diaSemana]}</td>
                    <td className="px-3 py-2">{p.horaInicio} - {p.horaFim}</td>
                    <td className="px-3 py-2">{p.capacidade === 0 ? 'Ilimitado' : p.capacidade}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${p.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(p)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleAtivo(p.id, p.ativo)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {p.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluir(p.id)}
                        className="text-xs text-destructive hover:text-destructive/80"
                      >
                        Excluir
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
