import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface SidebarButtonProps {
  onClick?: () => void;
  active?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function SidebarButton({
  onClick,
  active,
  icon,
  children,
}: SidebarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10',
        active && 'border-border bg-card text-foreground shadow-sm',
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
    </button>
  );
}

interface SidebarLinkProps {
  to: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function SidebarLink({ to, icon, children }: SidebarLinkProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors"
    >
      {icon}
      <span className="truncate">{children}</span>
    </Link>
  );
}

export function SidebarNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed bg-card/60 px-3 py-2 text-xs text-muted-foreground">
      {children}
    </p>
  );
}

const icone = (d: string) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4 shrink-0"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

export function DashboardSidebar() {
  return null;
}

export function UsuariosSidebar({
  viewAtiva,
  onNavegar,
}: {
  viewAtiva: 'analises' | 'lista' | 'novo' | 'cargos';
  onNavegar: (view: 'analises' | 'lista' | 'novo' | 'cargos') => void;
}) {
  return (
    <>
      <SidebarButton
        active={viewAtiva === 'analises'}
        onClick={() => onNavegar('analises')}
        icon={icone('M3 3v18h18M18 17V9M13 17V5M8 17v-3')}
      >
        Análises
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'lista'}
        onClick={() => onNavegar('lista')}
        icon={icone('M4 6h16M4 10h16M4 14h16M4 18h16')}
      >
        Lista de Usuários
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'novo'}
        onClick={() => onNavegar('novo')}
        icon={icone('M12 4v16m8-8H4')}
      >
        Novo Usuário
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'cargos'}
        onClick={() => onNavegar('cargos')}
        icon={icone(
          'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
        )}
      >
        Cargos
      </SidebarButton>
    </>
  );
}

export function FrotaSidebar({
  viewAtiva,
  onNavegar,
}: {
  viewAtiva: 'analises' | 'lista' | 'novo';
  onNavegar: (view: 'analises' | 'lista' | 'novo') => void;
}) {
  return (
    <>
      <SidebarButton
        active={viewAtiva === 'analises'}
        onClick={() => onNavegar('analises')}
        icon={icone('M3 3v18h18M18 17V9M13 17V5M8 17v-3')}
      >
        Análises
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'lista'}
        onClick={() => onNavegar('lista')}
        icon={icone('M4 6h16M4 10h16M4 14h16M4 18h16')}
      >
        Lista de Veículos
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'novo'}
        onClick={() => onNavegar('novo')}
        icon={icone('M12 4v16m8-8H4')}
      >
        Novo Veículo
      </SidebarButton>
      <SidebarNote>
        Frota: veículos, km diário, abastecimentos e manutenções.
      </SidebarNote>
    </>
  );
}

export function FrotaLinksSidebar() {
  return (
    <>
      <SidebarLink
        to="/veiculos"
        icon={icone(
          'M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h1l1-2h6l1 2h1a2 2 0 012 2v6a2 2 0 01-2 2M5 17a2 2 0 100 4 2 2 0 000-4zM19 17a2 2 0 100 4 2 2 0 000-4z',
        )}
      >
        Veículos
      </SidebarLink>
      <SidebarLink
        to="/frota-km"
        icon={icone('M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z')}
      >
        Km Diário
      </SidebarLink>
      <SidebarLink
        to="/abastecimentos"
        icon={icone(
          'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
        )}
      >
        Abastecimentos
      </SidebarLink>
      <SidebarLink
        to="/manutencoes-veiculos"
        icon={icone(
          'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
        )}
      >
        Manutenções
      </SidebarLink>
    </>
  );
}

