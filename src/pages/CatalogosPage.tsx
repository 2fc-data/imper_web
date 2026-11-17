import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CatalogoManager } from '../components/catalogos/CatalogoManager';
import {
  type RecursoCatalogo,
  RECURSOS_CATALOGOS,
} from '../lib/api';

const CATALOGOS_CONFIG: {
  recurso: RecursoCatalogo;
  label: string;
  descricao: string;
}[] = [
  {
    recurso: 'categorias',
    label: 'Categorias',
    descricao: 'Agrupamentos gerais de materiais, equipamentos e EPIs.',
  },
  {
    recurso: 'subcategorias',
    label: 'Subcategorias',
    descricao: 'Subdivisões e detalhamento de categorias por tipo de insumo.',
  },
  {
    recurso: 'marcas',
    label: 'Marcas',
    descricao: 'Fabricantes e marcas de insumos, materiais e equipamentos.',
  },
  {
    recurso: 'unidades-medida',
    label: 'Unidades de Medida',
    descricao: 'Unidades de medida utilizadas no sistema (un, kg, m, cx, etc.).',
  },
  {
    recurso: 'localizacoes',
    label: 'Localizações',
    descricao: 'Locais de armazenamento físico de equipamentos, ferramentas e EPIs.',
  },
  {
    recurso: 'cores',
    label: 'Cores',
    descricao: 'Cores disponíveis para identificação de materiais, equipamentos e EPIs.',
  },
  {
    recurso: 'tamanhos',
    label: 'Tamanhos',
    descricao: 'Tamanhos disponíveis para EPIs e vestimentas de proteção.',
  },
  {
    recurso: 'status-equipamento',
    label: 'Status de equipamento',
    descricao: 'Situação operacional dos equipamentos da empresa.',
  },
  {
    recurso: 'estados-conservacao',
    label: 'Estados de conservação',
    descricao: 'Classificação da condição física e conservação dos equipamentos.',
  },
  {
    recurso: 'tipos-manutencao',
    label: 'Tipos de manutenção',
    descricao: 'Classificação de manutenções preventivas e corretivas.',
  },
  {
    recurso: 'tipos-despesas',
    label: 'Tipos de despesa',
    descricao: 'Tipos de despesas extras e suprimentos operacionais.',
  },
  {
    recurso: 'fornecedores',
    label: 'Fornecedores',
    descricao: 'Empresas parceiras e fornecedores de insumos, EPIs e equipamentos.',
  },
];

interface CatalogosPageProps {
  viewAtiva?: 'lista' | 'novo';
  onNavegar?: (view: 'lista' | 'novo') => void;
}

export function CatalogosPage({
  viewAtiva: viewAtivaProp,
  onNavegar: onNavegarProp,
}: CatalogosPageProps = {}) {
  const { recurso: recursoParam } = useParams<{ recurso?: string }>();
  const [viewInterna, setViewInterna] = useState<'lista' | 'novo'>('lista');

  const viewAtiva = viewAtivaProp ?? viewInterna;
  const onNavegar = onNavegarProp ?? setViewInterna;

  // Resolve valid resource
  const recursoAtual: RecursoCatalogo =
    recursoParam && (RECURSOS_CATALOGOS as readonly string[]).includes(recursoParam)
      ? (recursoParam as RecursoCatalogo)
      : 'categorias';

  const configAtual =
    CATALOGOS_CONFIG.find((c) => c.recurso === recursoAtual) ??
    CATALOGOS_CONFIG[0]!;

  return (
    <div className="space-y-6">
      {/* Componente unificado para cadastrar novo e listar os que já tem para Materiais, Equipamentos e EPI */}
      <CatalogoManager
        key={recursoAtual}
        recurso={recursoAtual}
        titulo={configAtual.label}
        descricao={configAtual.descricao}
        viewAtiva={viewAtiva}
        onNavegar={onNavegar}
      />
    </div>
  );
}

export default CatalogosPage;
