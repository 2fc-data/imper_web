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
        Cadastro, patrimônio, retiradas e devoluções dos equipamentos.
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

export function ClienteSidebar() {
  return (
    <SidebarNote>
      Portal do cliente: acompanhe seus dados e ordens de serviço.
    </SidebarNote>
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

export function MateriaisSidebar({
  viewAtiva,
  onNavegar,
}: {
  viewAtiva: 'analises' | 'lista' | 'novo' | 'movimentos';
  onNavegar: (view: 'analises' | 'lista' | 'novo' | 'movimentos') => void;
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

export function VisitasSidebar({
  viewAtiva,
  onNavegar,
}: {
  viewAtiva: 'analises' | 'lista' | 'agendar' | 'realizar';
  onNavegar: (view: 'analises' | 'lista' | 'agendar' | 'realizar') => void;
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
        Lista de Visitas
      </SidebarButton>
      <SidebarButton
        active={viewAtiva === 'agendar'}
        onClick={() => onNavegar('agendar')}
        icon={icone('M12 4v16m8-8H4')}
      >
        Agendar Visita
      </SidebarButton>
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