export function ServicosSidebar({
  viewAtiva,
  onNavegar,
}: {
  viewAtiva: 'analises' | 'lista' | 'novo';
  onNavegar: (view: 'analises' | 'lista' | 'novo') => void;
}) {
  return (
    <>
      <SidebarButton
        active={viewAtiva === 'analises'}
        onClick={() => onNavegar('analises')}
        icon={icone('M3 3v18h18M18 17V9M13 17V5M8 17v-3')}
      >
        Análises
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'lista'}
        onClick={() => onNavegar('lista')}
        icon={icone('M4 6h16M4 10h16M4 14h16M4 18h16')}
      >
        Lista de Serviços
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'novo'}
        onClick={() => onNavegar('novo')}
        icon={icone('M12 4v16m8-8H4')}
      >
        Novo Serviço
      </SidebarButton>
      <SidebarNote>
        Gerencia os serviços de marketing exibidos na página de orçamento.
      </SidebarNote>
    </>
  );
}

export function EquipamentosSidebar({
  viewAtiva,
  onNavegar,
}: {
  viewAtiva: 'analises' | 'lista' | 'novo';
  onNavegar: (view: 'analises' | 'lista' | 'novo') => void;
}) {
  return (
    <>
      <SidebarButton
        active={viewAtiva === 'analises'}
        onClick={() => onNavegar('analises')}
        icon={icone('M3 3v18h18M18 17V9M13 17V5M8 17v-3')}
      >
        Análises
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'lista'}
        onClick={() => onNavegar('lista')}
        icon={icone('M4 6h16M4 10h16M4 14h16M4 18h16')}
      >
        Lista de Equipamentos
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'novo'}
        onClick={() => onNavegar('novo')}
        icon={icone('M12 4v16m8-8H4')}
      >
        Novo Equipamento
      </SidebarButton>
      <SidebarNote>
        Cadastro e patrimônio dos equipamentos.
      </SidebarNote>
    </>
  );
}

export function ManutencoesSidebar({
  viewAtiva,
  onNavegar,
}: {
  viewAtiva: 'analises' | 'lista' | 'novo';
  onNavegar: (view: 'analises' | 'lista' | 'novo') => void;
}) {
  return (
    <>
      <SidebarButton
        active={viewAtiva === 'analises'}
        onClick={() => onNavegar('analises')}
        icon={icone('M3 3v18h18M18 17V9M13 17V5M8 17v-3')}
      >
        Análises
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'lista'}
        onClick={() => onNavegar('lista')}
        icon={icone('M4 6h16M4 10h16M4 14h16M4 18h16')}
      >
        Lista de Manutenções
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'novo'}
        onClick={() => onNavegar('novo')}
        icon={icone('M12 4v16m8-8H4')}
      >
        Nova Manutenção
      </SidebarButton>
      <SidebarNote>
        Manutenção preventiva e corretiva dos equipamentos.
      </SidebarNote>
    </>
  );
}

export function EpisSidebar({
  viewAtiva,
  onNavegar,
}: {
  viewAtiva: 'analises' | 'lista' | 'novo';
  onNavegar: (view: 'analises' | 'lista' | 'novo') => void;
}) {
  return (
    <>
      <SidebarButton
        active={viewAtiva === 'analises'}
        onClick={() => onNavegar('analises')}
        icon={icone('M3 3v18h18M18 17V9M13 17V5M8 17v-3')}
      >
        Análises
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'lista'}
        onClick={() => onNavegar('lista')}
        icon={icone('M4 6h16M4 10h16M4 14h16M4 18h16')}
      >
        Lista de EPIs
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'novo'}
        onClick={() => onNavegar('novo')}
        icon={icone('M12 4v16m8-8H4')}
      >
        Novo EPI
      </SidebarButton>
      <SidebarNote>
        Cadastro e gestão de equipamentos de proteção individual.
      </SidebarNote>
    </>
  );
}

export function EmBreveSidebar({ texto }: { texto: string }) {
  return <SidebarNote>{texto}</SidebarNote>;
}

