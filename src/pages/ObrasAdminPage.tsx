import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export function ObrasAdminPage() {
  const [obras, setObras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');

  const carregarObras = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (busca) params.append('busca', busca);
      if (statusFiltro) params.append('status', statusFiltro);

      const res = await api.get<any>(`/obras?${params.toString()}`);
      setObras(res.data.obras || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar obras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarObras();
  }, [statusFiltro]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    carregarObras();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Obras</h1>
          <p className="text-gray-500 text-sm">Painel de controle e acompanhamento de obras</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="Buscar por código, cliente ou observações..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="border px-3 py-2 rounded-md text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os status</option>
            <option value="EM_PREPARACAO">Em Preparação</option>
            <option value="EM_EXECUCAO">Em Execução</option>
            <option value="CONCLUIDA">Concluída</option>
            <option value="CANCELADA">Cancelada</option>
          </select>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition"
          >
            Filtrar
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Carregando obras...</div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">{error}</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                <th className="p-4">Código</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Status</th>
                <th className="p-4">Valor Contratado</th>
                <th className="p-4">OSs</th>
                <th className="p-4">Aditivos</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {obras.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Nenhuma obra encontrada.
                  </td>
                </tr>
              ) : (
                obras.map((obra) => (
                  <tr key={obra.id} className="hover:bg-gray-50">
                    <td className="p-4 font-semibold text-blue-600">{obra.codigo}</td>
                    <td className="p-4">{obra.user?.nome || 'N/A'}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          obra.status === 'EM_PREPARACAO'
                            ? 'bg-yellow-100 text-yellow-800'
                            : obra.status === 'EM_EXECUCAO'
                            ? 'bg-blue-100 text-blue-800'
                            : obra.status === 'CONCLUIDA'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {obra.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono">
                      R$ {Number(obra.valorContratado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4">{obra._count?.ordensServico || 0}</td>
                    <td className="p-4">{obra._count?.aditivos || 0}</td>
                    <td className="p-4">
                      <Link
                        to={`/obras/${obra.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Ver Detalhes →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
