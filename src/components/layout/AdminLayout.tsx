import { type ReactNode, useCallback, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useSessionTimer } from '../../lib/useSessionTimer';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';

const SESSAO_SEGUNDOS = 15 * 60;

interface AdminLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
}

export function AdminLayout({ children, sidebar }: AdminLayoutProps) {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const segundosRestantes = useSessionTimer(SESSAO_SEGUNDOS, logout);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <div className="flex min-h-full flex-col">
      <AdminHeader
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        timeLeft={segundosRestantes}
        sessionDuration={SESSAO_SEGUNDOS}
      />
      <div className="flex flex-1">
        <AdminSidebar
          openOnMobile={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-6 lg:pr-8">
          {sidebar && (
            <div className="mb-6 flex flex-wrap items-center gap-3">
              {sidebar}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
