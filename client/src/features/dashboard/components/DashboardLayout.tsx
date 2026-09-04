import { Outlet, Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import { X, Menu, LayoutDashboard, MessageSquare, BarChart3, Bot, Settings, LogOut, ChevronDown, Building2, Bell } from 'lucide-react';
import { useAuthStore, useSyncSession } from '@/lib/stores/auth.store';
import { useUIStore } from '@/lib/stores/ui.store';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Feedback', href: '/dashboard/feedback', icon: MessageSquare },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'AI Assistant', href: '/dashboard/ai', icon: Bot },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

function NavItem({ item, isActive }: { item: typeof navigation[0]; isActive: boolean }) {
  return (
    <Link
      to={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
        isActive
          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-foreground border border-blue-500/30'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
      )}
    >
      <item.icon className="w-5 h-5 flex-shrink-0" />
      {item.name}
    </Link>
  );
}

export function DashboardLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, activeOrganization, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Keep the persisted session in sync while inside the dashboard
  useSyncSession();

  const handleLogout = async () => {
    await authClient.signOut();
    logout();
    navigate({ to: '/' });
  };

  const currentOrg = activeOrganization;
  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => toggleSidebar()}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">FeedbackAI</h1>
              <p className="text-xs text-muted-foreground">Dashboard</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} isActive={isActive(item.href)} />
            ))}
          </nav>

          {/* Organization switcher */}
          {currentOrg && (
            <div className="p-4 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Current Organization</p>
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <Building2 className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{currentOrg.name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{currentOrg.slug}</p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom */}
          <div className="p-4 border-t border-border">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all w-full"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card/80 backdrop-blur-sm border border-border rounded-lg text-foreground hover:text-foreground transition-colors"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-bold">Menu</h2>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                >
                  <item.icon className="w-6 h-6" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold hidden sm:block">Dashboard</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-foreground">{user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{currentOrg?.name || 'No organization'}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50 py-2">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="font-medium text-foreground">{user?.name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                      <Link
                        to="/dashboard/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                      >
                        <Settings className="w-5 h-5" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-destructive hover:text-destructive/80 hover:bg-secondary/50 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}