export function AtendimentosSidebar({
  viewAtiva,
  onNavegar,
}: {
  viewAtiva: 'analises' | 'lista' | 'novo';
  onNavegar: (view: 'analises' | 'lista' | 'novo') => void;
}) {
  return (
    <>
      <SidebarButton
        active={viewAtiva === 'analises'}
        onClick={() => onNavegar('analises')}
        icon={icone('M3 3v18h18M18 17V9M13 17V5M8 17v-3')}
      >
        Análises
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'lista'}
        onClick={() => onNavegar('lista')}
        icon={icone('M4 6h16M4 10h16M4 14h16M4 18h16')}
      >
        Lista de Atendimentos
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'novo'}
        onClick={() => onNavegar('novo')}
        icon={icone('M12 4v16m8-8H4')}
      >
        Novo Atendimento
      </SidebarButton>
    </>
  );
}

export function ObrasSidebar({
  viewAtiva,
  onNavegar,
}: {
  viewAtiva: 'analises' | 'lista' | 'novo';
  onNavegar: (view: 'analises' | 'lista' | 'novo') => void;
}) {
  return (
    <>
      <SidebarButton
        active={viewAtiva === 'analises'}
        onClick={() => onNavegar('analises')}
        icon={icone('M3 3v18h18M18 17V9M13 17V5M8 17v-3')}
      >
        Análises
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'lista'}
        onClick={() => onNavegar('lista')}
        icon={icone('M4 6h16M4 10h16M4 14h16M4 18h16')}
      >
        Lista de Obras
      </SidebarButton>
    </>
  );
}

export function OrcamentosSidebar({
  viewAtiva,
  onNavegar,
}: {
  viewAtiva: 'analises' | 'lista' | 'novo';
  onNavegar: (view: 'analises' | 'lista' | 'novo') => void;
}) {
  return (
    <>
      <SidebarButton
        active={viewAtiva === 'analises'}
        onClick={() => onNavegar('analises')}
        icon={icone('M3 3v18h18M18 17V9M13 17V5M8 17v-3')}
      >
        Análises
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'lista'}
        onClick={() => onNavegar('lista')}
        icon={icone('M4 6h16M4 10h16M4 14h16M4 18h16')}
      >
        Lista de Orçamentos
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'novo'}
        onClick={() => onNavegar('novo')}
        icon={icone('M12 4v16m8-8H4')}
      >
        Novo Orçamento
      </SidebarButton>
    </>
  );
}

export function OSSidebar({
  viewAtiva,
  onNavegar,
}: {
  viewAtiva: 'analises' | 'lista' | 'novo';
  onNavegar: (view: 'analises' | 'lista' | 'novo') => void;
}) {
  return (
    <>
      <SidebarButton
        active={viewAtiva === 'analises'}
        onClick={() => onNavegar('analises')}
        icon={icone('M3 3v18h18M18 17V9M13 17V5M8 17v-3')}
      >
        Análises
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'lista'}
        onClick={() => onNavegar('lista')}
        icon={icone('M4 6h16M4 10h16M4 14h16M4 18h16')}
      >
        Lista de Ordens de Serviço
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'novo'}
        onClick={() => onNavegar('novo')}
        icon={icone('M12 4v16m8-8H4')}
      >
        Nova OS
      </SidebarButton>
    </>
  );
}

export function AgendamentosSidebar({
  viewAtiva,
  onNavegar,
}: {
  viewAtiva: 'analises' | 'lista' | 'novo';
  onNavegar: (view: 'analises' | 'lista' | 'novo') => void;
}) {
  return (
    <>
      <SidebarButton
        active={viewAtiva === 'analises'}
        onClick={() => onNavegar('analises')}
        icon={icone('M3 3v18h18M18 17V9M13 17V5M8 17v-3')}
      >
        Análises
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'lista'}
        onClick={() => onNavegar('lista')}
        icon={icone('M4 6h16M4 10h16M4 14h16M4 18h16')}
      >
        Lista de Agendamentos
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'novo'}
        onClick={() => onNavegar('novo')}
        icon={icone('M12 4v16m8-8H4')}
      >
        Novo Agendamento
      </SidebarButton>
    </>
  );
}

