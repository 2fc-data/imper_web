import { useState, useEffect } from 'react';
import {
  apiListarDatas,
  apiCriarData,
  apiAtualizarData,
  apiExcluirData,
  type DisponibilidadeData,
} from '../../lib/api';

interface GerenciarDatasProps {
  userId: number;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatarDataBR(iso: string): string {
  const d = new Date(iso);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function isoParaInputDate(iso: string): string {
  const d = new Date(iso);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${ano}-${mes}-${dia}`;
}

export function GerenciarDatas({ userId }: GerenciarDatasProps) {
  const now = new Date();
  const [mesAtual, setMesAtual] = useState(now.getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(now.getFullYear());
  const [datas, setDatas] = useState<DisponibilidadeData[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Formulário Nova Data
  const [novaData, setNovaData] = useState('');
  const [novoInicio, setNovoInicio] = useState('08:00');
  const [novoFim, setNovoFim] = useState('18:00');
  const [novaCapacidade, setNovaCapacidade] = useState(1);
  const [novaExcluida, setNovaExcluida] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Edição Inline
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editData, setEditData] = useState('');
  const [editInicio, setEditInicio] = useState('08:00');
  const [editFim, setEditFim] = useState('18:00');
  const [editCapacidade, setEditCapacidade] = useState(1);
  const [editExcluida, setEditExcluida] = useState(false);
  const [salvandoEdit, setSalvandoEdit] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const data = await apiListarDatas(userId, mesAtual, anoAtual);
      setDatas(data);
    } catch (err: any) {
      setErro(err?.message || 'Erro ao carregar datas');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, [userId, mesAtual, anoAtual]);

  function voltarMes() {
    if (mesAtual === 1) { setMesAtual(12); setAnoAtual(anoAtual - 1); }
    else setMesAtual(mesAtual - 1);
  }

  function avancarMes() {
    if (mesAtual === 12) { setMesAtual(1); setAnoAtual(anoAtual + 1); }
    else setMesAtual(mesAtual + 1);
  }

  async function handleCriar() {
    if (!novaData) { setErro('Selecione uma data'); return; }
    if (novoInicio >= novoFim) { setErro('Hora início deve ser anterior à hora fim'); return; }

    setSalvando(true);
    setErro(null);
    try {
      await apiCriarData({
        userId,
        data: `${novaData}T00:00:00.000Z`,
        horaInicio: novoInicio,
        horaFim: novoFim,
        capacidade: novaCapacidade,
        excluida: novaExcluida,
      });
      setNovaData('');
      setNovoInicio('08:00');
      setNovoFim('18:00');
      setNovaCapacidade(1);
      setNovaExcluida(false);
      await carregar();
    } catch (err: any) {
      setErro(err?.message || 'Erro ao criar data');
    } finally {
      setSalvando(false);
    }
  }

  function iniciarEdicao(d: DisponibilidadeData) {
    setEditandoId(d.id);
    setEditData(isoParaInputDate(d.data));
    setEditInicio(d.horaInicio);
    setEditFim(d.horaFim);
    setEditCapacidade(d.capacidade);
    setEditExcluida(d.excluida);
    setErro(null);
  }

  function cancelarEdicao() {
    setEditandoId(null);
  }

  async function handleSalvarEdicao(id: number) {
    if (!editData) { setErro('Selecione uma data'); return; }
    if (editInicio >= editFim) { setErro('Hora início deve ser anterior à hora fim'); return; }

    setSalvandoEdit(true);
    setErro(null);
    try {
      await apiAtualizarData(id, {
        data: `${editData}T00:00:00.000Z`,
        horaInicio: editInicio,
        horaFim: editFim,
        capacidade: editCapacidade,
        excluida: editExcluida,
      });
      setEditandoId(null);
      await carregar();
    } catch (err: any) {
      setErro(err?.message || 'Erro ao atualizar data');
    } finally {
      setSalvandoEdit(false);
    }
  }

  async function handleToggleExcluida(id: number, excluida: boolean) {
    try {
      await apiAtualizarData(id, { excluida: !excluida });
      await carregar();
    } catch (err: any) {
      setErro(err?.message || 'Erro ao atualizar data');
    }
  }

  async function handleExcluir(id: number) {
    if (!confirm('Excluir este registro?')) return;
    try {
      await apiExcluirData(id);
      await carregar();
    } catch (err: any) {
      setErro(err?.message || 'Erro ao excluir data');
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Datas Específicas</h3>

      <div className="flex items-center justify-between">
        <button type="button" onClick={voltarMes} className="text-sm text-muted-foreground hover:text-foreground">&larr; Anterior</button>
        <span className="text-sm font-medium">{MESES[mesAtual - 1]} {anoAtual}</span>
        <button type="button" onClick={avancarMes} className="text-sm text-muted-foreground hover:text-foreground">Próximo &rarr;</button>
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <div className="border rounded-md p-3 space-y-3">
        <p className="text-sm font-medium">Adicionar data específica</p>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Data</label>
            <input
              type="date"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Início</label>
            <input type="time" value={novoInicio} onChange={(e) => setNovoInicio(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Fim</label>
            <input type="time" value={novoFim} onChange={(e) => setNovoFim(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Capacidade</label>
            <input type="number" min={0} value={novaCapacidade} onChange={(e) => setNovaCapacidade(Number(e.target.value))} className="w-full border rounded px-2 py-1 text-sm" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={novaExcluida} onChange={(e) => setNovaExcluida(e.target.checked)} />
              Excluir (bloquear data)
            </label>
          </div>
          <div className="flex items-end">
            <button type="button" onClick={handleCriar} disabled={salvando} className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </div>
      </div>

      {carregando ? (
        <p className="text-sm text-muted-foreground py-4">Carregando...</p>
      ) : datas.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Nenhuma data específica neste mês.</p>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-3 py-2">Data</th>
                <th className="text-left px-3 py-2">Horário</th>
                <th className="text-left px-3 py-2">Capacidade</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-right px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {datas.map((d) => {
                const ehEditando = editandoId === d.id;
                if (ehEditando) {
                  return (
                    <tr key={d.id} className="border-t bg-muted/40">
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={editData}
                          onChange={(e) => setEditData(e.target.value)}
                          className="border rounded px-2 py-1 text-sm bg-background"
                        />
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
                          value={editExcluida ? 'true' : 'false'}
                          onChange={(e) => setEditExcluida(e.target.value === 'true')}
                          className="border rounded px-2 py-1 text-sm bg-background"
                        >
                          <option value="false">Ativa</option>
                          <option value="true">Bloqueada</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleSalvarEdicao(d.id)}
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
                  <tr key={d.id} className="border-t">
                    <td className="px-3 py-2 font-medium">{formatarDataBR(d.data)}</td>
                    <td className="px-3 py-2">{d.horaInicio} - {d.horaFim}</td>
                    <td className="px-3 py-2">{d.capacidade === 0 ? 'Ilimitado' : d.capacidade}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${d.excluida ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {d.excluida ? 'Bloqueada' : 'Ativa'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(d)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleExcluida(d.id, d.excluida)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {d.excluida ? 'Desbloquear' : 'Bloquear'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluir(d.id)}
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
