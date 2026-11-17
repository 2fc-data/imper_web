import type { ReactNode, SVGProps } from 'react';

export interface NavItem {
  to?: string;
  label: string;
  icon: ReactNode;
  children?: NavItem[];
  /** If set, user must have at least ONE of these permissions to see the item. */
  requiredPermissions?: string[];
  /** If true, only shown when user has NO internal permissions (CLIENTE). */
  onlyNoPermissions?: boolean;
}

function Icon({
  d,
  children,
  ...props
}: { d?: string; children?: ReactNode } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
      {...props}
    >
      {d ? <path d={d} /> : children}
    </svg>
  );
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Administração',
    icon: (
      <Icon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426-1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    ),
    children: [
      {
        to: '/calendario',
        label: 'Calendário',
        icon: (
          <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        ),
        requiredPermissions: ['criar_atendimento', 'editar_atendimento'],
      },
      {
        to: '/rbac',
        label: 'Papéis',
        icon: (
          <Icon d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        ),
        requiredPermissions: ['gerenciar_papeis'],
      },
      {
        to: '/servicos-admin',
        label: 'Serviços',
        icon: <Icon d="M19 9l-7 12-7-12a7 7 0 1114 0z" />,
        requiredPermissions: ['criar_servico', 'editar_servico'],
      },
      {
        to: '/usuarios',
        label: 'Usuários',
        icon: (
          <Icon d="M16 11a1 1 0 01-1 1H9a1 1 0 01-1-1V8a1 1 0 011-1h6a1 1 0 011 1v3zM12 3a3 3 0 100 6 3 3 0 000-6zM8 21v-2a4 4 0 018 0v2" />
        ),
        requiredPermissions: [
          'criar_usuario',
          'editar_usuario',
          'definir_perfil',
        ],
      },
    ],
  },
  {
    label: 'Atendimento',
    icon: <Icon d="M12 3a3 3 0 100 6 3 3 0 000-6zM8 21v-2a4 4 0 018 0v2" />,
    children: [
      {
        to: '/agendamentos',
        label: 'Agendamentos',
        icon: (
          <Icon d="M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
        ),
        requiredPermissions: ['criar_atendimento', 'editar_atendimento'],
      },
      {
        to: '/atendimentos',
        label: 'Atendimentos',
        icon: <Icon d="M12 3a3 3 0 100 6 3 3 0 000-6zM8 21v-2a4 4 0 018 0v2" />,
        requiredPermissions: ['criar_atendimento', 'editar_atendimento'],
      },
      {
        to: '/orcamentos',
        label: 'Orçamentos',
        icon: (
          <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        ),
        requiredPermissions: ['aprovar_compra', 'ver_financeiro'],
      },
    ],
  },
  {
    to: '/execucao',
    label: 'Dashboard Execução',
    icon: <Icon d="M3 3v18h18M18 17V9M13 17V5M8 17v-3" />,
    requiredPermissions: ['gerenciar_execucao', 'criar_execucao', 'iniciar_execucao'],
  },
  {
    label: 'Execução',
    icon: <Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    children: [
      {
        to: '/retirada-de-itens',
        label: 'Retirada de Itens',
        icon: <Icon d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />,
        requiredPermissions: [
          'gerenciar_estoque',
          'gerenciar_equipamentos',
          'separar_item',
        ],
      },
      {
        to: '/etapas-de-obra',
        label: 'Etapas de obra',
        icon: <Icon d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
        requiredPermissions: ['gerenciar_catalogo'],
      },
    ],
  },
  {
    label: 'Frota',
    icon: (
      <Icon d="M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h1l1-2h6l1 2h1a2 2 0 012 2v6a2 2 0 01-2 2M5 17a2 2 0 100 4 2 2 0 000-4zM19 17a2 2 0 100 4 2 2 0 000-4z" />
    ),
    requiredPermissions: [
      'visualizar_frota',
      'registrar_km_frota',
      'gerenciar_frota',
    ],
    children: [
      {
        to: '/abastecimentos',
        label: 'Abastecimentos',
        icon: (
          <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        ),
        requiredPermissions: ['visualizar_frota', 'gerenciar_frota'],
      },
      {
        to: '/frota-km',
        label: 'Km Diário',
        icon: <Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
        requiredPermissions: [
          'visualizar_frota',
          'registrar_km_frota',
          'gerenciar_frota',
        ],
      },
      {
        to: '/manutencoes-veiculos',
        label: 'Manutenções',
        icon: (
          <Icon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426-1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        ),
        requiredPermissions: ['visualizar_frota', 'gerenciar_frota'],
      },
      {
        to: '/veiculos',
        label: 'Veículos',
        icon: (
          <Icon d="M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h1l1-2h6l1 2h1a2 2 0 012 2v6a2 2 0 01-2 2M5 17a2 2 0 100 4 2 2 0 000-4zM19 17a2 2 0 100 4 2 2 0 000-4z" />
        ),
        requiredPermissions: [
          'visualizar_frota',
          'registrar_km_frota',
          'gerenciar_frota',
        ],
      },
    ],
  },
  {
    to: '/painel',
    label: 'Início',
    icon: <Icon d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" />,
  },
  {
    label: 'Insumos',
    icon: <Icon d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />,
    children: [
      {
        to: '/epis',
        label: 'EPIs',
        icon: (
          <Icon d="M16 11a1 1 0 01-1 1H9a1 1 0 01-1-1V8a1 1 0 011-1h6a1 1 0 011 1v3z" />
        ),
        requiredPermissions: [
          'gerenciar_epis',
          'gerenciar_estoque',
          'criar_lista_compras',
        ],
      },
      {
        to: '/equipamentos',
        label: 'Equipamentos',
        icon: <Icon d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />,
        requiredPermissions: [
          'gerenciar_estoque',
          'gerenciar_equipamentos',
          'criar_lista_compras',
        ],

      },
      {
        to: '/manutencoes',
        label: 'Manutenção',
        icon: <Icon d="M20 8l1-4-1 4a4 4 0 006 0l-1 4M4 8l1-4-1 4a4 4 0 00-6 0l1 4" />,
        requiredPermissions: ['gerenciar_equipamentos'],
      },

      {
        to: '/materiais',
        label: 'Materiais',
        icon: <Icon d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />,
        requiredPermissions: [
          'gerenciar_estoque',
          'criar_material',
          'entrada_estoque',
          'criar_lista_compras',
        ],
      },
      {
        to: '/despesas-extras',
        label: 'Despesas Extras',
        icon: <Icon d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3c-.6.6-.2 1.7.7 1.7H17m0 4a1 1 0 110 2 1 1 0 010-2zm-8 0a1 1 0 110 2 1 1 0 010-2z" />,
        requiredPermissions: ['gerenciar_estoque', 'criar_lista_compras'],
      },
    ],
  },
  {
    label: 'Catálogos',
    icon: <Icon d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
    requiredPermissions: [
      'gerenciar_catalogo',
      'gerenciar_estoque',
      'gerenciar_equipamentos',
      'gerenciar_epis',
    ],
    children: [
      {
        to: '/catalogos/categorias',
        label: 'Categorias',
        icon: (
          <Icon d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        ),
      },
      {
        to: '/catalogos/subcategorias',
        label: 'Subcategorias',
        icon: <Icon d="M7 7h10M7 12h7M7 17h4" />,
      },
      {
        to: '/catalogos/marcas',
        label: 'Marcas',
        icon: (
          <Icon d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        ),
      },
      {
        to: '/catalogos/unidades-medida',
        label: 'Unidades de Medida',
        icon: <Icon d="M3 6h18M6 6v4m6-4v6m6-6v4M3 18h18" />,
      },
      {
        to: '/catalogos/localizacoes',
        label: 'Localizações',
        icon: (
          <Icon d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        ),
      },
      {
        to: '/catalogos/cores',
        label: 'Cores',
        icon: (
          <Icon d="M7 21a4 4 0 01-4-4 4 4 0 014-4c.73 0 1.41.2 2 .55V7a5 5 0 0110 0v6.55c.59-.35 1.27-.55 2-.55a4 4 0 014 4 4 4 0 01-4 4H7z" />
        ),
      },
      {
        to: '/catalogos/tamanhos',
        label: 'Tamanhos',
        icon: <Icon d="M4 8h16M4 16h16M8 4v16m8-16v16" />,
      },
      {
        to: '/catalogos/status-equipamento',
        label: 'Status de equipamento',
        icon: <Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
      },
      {
        to: '/catalogos/estados-conservacao',
        label: 'Estados de conservação',
        icon: (
          <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        ),
      },
      {
        to: '/catalogos/tipos-manutencao',
        label: 'Tipos de manutenção',
        icon: (
          <Icon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426-1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        ),
      },
      {
        to: '/catalogos/tipos-despesas',
        label: 'Tipos de despesa',
        icon: (
          <Icon d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3c-.6.6-.2 1.7.7 1.7H17m0 4a1 1 0 110 2 1 1 0 010-2zm-8 0a1 1 0 110 2 1 1 0 010-2z" />
        ),
      },
      {
        to: '/catalogos/fornecedores',
        label: 'Fornecedores',
        icon: (
          <Icon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        ),
      },
    ],
  },
  {
    to: '/portal/dados',
    label: 'Minha conta',
    icon: (
      <Icon d="M16 11a1 1 0 01-1 1H9a1 1 0 01-1-1V8a1 1 0 011-1h6a1 1 0 011 1v3zM12 3a3 3 0 100 6 3 3 0 000-6zM8 21v-2a4 4 0 018 0v2" />
    ),
    onlyNoPermissions: true,
  },
];

export function itensPara(permissoes: string[]): NavItem[] {
  function itemPermitido(item: NavItem): boolean {
    if (item.onlyNoPermissions) return permissoes.length === 0;
    if (!item.requiredPermissions) return true;
    return item.requiredPermissions.some((p) => permissoes.includes(p));
  }

  return NAV_ITEMS.map((item) => {
    if (item.children) {
      const childrenPermitidos = item.children.filter(itemPermitido);
      if (childrenPermitidos.length === 0) return null;
      return { ...item, children: childrenPermitidos };
    }
    return itemPermitido(item) ? item : null;
  }).filter(Boolean) as NavItem[];
}

export function homeFor(user: { papeis: string[] }): string {
  const temPainel = user.papeis.some((nome) => nome !== 'CLIENTE');
  return temPainel ? '/painel' : '/portal';
}

export function iniciais(nome: string | undefined): string {
  if (!nome) return '?';
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
