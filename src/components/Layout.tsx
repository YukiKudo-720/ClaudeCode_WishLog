import { NavLink, Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { SyncIndicator } from './SyncIndicator';
import { useAuth } from '@/hooks/useAuth';
import { useSync } from '@/hooks/useSync';
import { signOutCurrent } from '@/lib/auth';

const navItems = [
  { to: '/', label: 'トップ', end: true },
  { to: '/tags', label: 'タグ', end: false },
];

export function Layout() {
  const { user } = useAuth();
  const syncStatus = useSync(user?.uid);

  return (
    <main className="min-h-dvh bg-bg text-text">
      <header className="border-b border-accent/30 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-primary">WishLog</h1>
            <nav className="flex items-center gap-1 text-sm">
              {navItems.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) =>
                    `rounded-md px-2 py-1 transition ${
                      isActive
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-text/70 hover:bg-bg'
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <SyncIndicator status={syncStatus} />
            <span className="hidden text-text/70 sm:inline">
              {user?.displayName ?? user?.email}
            </span>
            <button
              type="button"
              onClick={() => void signOutCurrent()}
              className="inline-flex items-center gap-1 rounded-md border border-accent/40 px-2 py-1 text-text/80 transition hover:bg-bg"
              title="サインアウト"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">サインアウト</span>
            </button>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </section>
    </main>
  );
}