export function CalendarioSidebar({
  viewAtiva,
  onNavegar,
}: {
  viewAtiva: 'calendario' | 'disponibilidade' | 'datas' | 'padroes';
  onNavegar: (view: 'calendario' | 'disponibilidade' | 'datas' | 'padroes') => void;
}) {
  return (
    <>
      <SidebarButton
        active={viewAtiva === 'calendario'}
        onClick={() => onNavegar('calendario')}
        icon={icone('M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z')}
      >
        Calendário
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'disponibilidade'}
        onClick={() => onNavegar('disponibilidade')}
        icon={icone('M12 6v6m0 0v6m0-6h6m-6 0H6')}
      >
        Gerenciar Disponibilidade
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'datas'}
        onClick={() => onNavegar('datas')}
        icon={icone('M8 7V3m8 4V3M3 11h18')}
      >
        Datas Específicas
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'padroes'}
        onClick={() => onNavegar('padroes')}
        icon={icone('M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z')}
      >
        Horários Recorrentes
      </SidebarButton>
    </>
  );
}

export function MateriaisSidebar({
  viewAtiva,
  onNavegar,
}: {
  viewAtiva: 'analises' | 'lista' | 'novo';
  onNavegar: (view: 'analises' | 'lista' | 'novo') => void;
}) {
  return (
    <>
      <SidebarButton
        active={viewAtiva === 'analises'}
        onClick={() => onNavegar('analises')}
        icon={icone('M3 3v18h18M18 17V9M13 17V5M8 17v-3')}
      >
        Análises
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'lista'}
        onClick={() => onNavegar('lista')}
        icon={icone('M4 6h16M4 10h16M4 14h16M4 18h16')}
      >
        Lista de Materiais
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'novo'}
        onClick={() => onNavegar('novo')}
        icon={icone('M12 4v16m8-8H4')}
      >
        Novo Material
      </SidebarButton>
      <SidebarNote>
        Cadastro, saldo e movimentação (entrada/saída) do estoque.
      </SidebarNote>
    </>
  );
}

export function RbacSidebar({
  viewAtiva,
  onNavegar,
}: {
  viewAtiva: 'papeis' | 'permissoes';
  onNavegar: (view: 'papeis' | 'permissoes') => void;
}) {
  return (
    <>
      <SidebarButton
        active={viewAtiva === 'papeis'}
        onClick={() => onNavegar('papeis')}
        icon={icone(
          'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
        )}
      >
        Papéis
      </SidebarButton>
      <SidebarNote>
        Clique em um papel para gerenciar suas permissões.
      </SidebarNote>
    </>
  );
}

export function CatalogoAtividadesSidebar({
  viewAtiva,
  onNavegar,
}: {
  viewAtiva: 'analises' | 'lista' | 'novo' | 'editar';
  onNavegar: (view: 'analises' | 'lista' | 'novo' | 'editar') => void;
}) {
  return (
    <>
      <SidebarButton
        active={viewAtiva === 'analises'}
        onClick={() => onNavegar('analises')}
        icon={icone('M3 3v18h18M18 17V9M13 17V5M8 17v-3')}
      >
        Análises
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'lista'}
        onClick={() => onNavegar('lista')}
        icon={icone('M4 6h16M4 10h16M4 14h16M4 18h16')}
      >
        Lista de Atividades
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'novo'}
        onClick={() => onNavegar('novo')}
        icon={icone('M12 4v16m8-8H4')}
      >
        Nova Atividade
      </SidebarButton>
      <SidebarNote>
        Catálogo de atividades padrão para planejamento de execução.
      </SidebarNote>
    </>
  );
}

