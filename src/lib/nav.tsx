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
    to: '/painel',
    label: 'Início',
    icon: <Icon d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" />,
  },
  {
    to: '/execucao',
    label: 'Dashboard Execução',
    icon: <Icon d="M3 3v18h18M18 17V9M13 17V5M8 17v-3" />,
    requiredPermissions: ['gerenciar_os', 'criar_os', 'iniciar_os'],
  },
  {
    label: 'Atendimento',
    icon: <Icon d="M12 3a3 3 0 100 6 3 3 0 000-6zM8 21v-2a4 4 0 018 0v2" />,
    children: [
      {
        to: '/atendimentos',
        label: 'Atendimentos',
        icon: <Icon d="M12 3a3 3 0 100 6 3 3 0 000-6zM8 21v-2a4 4 0 018 0v2" />,
        requiredPermissions: ['criar_atendimento', 'editar_atendimento'],
      },
      {
        to: '/agendamentos',
        label: 'Agendamentos',
        icon: (
          <Icon d="M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
        ),
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
    to: '/calendario',
    label: 'Calendário',
    icon: (
      <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    ),
    requiredPermissions: ['criar_atendimento', 'editar_atendimento'],
  },
  {
    label: 'Insumos',
    icon: <Icon d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />,
    children: [
      {
        to: '/catalogos',
        label: 'Catálogos',
        icon: <Icon d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
        requiredPermissions: [
          'gerenciar_estoque',
          'gerenciar_equipamentos',
          'gerenciar_epis',
        ],
      },
      {
        to: '/equipamentos',
        label: 'Equipamentos',
        icon: <Icon d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />,
        requiredPermissions: ['gerenciar_estoque', 'gerenciar_equipamentos'],
      },
      {
        to: '/epis',
        label: 'EPIs',
        icon: (
          <Icon d="M16 11a1 1 0 01-1 1H9a1 1 0 01-1-1V8a1 1 0 011-1h6a1 1 0 011 1v3z" />
        ),
        requiredPermissions: ['gerenciar_epis', 'gerenciar_estoque'],
      },
      {
        to: '/manutencoes',
        label: 'Manutenção',
        icon: (
          <Icon d="M20 8l1-4-1 4a4 4 0 006 0l-1 4M4 8l-1-4 1 4a4 4 0 00-6 0l1 4" />
        ),
        requiredPermissions: ['editar_os', 'iniciar_os', 'concluir_os'],
      },
      {
        to: '/materiais',
        label: 'Materiais',
        icon: <Icon d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />,
        requiredPermissions: [
          'gerenciar_estoque',
          'criar_material',
          'entrada_estoque',
        ],
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
      {
        to: '/frota-km',
        label: 'Km Diário',
        icon: (
          <Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        ),
        requiredPermissions: [
          'visualizar_frota',
          'registrar_km_frota',
          'gerenciar_frota',
        ],
      },
      {
        to: '/abastecimentos',
        label: 'Abastecimentos',
        icon: (
          <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        ),
        requiredPermissions: ['visualizar_frota', 'gerenciar_frota'],
      },
      {
        to: '/manutencoes-veiculos',
        label: 'Manutenções',
        icon: (
          <Icon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        ),
        requiredPermissions: ['visualizar_frota', 'gerenciar_frota'],
      },
    ],
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
    requiredPermissions: ['criar_usuario', 'editar_usuario', 'definir_perfil'],
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
    label: 'Execução',
    icon: <Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    children: [
      {
        to: '/catalogo-atividades',
        label: 'Catálogo de Atividades',
        icon: <Icon d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
        requiredPermissions: ['gerenciar_catalogo'],
      },
      {
        to: '/vocabulario',
        label: 'Vocabulário',
        icon: <Icon d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
        requiredPermissions: ['gerenciar_catalogo'],
      },
      {
        to: '/retirada-de-itens',
        label: 'Retirada de Itens',
        icon: <Icon d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />,
        requiredPermissions: ['gerenciar_estoque', 'gerenciar_equipamentos'],
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
