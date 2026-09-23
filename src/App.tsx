import { Component, lazy, type ReactNode, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { LandingLayout } from './components/landing/LandingLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import {
  AgendamentosSidebar,
  AlmoxarifeSidebar,
  AtendimentosSidebar,
  CalendarioSidebar,
  CatalogoAtividadesSidebar,
  DashboardSidebar,
  EpisSidebar,
  EquipamentosSidebar,
  EquipesSidebar,
  ManutencoesSidebar,
  MateriaisSidebar,
  MovimentacaoSidebar,
  OrcamentosSidebar,
  OSSidebar,
  RbacSidebar,
  RetiradaDeItensSidebar,
  ServicosSidebar,
  UsuariosSidebar,
} from './components/layout/sidebarContent';
import { homeFor } from './lib/nav';

const AgendamentosAdminPage = lazy(() =>
  import('./pages/AgendamentosAdminPage').then((m) => ({
    default: m.AgendamentosAdminPage,
  })),
);
const CalendarioPage = lazy(() =>
  import('./pages/CalendarioPage').then((m) => ({
    default: m.CalendarioPage,
  })),
);
type CalendarioView = import('./pages/CalendarioPage').CalendarioView;
const AtendimentosAdminPage = lazy(() =>
  import('./pages/AtendimentosAdminPage').then((m) => ({
    default: m.AtendimentosAdminPage,
  })),
);
const CatalogosPage = lazy(() =>
  import('./pages/CatalogosPage').then((m) => ({ default: m.CatalogosPage })),
);
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const EpisAdminPage = lazy(() => import('./pages/EpisAdminPage'));
const EquipamentosAdminPage = lazy(
  () => import('./pages/EquipamentosAdminPage'),
);
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const LandingContent = lazy(() => import('./pages/LandingContent'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ManutencoesAdminPage = lazy(() => import('./pages/ManutencoesAdminPage'));
const MateriaisAdminPage = lazy(() => import('./pages/MateriaisAdminPage'));
const MinhaContaPage = lazy(() => import('./pages/MinhaContaPage'));
const OrcamentoPage = lazy(() => import('./pages/OrcamentoPage'));
const OrcamentosAdminPage = lazy(() =>
  import('./pages/OrcamentosAdminPage').then((m) => ({
    default: m.OrcamentosAdminPage,
  })),
);
const OSAdminPage = lazy(() =>
  import('./pages/OSAdminPage').then((m) => ({ default: m.OSAdminPage })),
);
const RbacAdminPage = lazy(() => import('./pages/RbacAdminPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const ServicosAdminPage = lazy(() => import('./pages/ServicosAdminPage'));
const UsuariosPage = lazy(() => import('./pages/UsuariosPage'));
const CatalogoAtividadesPage = lazy(() =>
  import('./pages/CatalogoAtividadesPage').then((m) => ({
    default: m.CatalogoAtividadesPage,
  })),
);
const EquipesPage = lazy(() =>
  import('./pages/EquipesPage').then((m) => ({ default: m.EquipesPage })),
);
const AlmoxarifePage = lazy(() =>
  import('./pages/AlmoxarifePage').then((m) => ({ default: m.AlmoxarifePage })),
);
const MovimentacaoPage = lazy(() =>
  import('./pages/MovimentacaoPage').then((m) => ({
    default: m.MovimentacaoPage,
  })),
);
const RetiradaDeItensPage = lazy(() =>
  import('./pages/RetiradaDeItensPage').then((m) => ({
    default: m.RetiradaDeItensPage,
  })),
);
const ExecucaoDashboardPage = lazy(() =>
  import('./pages/ExecucaoDashboardPage').then((m) => ({
    default: m.ExecucaoDashboardPage,
  })),
);

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4" role="status" aria-live="polite">
      <span className="text-sm text-muted-foreground">Carregando...</span>
    </div>
  );
}

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-4 text-center">
          <p className="text-sm text-destructive">Algo deu errado.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-sm text-primary underline hover:text-primary/80"
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedLayout({
  children,
  requiredPermissions,
  onlyNoPermissions,
  sidebar,
}: {
  children: ReactNode;
  requiredPermissions?: string[];
  onlyNoPermissions?: boolean;
  sidebar?: ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (onlyNoPermissions && user.permissoes.length > 0) {
    return <Navigate to={homeFor(user.permissoes)} replace />;
  }

  if (
    requiredPermissions &&
    !requiredPermissions.some((p) => user.permissoes.includes(p))
  ) {
    return <Navigate to={homeFor(user.permissoes)} replace />;
  }

  return <AdminLayout sidebar={sidebar}>{children}</AdminLayout>;
}

function UsuariosRoute() {
  const [searchParams] = useSearchParams();
  const initialView =
    (searchParams.get('view') as 'analises' | 'lista' | 'novo' | 'cargos') ||
    'lista';
  const [viewAtiva, setViewAtiva] = useState<
    'analises' | 'lista' | 'novo' | 'cargos'
  >(initialView);

  useEffect(() => {
    const v = searchParams.get('view') as
      | 'analises'
      | 'lista'
      | 'novo'
      | 'cargos'
      | null;
    if (v) {
      setViewAtiva(v);
    }
  }, [searchParams]);

  return (
    <ProtectedLayout
      requiredPermissions={[
        'criar_usuario',
        'editar_usuario',
        'definir_perfil',
      ]}
      sidebar={
        <UsuariosSidebar viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
      }
    >
      <UsuariosPage viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
    </ProtectedLayout>
  );
}

function AtendimentosRoute() {
  const [viewAtiva, setViewAtiva] = useState<'analises' | 'lista' | 'novo'>(
    'lista',
  );

  return (
    <ProtectedLayout
      requiredPermissions={['criar_atendimento', 'editar_atendimento']}
      sidebar={
        <AtendimentosSidebar viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
      }
    >
      <AtendimentosAdminPage initialView={viewAtiva} onNavegar={setViewAtiva} />
    </ProtectedLayout>
  );
}

function AgendamentosRoute() {
  const [viewAtiva, setViewAtiva] = useState<'analises' | 'lista' | 'novo'>(
    'lista',
  );

  return (
    <ProtectedLayout
      requiredPermissions={['criar_atendimento', 'editar_atendimento']}
      sidebar={
        <AgendamentosSidebar viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
      }
    >
      <AgendamentosAdminPage initialView={viewAtiva} onNavegar={setViewAtiva} />
    </ProtectedLayout>
  );
}

function CalendarioRoute() {
  const [viewAtiva, setViewAtiva] = useState<CalendarioView>('calendario');

  return (
    <ProtectedLayout
      requiredPermissions={['criar_atendimento', 'editar_atendimento']}
      sidebar={
        <CalendarioSidebar viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
      }
    >
      <CalendarioPage viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
    </ProtectedLayout>
  );
}

function OrcamentosRoute() {
  const [searchParams] = useSearchParams();
  const initialView =
    (searchParams.get('view') as 'analises' | 'lista' | 'novo') || 'lista';
  const [viewAtiva, setViewAtiva] = useState<'analises' | 'lista' | 'novo'>(
    initialView,
  );

  useEffect(() => {
    const v = searchParams.get('view') as 'analises' | 'lista' | 'novo' | null;
    if (v) setViewAtiva(v);
  }, [searchParams]);

  return (
    <ProtectedLayout
      requiredPermissions={['aprovar_compra', 'ver_financeiro']}
      sidebar={
        <OrcamentosSidebar viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
      }
    >
      <OrcamentosAdminPage initialView={viewAtiva} onNavegar={setViewAtiva} />
    </ProtectedLayout>
  );
}

function OSRoute() {
  const [viewAtiva, setViewAtiva] = useState<'analises' | 'lista' | 'novo'>(
    'lista',
  );
  const navigate = useNavigate();

  return (
    <ProtectedLayout
      requiredPermissions={[
        'criar_os',
        'editar_os',
        'iniciar_os',
        'concluir_os',
        'aprovar_os',
        'entregar_os',
      ]}
      sidebar={<OSSidebar viewAtiva={viewAtiva} onNavegar={setViewAtiva} />}
    >
      <OSAdminPage
        viewAtiva={viewAtiva}
        onGoToOrcamentos={() => navigate('/orcamentos')}
      />
    </ProtectedLayout>
  );
}

function EquipamentosRoute() {
  const [viewAtiva, setViewAtiva] = useState<'analises' | 'lista' | 'novo'>(
    'lista',
  );

  return (
    <ProtectedLayout
      requiredPermissions={['gerenciar_estoque', 'gerenciar_equipamentos']}
      sidebar={
        <EquipamentosSidebar viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
      }
    >
      <EquipamentosAdminPage viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
    </ProtectedLayout>
  );
}

function ManutencoesRoute() {
  const [viewAtiva, setViewAtiva] = useState<'analises' | 'lista' | 'novo'>(
    'lista',
  );

  return (
    <ProtectedLayout
      requiredPermissions={['editar_os', 'iniciar_os', 'concluir_os']}
      sidebar={
        <ManutencoesSidebar viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
      }
    >
      <ManutencoesAdminPage viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
    </ProtectedLayout>
  );
}

function EpisRoute() {
  const [viewAtiva, setViewAtiva] = useState<'analises' | 'lista' | 'novo'>(
    'lista',
  );

  return (
    <ProtectedLayout
      requiredPermissions={['gerenciar_epis', 'gerenciar_estoque']}
      sidebar={<EpisSidebar viewAtiva={viewAtiva} onNavegar={setViewAtiva} />}
    >
      <EpisAdminPage viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
    </ProtectedLayout>
  );
}

function MateriaisRoute() {
  const [viewAtiva, setViewAtiva] = useState<
    'analises' | 'lista' | 'novo'
  >('lista');

  return (
    <ProtectedLayout
      requiredPermissions={[
        'gerenciar_estoque',
        'criar_material',
        'entrada_estoque',
      ]}
      sidebar={
        <MateriaisSidebar viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
      }
    >
      <MateriaisAdminPage viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
    </ProtectedLayout>
  );
}

function CatalogosRoute() {
  return (
    <ProtectedLayout
      requiredPermissions={[
        'gerenciar_estoque',
        'gerenciar_equipamentos',
        'gerenciar_epis',
      ]}
      sidebar={<DashboardSidebar />}
    >
      <CatalogosPage />
    </ProtectedLayout>
  );
}

function ServicosRoute() {
  const [viewAtiva, setViewAtiva] = useState<'analises' | 'lista' | 'novo'>(
    'lista',
  );

  return (
    <ProtectedLayout
      requiredPermissions={['criar_servico', 'editar_servico']}
      sidebar={
        <ServicosSidebar viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
      }
    >
      <ServicosAdminPage viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
    </ProtectedLayout>
  );
}

function RbacRoute() {
  const [viewAtiva, setViewAtiva] = useState<'papeis' | 'permissoes'>('papeis');

  return (
    <ProtectedLayout
      requiredPermissions={['gerenciar_papeis']}
      sidebar={<RbacSidebar viewAtiva={viewAtiva} onNavegar={setViewAtiva} />}
    >
      <RbacAdminPage viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
    </ProtectedLayout>
  );
}

function CatalogoAtividadesRoute() {
  const [viewAtiva, setViewAtiva] = useState<'analises' | 'lista' | 'novo'>(
    'lista',
  );

  return (
    <ProtectedLayout
      requiredPermissions={['gerenciar_os', 'criar_os']}
      sidebar={
        <CatalogoAtividadesSidebar
          viewAtiva={viewAtiva}
          onNavegar={setViewAtiva}
        />
      }
    >
      <CatalogoAtividadesPage viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
    </ProtectedLayout>
  );
}

function EquipesRoute() {
  const [viewAtiva, setViewAtiva] = useState<'analises' | 'lista' | 'novo'>(
    'lista',
  );

  return (
    <ProtectedLayout
      requiredPermissions={['gerenciar_os', 'criar_os']}
      sidebar={
        <EquipesSidebar viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
      }
    >
      <EquipesPage viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
    </ProtectedLayout>
  );
}

function AlmoxarifeRoute() {
  const [viewAtiva, setViewAtiva] = useState<'analises' | 'lista'>('lista');

  return (
    <ProtectedLayout
      requiredPermissions={['gerenciar_estoque', 'gerenciar_equipamentos']}
      sidebar={
        <AlmoxarifeSidebar viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
      }
    >
      <AlmoxarifePage viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
    </ProtectedLayout>
  );
}

function MovimentacaoRoute() {
  const [viewAtiva, setViewAtiva] = useState<'analises' | 'lista'>('lista');

  return (
    <ProtectedLayout
      requiredPermissions={['gerenciar_estoque', 'gerenciar_equipamentos']}
      sidebar={
        <MovimentacaoSidebar viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
      }
    >
      <MovimentacaoPage viewAtiva={viewAtiva} onNavegar={setViewAtiva} />
    </ProtectedLayout>
  );
}

function RetiradaDeItensRoute() {
  return (
    <ProtectedLayout
      requiredPermissions={['gerenciar_estoque', 'gerenciar_equipamentos']}
      sidebar={<RetiradaDeItensSidebar />}
    >
      <RetiradaDeItensPage />
    </ProtectedLayout>
  );
}

function ExecucaoDashboardRoute() {
  return (
    <ProtectedLayout
      requiredPermissions={['gerenciar_os', 'criar_os', 'iniciar_os']}
      sidebar={<DashboardSidebar />}
    >
      <ExecucaoDashboardPage viewAtiva="dashboard" />
    </ProtectedLayout>
  );
}

function GuestsOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={homeFor(user.permissoes)} replace />;
  return <>{children}</>;
}

function CatchAllRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? homeFor(user.permissoes) : '/login'} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        <Routes>
        <Route
          path="/login"
          element={
            <GuestsOnly>
              <LoginPage />
            </GuestsOnly>
          }
        />
        <Route
          path="/cadastro"
          element={
            <GuestsOnly>
              <RegisterPage />
            </GuestsOnly>
          }
        />
        <Route
          path="/recuperar-senha"
          element={
            <GuestsOnly>
              <ForgotPasswordPage />
            </GuestsOnly>
          }
        />
        <Route
          path="/redefinir-senha"
          element={
            <GuestsOnly>
              <ResetPasswordPage />
            </GuestsOnly>
          }
        />
        <Route element={<UsuariosRoute />} path="/usuarios" />
        <Route element={<ServicosRoute />} path="/servicos-admin" />
        <Route element={<RbacRoute />} path="/rbac" />
        <Route
          element={
            <LandingLayout>
              <LandingContent />
            </LandingLayout>
          }
          path="/"
        />
        <Route
          element={
            <LandingLayout>
              <LandingContent />
            </LandingLayout>
          }
          path="/servicos"
        />
        <Route
          element={
            <LandingLayout>
              <LandingContent />
            </LandingLayout>
          }
          path="/como-trabalhamos"
        />
        <Route
          element={
            <LandingLayout>
              <LandingContent />
            </LandingLayout>
          }
          path="/area-de-atuacao"
        />
        <Route
          element={
            <LandingLayout>
              <LandingContent />
            </LandingLayout>
          }
          path="/contato"
        />
        <Route
          element={
            <LandingLayout>
              <OrcamentoPage />
            </LandingLayout>
          }
          path="/orcamento"
        />
        <Route
          path="/painel"
          element={
            <ProtectedLayout sidebar={<DashboardSidebar />}>
              <DashboardPage />
            </ProtectedLayout>
          }
        />
        <Route element={<AtendimentosRoute />} path="/atendimentos" />
        <Route element={<AgendamentosRoute />} path="/agendamentos" />
        <Route element={<CalendarioRoute />} path="/calendario" />
        <Route element={<OrcamentosRoute />} path="/orcamentos" />
        <Route element={<OSRoute />} path="/os" />
        <Route element={<CatalogosRoute />} path="/catalogos" />
        <Route element={<EquipamentosRoute />} path="/equipamentos" />
        <Route element={<ManutencoesRoute />} path="/manutencoes" />
        <Route element={<EpisRoute />} path="/epis" />
        <Route element={<MateriaisRoute />} path="/materiais" />
        <Route
          element={<CatalogoAtividadesRoute />}
          path="/catalogo-atividades"
        />
        <Route element={<EquipesRoute />} path="/equipes" />
        <Route element={<AlmoxarifeRoute />} path="/almoxarife" />
        <Route element={<MovimentacaoRoute />} path="/movimentacoes" />
        <Route element={<RetiradaDeItensRoute />} path="/retirada-de-itens" />
        <Route element={<ExecucaoDashboardRoute />} path="/execucao" />
        <Route
          element={
            <ProtectedLayout onlyNoPermissions>
              <MinhaContaPage />
            </ProtectedLayout>
          }
          path="/minha-conta"
        />
        <Route path="*" element={<CatchAllRedirect />} />
      </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
