import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';

export function PortalObraDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const [obra, setObra] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carregarObra = async () => {
      try {
        setLoading(true);
        const res = await api.get<any>(`/portal/obras/${id}`);
        setObra(res.data.obra);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar obra');
      } finally {
        setLoading(false);
      }
    };
    if (id) carregarObra();
  }, [id]);

  if (loading) return <div className="p-6 text-center text-gray-500">Carregando obra...</div>;
  if (error || !obra) return <div className="p-6 text-red-600 bg-red-50">{error || 'Obra não encontrada'}</div>;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Obra {obra.codigo}</h1>
            <p className="text-sm text-gray-500">Endereço da obra: {obra.endereco?.logradouro || 'Não informado'}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
        </div>

        <div className="border-t pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500 block">Valor Contratado</span>
            <span className="font-semibold text-gray-900 font-mono">
              R$ {Number(obra.valorContratado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Etapas Planejadas</span>
            <span className="font-semibold text-gray-900">{obra.etapas?.length || 0}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Ordens de Serviço</span>
            <span className="font-semibold text-gray-900">{obra.ordensServico?.length || 0}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Etapas do Planejamento</h2>
        <div className="space-y-4">
          {obra.etapas?.map((etapa: any) => (
            <div key={etapa.id} className="border p-4 rounded-lg bg-gray-50 space-y-2">
              <h3 className="font-semibold text-gray-900">{etapa.nome}</h3>
              <div className="space-y-1">
                {etapa.atividades?.map((ativ: any) => (
                  <div key={ativ.id} className="text-xs text-gray-700 bg-white p-2 rounded border">
                    <p className="font-medium">{ativ.descricao}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default PortalObraDetalhePage;
