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
import { useAuthStore, useOrgSlug, useSyncSession } from '@/lib/stores/auth.store';
import { useUIStore } from '@/lib/stores/ui.store';
import { authClient } from '@/lib/auth-client';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { Logo } from '@/components/ui';
import { useMyOrganizations } from '@/features/organization/hooks';
import { useAlerts } from '@/features/feedback/hooks';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Feedback', href: '/dashboard/feedback', icon: MessageSquare },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'AI Assistant', href: '/dashboard/ai', icon: Bot },
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

function NavItem({
  item,
  isActive,
  onClose,
}: {
  item: (typeof navigation)[0];
  isActive: boolean;
  onClose: () => void;
}) {
  return (
    <Link
      to={item.href}
      onClick={onClose}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 min-h-11',
        isActive
          ? 'bg-primary/10 text-foreground border border-primary/25 shadow-xs'
          : 'text-muted-foreground border border-transparent hover:text-foreground hover:bg-muted/70',
      )}
    >
      <item.icon
        className={cn(
          'w-5 h-5 flex-shrink-0 transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
        )}
      />
      {item.name}
    </Link>
  );
}

export function DashboardLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, activeOrganization, logout, setActiveOrganization } = useAuthStore();
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useUIStore();
  const queryClient = useQueryClient();
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
  const slug = useOrgSlug();
  const { data: alertsData } = useAlerts(slug);
  const alerts = (alertsData ?? []).slice(0, 5);
  const unreadCount = alerts.length;

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
          'w-full px-3 py-2.5 rounded-xl text-left text-sm text-foreground hover:bg-muted transition-colors min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          currentOrg?.id === orgData.organization.id && 'font-semibold bg-primary/10',
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

  // Guard against a stale persisted organization: if the active org is not in
  // this user's memberships (e.g. localStorage left over from a previous
  // account), switch to their first org and drop every cached query so
  // nothing from the old account renders or refetches.
  useEffect(() => {
    if (!myOrgs) return; // memberships not loaded yet
    if (!activeOrganization) return; // auto-select handled elsewhere
    const isMember = myOrgs.some((m) => m.organization.id === activeOrganization.id);
    if (isMember) return;
    const first = myOrgs[0];
    if (first) {
      setActiveOrganization({
        id: first.organization.id,
        slug: first.organization.slug,
        name: first.organization.name,
        currentPlan: first.organization.currentPlan,
      });
      queryClient.clear();
    } else {
      // User belongs to no org at all — send them to setup.
      setActiveOrganization(null);
      navigate({ to: '/org-setup' });
    }
  }, [activeOrganization, myOrgs, navigate, queryClient, setActiveOrganization]);

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
      if (
        notificationsOpen &&
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target as Node)
      ) {
        setNotificationsOpen(false);
      }
      if (
        orgSwitcherOpen &&
        orgSwitcherRef.current &&
        !orgSwitcherRef.current.contains(e.target as Node)
      ) {
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
    queryClient.clear();
    navigate({ to: '/' });
  };

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (doubles as the mobile drawer) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[268px] bg-card border-r border-border/70 shadow-xs transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-border/70">
            <Logo size="md" />
            <div className="min-w-0">
              <h1 className="font-semibold text-[17px] tracking-tight leading-none">FeedWise</h1>
              <p className="text-xs text-muted-foreground mt-1">Customer workspace</p>
            </div>
          </div>

          {/* Navigation */}
          <nav aria-label="Workspace" className="flex-1 p-3 space-y-1 overflow-y-auto">
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
            <div className="p-3 border-t border-border/70">
              <p className="px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                Workspace
              </p>
              <div className="flex items-center gap-3 p-3 bg-muted/50 border border-border/60 rounded-xl">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                  <Building2 className="w-4.5 h-4.5 text-primary" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate tracking-tight">{currentOrg.name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{currentOrg.slug}</p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom */}
          <div className="p-3 border-t border-border/70">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all w-full min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut className="w-5 h-5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[268px] flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border/70">
          <div className="flex items-center justify-between gap-3 h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2">
              <button
                className="lg:hidden flex h-11 w-11 items-center justify-center -ml-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => toggleSidebar()}
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="min-w-0 hidden sm:block">
                <p className="truncate text-sm font-semibold tracking-tight">
                  {currentOrg?.name ?? 'Workspace'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {currentOrg ? `@${currentOrg.slug}` : 'Select an organization to begin'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button
                  className="relative flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={
                    unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
                  }
                  aria-expanded={notificationsOpen}
                  aria-haspopup="dialog"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-5 h-5 px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-[320px] max-w-[85vw] bg-card border border-border/70 rounded-2xl shadow-xl z-50 py-2"
                    role="dialog"
                    aria-label="Notifications"
                  >
                    <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
                      <h3 className="font-semibold text-[15px] tracking-tight text-foreground">
                        Priority alerts
                      </h3>
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        aria-label="Close notifications"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {alerts.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm leading-relaxed text-muted-foreground">
                          {slug
                            ? 'All clear. New high-priority feedback will appear here.'
                            : 'Select an organization to see priority alerts.'}
                        </p>
                      ) : (
                        <ul className="divide-y divide-border/60">
                          {alerts.map((alert) => (
                            <li key={alert.id}>
                              <Link
                                to="/dashboard/feedback"
                                onClick={() => setNotificationsOpen(false)}
                                className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors"
                              >
                                <span
                                  className={cn(
                                    'w-2 h-2 rounded-full mt-1.5 shrink-0',
                                    alert.urgency === 'High'
                                      ? 'bg-destructive'
                                      : alert.urgency === 'Medium'
                                        ? 'bg-warning'
                                        : 'bg-muted-foreground/40',
                                  )}
                                />
                                <span className="flex-1 min-w-0">
                                  <span className="block text-sm font-medium truncate">
                                    {alert.category}
                                  </span>
                                  <span className="block text-xs leading-relaxed text-muted-foreground line-clamp-2">
                                    {alert.text}
                                  </span>
                                  <span className="block text-[11px] text-muted-foreground mt-1">
                                    {formatRelativeTime(alert.createdAt)}
                                  </span>
                                </span>
                              </Link>
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
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Switch organization"
                    aria-expanded={orgSwitcherOpen}
                    aria-haspopup="menu"
                    onClick={() => setOrgSwitcherOpen(!orgSwitcherOpen)}
                  >
                    <Building2 className="w-5 h-5" />
                  </button>

                  {orgSwitcherOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-64 max-w-[85vw] bg-card border border-border/70 rounded-2xl shadow-xl z-50 py-2"
                      role="menu"
                      aria-label="Switch organization"
                    >
                      <div className="px-4 py-2.5 border-b border-border/70 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                        Switch workspace
                      </div>
                      <ul className="p-1.5">{orgListItems}</ul>
                    </div>
                  )}
                </div>
              )}

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-2 rounded-xl hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-semibold text-primary-foreground shadow-xs">
                    {user?.name?.charAt(0).toUpperCase() ||
                      user?.email?.charAt(0).toUpperCase() ||
                      'U'}
                  </div>
                  <div className="hidden md:block text-left min-w-0 max-w-40">
                    <p className="text-sm font-semibold tracking-tight text-foreground truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {currentOrg?.name || 'No organization'}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-muted-foreground transition-transform',
                      userMenuOpen && 'rotate-180',
                    )}
                  />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                      aria-hidden="true"
                    />
                    <div
                      className="absolute right-0 top-full mt-2 w-60 max-w-[85vw] bg-card border border-border/70 rounded-2xl shadow-xl z-50 py-2"
                      role="menu"
                      aria-label="User menu"
                    >
                      <div className="px-4 py-3 border-b border-border/70 min-w-0">
                        <p className="font-semibold text-sm tracking-tight text-foreground truncate">
                          {user?.name || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                      <div className="p-1.5">
                        <Link
                          to="/dashboard/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors min-h-11"
                          role="menuitem"
                        >
                          <Settings className="w-4.5 h-4.5 text-muted-foreground" />
                          Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          role="menuitem"
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors min-h-11"
                        >
                          <LogOut className="w-4.5 h-4.5" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
