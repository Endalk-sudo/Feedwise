import { Outlet, Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import {
  Menu,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Bot,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Building2,
  Bell,
  X,
} from 'lucide-react';
import { useAuthStore, useSyncSession } from '@/lib/stores/auth.store';
import { useUIStore } from '@/lib/stores/ui.store';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui';
import { useMyOrganizations } from '@/features/organization/hooks';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Feedback', href: '/dashboard/feedback', icon: MessageSquare },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'AI Assistant', href: '/dashboard/ai', icon: Bot },
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

function NavItem({ item, isActive, onClose }: { item: (typeof navigation)[0]; isActive: boolean; onClose: () => void }) {
  return (
    <Link
      to={item.href}
      onClick={onClose}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
        isActive
          ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-foreground border border-primary/30'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
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
  const { user, activeOrganization, logout, setActiveOrganization } = useAuthStore();
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useUIStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [orgSwitcherOpen, setOrgSwitcherOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const orgSwitcherRef = useRef<HTMLDivElement>(null);

  const { data: myOrgs } = useMyOrganizations();
  const orgs = myOrgs ?? [];
  const multipleOrgs = orgs.length > 1;
  const currentOrg = activeOrganization;

  // Pre-build org list items to avoid JSX parsing issues with nested maps
  const orgListItems = orgs.map((orgData) => (
    <li key={orgData.organization.id}>
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          setActiveOrganization({
            id: orgData.organization.id,
            slug: orgData.organization.slug,
            name: orgData.organization.name,
            currentPlan: orgData.organization.currentPlan,
          });
          setOrgSwitcherOpen(false);
        }}
        className={cn(
          'w-full px-4 py-2.5 text-left text-sm text-foreground hover:text-foreground hover:bg-muted transition-colors',
          currentOrg?.id === orgData.organization.id && 'font-medium bg-primary/10',
        )}
      >
        <div className="flex items-center justify-between">
          <span className="truncate">{orgData.organization.name}</span>
          {currentOrg?.id === orgData.organization.id && (
            <span className="w-2 h-2 bg-primary rounded-full shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">@{orgData.organization.slug}</p>
      </button>
    </li>
  ));

  // Keep the persisted session in sync while inside the dashboard
  useSyncSession();

  // Close mobile sidebar on navigation
  useEffect(() => {
    if (sidebarOpen) setSidebarOpen(false);
  }, [pathname, sidebarOpen, setSidebarOpen]);

  // Handle clicks outside dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuOpen && userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsOpen && notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (orgSwitcherOpen && orgSwitcherRef.current && !orgSwitcherRef.current.contains(e.target as Node)) {
        setOrgSwitcherOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen, notificationsOpen, orgSwitcherOpen]);

  // Keyboard accessibility for dropdowns
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        setNotificationsOpen(false);
        setOrgSwitcherOpen(false);
      }
    }
    if (userMenuOpen || notificationsOpen || orgSwitcherOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [userMenuOpen, notificationsOpen, orgSwitcherOpen]);

  const handleLogout = async () => {
    await authClient.signOut();
    logout();
    navigate({ to: '/' });
  };

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  // Mock alerts for now — in production this would come from /api/analytics/:slug/alerts
  const mockAlerts = [
    { id: '1', category: 'Service', text: 'Long wait times reported', urgency: 'High', createdAt: new Date() },
    { id: '2', category: 'Food Quality', text: 'Cold food complaint', urgency: 'Medium', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (doubles as the mobile drawer) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <Logo size="md" />
            <div>
              <h1 className="font-bold text-lg">Feedwise</h1>
              <p className="text-xs text-muted-foreground">Dashboard</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <NavItem
                key={item.name}
                item={item}
                isActive={isActive(item.href)}
                onClose={() => setSidebarOpen(false)}
              />
            ))}
          </nav>

          {/* Organization switcher */}
          {currentOrg && (
            <div className="p-4 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Current Organization
              </p>
              <div className="flex items-center gap-3 p-3 bg-muted/60 rounded-lg">
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
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all w-full"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <button
                className="lg:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => toggleSidebar()}
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button
                  className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Notifications"
                  aria-expanded={notificationsOpen}
                  aria-haspopup="dialog"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <Bell className="w-5 h-5" />
                  {mockAlerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                      {mockAlerts.length > 9 ? '9+' : mockAlerts.length}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-lg z-50 py-2"
                    role="dialog"
                    aria-label="Notifications"
                  >
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                      <h3 className="font-medium text-foreground">Notifications</h3>
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        aria-label="Close notifications"
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {mockAlerts.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-muted-foreground">No new notifications</p>
                      ) : (
                        <ul className="divide-y divide-border">
                          {mockAlerts.map((alert) => (
                            <li key={alert.id} className="p-4 hover:bg-muted/50">
                              <div className="flex items-start gap-2">
                                <span className="w-2 h-2 rounded-full mt-2 bg-destructive shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{alert.category}</p>
                                  <p className="text-xs text-muted-foreground truncate">{alert.text}</p>
                                </div>
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                  {Math.round((Date.now() - alert.createdAt.getTime()) / 60000)}m ago
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Organization switcher */}
              {multipleOrgs && (
                <div className="relative" ref={orgSwitcherRef}>
                  <button
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Switch organization"
                    aria-expanded={orgSwitcherOpen}
                    aria-haspopup="menu"
                    onClick={() => setOrgSwitcherOpen(!orgSwitcherOpen)}
                  >
                    <Building2 className="w-5 h-5" />
                  </button>

                  {orgSwitcherOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-60 bg-card border border-border rounded-xl shadow-lg z-50 py-2"
                      role="menu"
                      aria-label="Switch organization"
                    >
                      <div className="px-4 py-2 border-b border-border text-xs font-medium text-muted-foreground uppercase">
                        Switch Organization
                      </div>
                      <ul>
                        {orgListItems}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-muted transition-colors"
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-medium text-primary-foreground">
                    {user?.name?.charAt(0).toUpperCase() ||
                      user?.email?.charAt(0).toUpperCase() ||
                      'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-foreground">{user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">
                      {currentOrg?.name || 'No organization'}
                    </p>
                  </div>
                  <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', userMenuOpen && 'rotate-180')} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-hidden="true" />
                    <div
                      className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-lg z-50 py-2"
                      role="menu"
                      aria-label="User menu"
                    >
                      <div className="px-4 py-3 border-b border-border">
                        <p className="font-medium text-foreground">{user?.name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                      <Link
                        to="/dashboard/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-foreground hover:text-foreground hover:bg-muted transition-colors"
                        role="menuitem"
                      >
                        <Settings className="w-5 h-5" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        role="menuitem"
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-destructive hover:text-destructive/80 hover:bg-muted transition-colors"
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