export function VocabularioSidebar({
  viewAtiva,
  onNavegar,
}: {
  viewAtiva:
    | 'analises'
    | 'etapas'
    | 'termos'
    | 'sub-servicos'
    | 'combos';
  onNavegar: (
    view: 'analises' | 'etapas' | 'termos' | 'sub-servicos' | 'combos',
  ) => void;
}) {
  return (
    <>
      <SidebarButton
        active={viewAtiva === 'analises'}
        onClick={() => onNavegar('analises')}
        icon={icone('M3 3v18h18M18 17V9M13 17V5M8 17v-3')}
      >
        Análises
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'etapas'}
        onClick={() => onNavegar('etapas')}
        icon={icone('M4 6h16M4 10h16M4 14h16M4 18h16')}
      >
        Etapas
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'termos'}
        onClick={() => onNavegar('termos')}
        icon={icone('M11 4H4v16h7v-6h6V10h-6V4z')}
      >
        Termos
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'sub-servicos'}
        onClick={() => onNavegar('sub-servicos')}
        icon={icone('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2')}
      >
        Sub-serviços
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'combos'}
        onClick={() => onNavegar('combos')}
        icon={icone('M13 10V3L4 14h7v7l9-11h-7z')}
      >
        Combos
      </SidebarButton>
      <SidebarNote>
        Vocabulário do orçamento: etapas, termos, sub-serviços e
        combinações.
      </SidebarNote>
    </>
  );
}

export function EquipesSidebar({
  viewAtiva,
  onNavegar,
}: {
  viewAtiva: 'analises' | 'lista' | 'novo';
  onNavegar: (view: 'analises' | 'lista' | 'novo') => void;
}) {
  return (
    <>
      <SidebarButton
        active={viewAtiva === 'analises'}
        onClick={() => onNavegar('analises')}
        icon={icone('M3 3v18h18M18 17V9M13 17V5M8 17v-3')}
      >
        Análises
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'lista'}
        onClick={() => onNavegar('lista')}
        icon={icone('M4 6h16M4 10h16M4 14h16M4 18h16')}
      >
        Lista de Equipes
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'novo'}
        onClick={() => onNavegar('novo')}
        icon={icone('M12 4v16m8-8H4')}
      >
        Nova Equipe
      </SidebarButton>
      <SidebarNote>Gerencie equipes de execução e seus membros.</SidebarNote>
    </>
  );
}

export function AlmoxarifeSidebar({
  viewAtiva,
  onNavegar,
}: {
  viewAtiva: 'analises' | 'lista';
  onNavegar: (view: 'analises' | 'lista') => void;
}) {
  return (
    <>
      <SidebarButton
        active={viewAtiva === 'analises'}
        onClick={() => onNavegar('analises')}
        icon={icone('M3 3v18h18M18 17V9M13 17V5M8 17v-3')}
      >
        Análises
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'lista'}
        onClick={() => onNavegar('lista')}
        icon={icone('M4 6h16M4 10h16M4 14h16M4 18h16')}
      >
        Separações
      </SidebarButton>
      <SidebarNote>
        Gerencie separações e retiradas de materiais/equipamentos.
      </SidebarNote>
    </>
  );
}

export function MovimentacaoSidebar({
  viewAtiva,
  onNavegar,
}: {
  viewAtiva: 'analises' | 'lista';
  onNavegar: (view: 'analises' | 'lista') => void;
}) {
  return (
    <>
      <SidebarButton
        active={viewAtiva === 'analises'}
        onClick={() => onNavegar('analises')}
        icon={icone('M3 3v18h18M18 17V9M13 17V5M8 17v-3')}
      >
        Análises
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'lista'}
        onClick={() => onNavegar('lista')}
        icon={icone('M4 6h16M4 10h16M4 14h16M4 18h16')}
      >
        Movimentações
      </SidebarButton>
      <SidebarNote>
        Acompanhe movimentações de equipamentos, EPIs e materiais.
      </SidebarNote>
    </>
  );
}

export function RetiradaDeItensSidebar() {
  return (
    <>
      <SidebarButton
        active
        icon={icone('M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10')}
      >
        Retirada de Itens
      </SidebarButton>
      <SidebarNote>
        Gerencie retiradas e devoluções de equipamentos, EPIs e materiais.
      </SidebarNote>
    </>
  );
}
