import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from 'react-router-dom';
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Building2,
  CakeSlice,
  Calendar,
  ChartNoAxesCombined,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  ClipboardList,
  Clock,
  Crown,
  Database,
  Eye,
  EyeOff,
  FilePlus2,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Minus,
  Package,
  Pencil,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Sun,
  Moon,
  Download,
  Menu,
  Trash2,
  TrendingUp,
  User,
  UserPlus,
  Users,
  Wallet,
  Wheat,
  X,
  Zap,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { createClient } from '@supabase/supabase-js';
import { AuthProvider, PAGE_ACCESS, money, useAuth, type Profile, type Role } from './lib/auth';
import { supabase, supabaseConfigured, updateSupabaseConfig, getStoredCredentials } from './lib/supabase';
import { localStore } from './lib/store';
import { useTheme } from './lib/theme';
import { usePWAInstall } from './lib/usePWAInstall';
import Login from './pages/Login';

const queryClient = new QueryClient();

const NAV = [
  { href: '/', title: 'Today', icon: LayoutDashboard },
  { href: '/sales', title: 'Record a sale', icon: ShoppingBag },
  { href: '/expenses', title: 'Record expense', icon: ReceiptText },
  { href: '/transactions', title: 'Transactions', icon: ClipboardList },
  { href: '/reports', title: 'Reports', icon: ChartNoAxesCombined },
  { href: '/staff', title: 'Staff', icon: Users },
];

function ConnectionModal({ onClose }: { onClose: () => void }) {
  const { isLocalMode, switchToLocalMode, switchToLiveMode, configured } = useAuth();
  const [url, setUrl] = useState(() => localStorage.getItem('ycs_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '');
  const [key, setKey] = useState(() => localStorage.getItem('ycs_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      setStatusMsg({ ok: false, text: 'Please enter both the Supabase URL and Anon Key.' });
      return;
    }
    const success = updateSupabaseConfig(url.trim(), key.trim());
    if (success) {
      switchToLiveMode();
      setStatusMsg({ ok: true, text: 'Supabase credentials saved and live connection enabled.' });
      setTimeout(onClose, 1200);
    } else {
      setStatusMsg({ ok: false, text: 'Failed to initialize Supabase client with provided values.' });
    }
  };

  const handleResetData = () => {
    if (window.confirm('Clear all local sales and expense records?')) {
      localStore.resetToDefault();
      setStatusMsg({ ok: true, text: 'Records reset to empty.' });
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="panel max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto relative shadow-2xl">
        <button
          onClick={onClose}
          className="btn-quiet absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="section-row mb-3">
          <div className="flex items-center gap-3">
            <span className="brand-mark w-9 h-9">
              <Database size={18} />
            </span>
            <div>
              <span className="eyebrow">Settings &amp; Database</span>
              <h2 className="section-title text-lg">Shop Connection</h2>
            </div>
          </div>
        </div>

        <p className="page-intro mb-4 text-xs">
          The shop can run using the <strong>Local Store</strong> or connect directly to your <strong>Supabase</strong> database.
        </p>

        <div className="tabs mb-4">
          <button
            type="button"
            className={`tab-btn ${isLocalMode ? 'active' : ''}`}
            onClick={() => {
              switchToLocalMode();
              setStatusMsg({ ok: true, text: 'Switched to Local Store.' });
            }}
          >
            Local Store {isLocalMode ? '✓' : ''}
          </button>
          <button
            type="button"
            className={`tab-btn ${!isLocalMode ? 'active' : ''}`}
            onClick={() => {
              if (!configured && !url) {
                setStatusMsg({ ok: false, text: 'Please enter Supabase credentials below first.' });
                return;
              }
              switchToLiveMode();
              setStatusMsg({ ok: true, text: 'Switched to Live Supabase mode.' });
            }}
          >
            Live Supabase {configured ? '✓' : ''}
          </button>
        </div>

        {statusMsg && (
          <div className={`message ${statusMsg.ok ? 'success' : 'error'} mb-4`}>
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleSave} className="form-grid mb-6">
          <div className="field">
            <label htmlFor="cfg-url">Supabase Project URL</label>
            <input
              id="cfg-url"
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
            />
          </div>
          <div className="field">
            <label htmlFor="cfg-key">Supabase Public Anon Key</label>
            <input
              id="cfg-key"
              type="password"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIs..."
            />
          </div>
          <div className="action-row">
            <button type="submit" className="btn btn-primary">
              Save &amp; Connect Live <ArrowUpRight size={14} />
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetData}
            >
              <RotateCcw size={14} /> Clear Local Records
            </button>
          </div>
        </form>

        <div className="p-3 rounded-lg bg-[hsl(var(--secondary))] text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
          <div className="flex items-center justify-between mb-2">
            <strong className="text-[hsl(var(--foreground))]">Database Setup SQL</strong>
            <a
              href="/supabase-schema.sql"
              download="supabase-schema.sql"
              className="text-[11px] font-bold text-[hsl(var(--accent))] hover:underline"
            >
              Download .sql file
            </a>
          </div>
          <p className="m-0 mb-2">
            The error <code>relation "public.profiles" does not exist</code> occurs because the tables haven’t been created yet. Copy and run the complete schema script in your <strong>Supabase Dashboard → SQL Editor</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const { profile, signOut, isLocalMode } = useAuth();
  const location = useLocation();
  const [showConnect, setShowConnect] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const { isDark, toggleTheme } = useTheme();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const allowedLinks = NAV.filter(link => profile && PAGE_ACCESS[link.href]?.includes(profile.role));
  const initials = profile?.full_name.split(/\s+/).map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'S';

  return (
    <div className="app-shell">
      {/* Desktop / Tablet Sidebar (Hidden on Mobile screens <= 768px) */}
      <aside className="sidebar">
        <Link to="/" className="brand" data-testid="link-brand-home">
          <span className="brand-mark">
            <CakeSlice size={20} />
          </span>
          <span>
            <span className="brand-name">SweetCraft</span>
            <span className="brand-caption">Yoghurt &amp; Cake Shop</span>
          </span>
        </Link>
        <div className="nav-caption">Shop floor</div>
        <nav aria-label="Shop navigation">
          {allowedLinks.map(({ href, title, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              className={`nav-link ${location.pathname === href ? 'active' : ''}`}
              aria-current={location.pathname === href ? 'page' : undefined}
              data-testid={`link-nav-${href === '/' ? 'today' : href.slice(1)}`}
            >
              <Icon size={17} />
              <span>{title}</span>
            </Link>
          ))}
        </nav>

        {/* Global Dark Mode Toggle in Sidebar */}
        <div className="mt-auto pt-4 pb-3 border-t border-[hsl(var(--sidebar-border))]">
          <button
            type="button"
            onClick={toggleTheme}
            data-testid="button-toggle-dark-mode"
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold bg-[hsl(var(--sidebar-accent))]/80 hover:bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))] transition-all shadow-2xs"
            title={isDark ? 'Switch to Light Cream Mode' : 'Switch to Dark Burgundy Mode'}
          >
            <div className="flex items-center gap-2">
              {isDark ? (
                <Moon size={15} className="text-[hsl(var(--sidebar-primary))]" />
              ) : (
                <Sun size={15} className="text-amber-400" />
              )}
              <span>{isDark ? 'Dark Theme' : 'Cream Theme'}</span>
            </div>
            {/* iOS style toggle switch pill */}
            <div
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                isDark ? 'bg-[hsl(var(--sidebar-primary))]' : 'bg-stone-500/70'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform duration-200 ease-in-out ${
                  isDark ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </button>

          {/* In-app Install Button (Desktop/Android) */}
          {isInstallable && !isInstalled && (
            <button
              type="button"
              onClick={() => void install()}
              data-testid="button-pwa-install"
              className="w-full mt-2.5 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] hover:opacity-90 transition-all shadow-xs"
            >
              <Download size={14} />
              <span>Install Mobile App</span>
            </button>
          )}

          {isIOS && !isInstalled && (
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              className="w-full mt-2.5 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium border border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] transition-all"
            >
              <Smartphone size={13} />
              <span>Install on iPhone</span>
            </button>
          )}
        </div>

        <div className="sidebar-bottom">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase tracking-wider font-bold text-[hsl(var(--sidebar-primary))]">
              {isLocalMode ? '● Local Store' : '● Supabase Live'}
            </span>
            <button
              onClick={() => setShowConnect(true)}
              className="text-[10px] text-[hsl(var(--sidebar-primary))] hover:underline cursor-pointer"
            >
              Configure
            </button>
          </div>
          <span>Open the day. Mind the details.</span>
          <br />
          A good day is built one entry at a time.
        </div>
      </aside>

      {/* Sticky Native Mobile Header (Screens <= 768px) */}
      <header className="mobile-app-header">
        <Link to="/" className="flex items-center gap-2 text-inherit no-underline">
          <div className="w-8 h-8 rounded-xl bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] flex items-center justify-center font-bold shadow-xs">
            <CakeSlice size={16} />
          </div>
          <div>
            <span className="font-serif font-bold text-sm leading-none block tracking-tight">SweetCraft</span>
            <span className="text-[8px] uppercase tracking-widest text-[hsl(var(--sidebar-foreground)/0.65)] block mt-0.5">Mobile App</span>
          </div>
        </Link>

        <div className="flex items-center gap-1.5">
          {/* Quick Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            data-testid="button-mobile-theme-toggle"
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))] hover:text-white transition-colors"
          >
            {isDark ? <Moon size={15} className="text-[hsl(var(--sidebar-primary))]" /> : <Sun size={15} className="text-amber-400" />}
          </button>

          {/* Mobile Install button if available */}
          {isInstallable && !isInstalled && (
            <button
              type="button"
              onClick={() => void install()}
              data-testid="button-mobile-install"
              className="h-8 px-2.5 rounded-xl flex items-center gap-1 bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] text-xs font-semibold shadow-xs"
              title="Install App"
            >
              <Download size={13} />
              <span className="text-[11px]">Install</span>
            </button>
          )}

          {/* Menu / Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowMobileMenu(true)}
            data-testid="button-mobile-menu"
            className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-xl bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))] hover:text-white"
            aria-label="Open menu"
          >
            <span className="w-6 h-6 rounded-full bg-[hsl(var(--sidebar-primary))/0.3] text-[hsl(var(--sidebar-primary))] font-bold text-[10px] flex items-center justify-center">
              {initials}
            </span>
            <Menu size={16} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="main-column">
        {/* Desktop Topbar */}
        <header className="topbar">
          <span className="topbar-kicker">
            Shop operations / {NAV.find(n => n.href === location.pathname)?.title ?? 'Workspace'}
          </span>
          <div className="topbar-right">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] transition-colors"
              title="Toggle Dark / Light Theme"
            >
              {isDark ? <Moon size={14} className="text-[hsl(var(--accent))]" /> : <Sun size={14} className="text-amber-500" />}
              <span>{isDark ? 'Dark' : 'Cream'}</span>
            </button>
            <div className="user-chip" data-testid="text-current-user">
              <span className="user-avatar">{initials}</span>
              <span className="font-medium">{profile?.full_name}</span>
              <span className="role-badge">{profile?.role}</span>
            </div>
            <button
              className="btn-quiet"
              type="button"
              onClick={() => void signOut()}
              aria-label="Sign out"
              data-testid="button-sign-out"
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>

      {/* Native Mobile Bottom Tab Dock (Screens <= 768px) */}
      <nav className="mobile-tab-bar" aria-label="Mobile application navigation">
        <Link
          to="/"
          className={`mobile-tab-item ${location.pathname === '/' ? 'active' : ''}`}
          data-testid="tab-mobile-today"
        >
          <div className="tab-icon-wrap">
            <LayoutDashboard size={18} />
          </div>
          <span>Today</span>
        </Link>

        <Link
          to="/sales"
          className={`mobile-tab-item ${location.pathname === '/sales' ? 'active' : ''}`}
          data-testid="tab-mobile-sales"
        >
          <div className="tab-icon-wrap">
            <ShoppingBag size={18} />
          </div>
          <span>Sale</span>
        </Link>

        <Link
          to="/expenses"
          className={`mobile-tab-item ${location.pathname === '/expenses' ? 'active' : ''}`}
          data-testid="tab-mobile-expenses"
        >
          <div className="tab-icon-wrap">
            <ReceiptText size={18} />
          </div>
          <span>Expense</span>
        </Link>

        <Link
          to="/transactions"
          className={`mobile-tab-item ${location.pathname === '/transactions' ? 'active' : ''}`}
          data-testid="tab-mobile-transactions"
        >
          <div className="tab-icon-wrap">
            <ClipboardList size={18} />
          </div>
          <span>Txns</span>
        </Link>

        <button
          type="button"
          onClick={() => setShowMobileMenu(true)}
          className={`mobile-tab-item ${['/reports', '/staff'].includes(location.pathname) ? 'active' : ''}`}
          data-testid="tab-mobile-more"
        >
          <div className="tab-icon-wrap">
            <Menu size={18} />
          </div>
          <span>More</span>
        </button>
      </nav>

      {/* Mobile Action Drawer / Sheet */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setShowMobileMenu(false)}
        >
          <div
            className="bg-[hsl(var(--card))] border-t border-[hsl(var(--card-border))] text-[hsl(var(--card-foreground))] rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] shadow-2xl animate-in slide-in-from-bottom duration-250"
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 rounded-full bg-stone-400/40 mx-auto mb-4" />

            {/* User Profile Card in Drawer */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[hsl(var(--border))]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold text-sm flex items-center justify-center">
                  {initials}
                </div>
                <div>
                  <div className="font-bold text-sm leading-tight text-[hsl(var(--foreground))]">{profile?.full_name}</div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{profile?.email || 'Logged In'}</div>
                  <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]">
                    {profile?.role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileMenu(false)}
                className="p-1.5 rounded-full text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Links */}
            <div className="space-y-1 mb-4">
              <div className="text-[10px] uppercase tracking-wider font-bold text-[hsl(var(--muted-foreground))] px-3 py-1">
                Pages &amp; Operations
              </div>
              {allowedLinks.map(({ href, title, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-colors ${
                    location.pathname === href
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                      : 'hover:bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    <span>{title}</span>
                  </div>
                  {location.pathname === href && <Check size={16} />}
                </Link>
              ))}
            </div>

            {/* Quick Settings & Controls */}
            <div className="space-y-2 pt-3 border-t border-[hsl(var(--border))]">
              {/* Dark Mode Switch in Mobile Menu */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]"
              >
                <div className="flex items-center gap-3">
                  {isDark ? <Moon size={18} className="text-pink-400" /> : <Sun size={18} className="text-amber-500" />}
                  <span>{isDark ? 'Dark Burgundy Theme' : 'Warm Cream Theme'}</span>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider opacity-75">
                  {isDark ? 'Dark' : 'Light'}
                </span>
              </button>

              {/* Install PWA Prompt */}
              {isInstallable && !isInstalled && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMenu(false);
                    void install();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl text-sm font-semibold bg-[#6B1D2F] text-white shadow-xs"
                >
                  <Download size={17} />
                  <span>Install SweetCraft on Phone</span>
                </button>
              )}

              {isIOS && !isInstalled && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowIOSGuide(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl text-sm font-medium border border-[hsl(var(--border))] text-[hsl(var(--foreground))]"
                >
                  <Smartphone size={17} />
                  <span>How to Install on iPhone</span>
                </button>
              )}

              {/* Database / Supabase Setup */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowConnect(true);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                <div className="flex items-center gap-2.5">
                  <Database size={15} />
                  <span>Shop Connection / Database</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-600">
                  {isLocalMode ? 'Local Store' : 'Live Supabase'}
                </span>
              </button>

              {/* Sign Out */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  void signOut();
                }}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors mt-2"
              >
                <LogOut size={15} />
                <span>Sign Out of Shop</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Installation Instructions Guide */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--card-border))] p-6 shadow-2xl text-[hsl(var(--card-foreground))]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#6B1D2F] text-white flex items-center justify-center">
                  <Smartphone size={18} />
                </div>
                <h3 className="text-base font-serif font-bold">Install on iPhone</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] p-1"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4 leading-relaxed">
              Install SweetCraft to your iPhone or iPad home screen for a full-screen, app-like experience with instant access:
            </p>
            <ol className="text-xs space-y-2.5 bg-[hsl(var(--secondary))] p-3.5 rounded-xl border border-[hsl(var(--border))] text-[hsl(var(--secondary-foreground))] list-decimal list-inside">
              <li>Tap the <strong>Share button</strong> (square with arrow up) at bottom of Safari.</li>
              <li>Scroll down the menu and tap <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong> at top right to place SweetCraft on your home screen.</li>
            </ol>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-[#6B1D2F] py-2.5 text-xs font-semibold text-white hover:bg-[#521624] transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {showConnect && <ConnectionModal onClose={() => setShowConnect(false)} />}
    </div>
  );
}

function Protected({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();
  const roles = PAGE_ACCESS[location.pathname];

  if (loading) {
    return (
      <main className="setup-screen" data-testid="state-auth-loading">
        <div className="setup-card">
          <div className="skeleton" />
        </div>
      </main>
    );
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <Shell>{children}</Shell>;
}

function PageHeader({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="page-title">{title}</h1>
        <p className="page-intro">{description}</p>
      </div>
      {children}
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="stats-grid" aria-label="Loading shop totals">
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}

function DataMessage({ error, retry }: { error: string; retry: () => void }) {
  return (
    <div className="message error flex items-center justify-between" role="alert" data-testid="status-data-error">
      <span>{error}</span>
      <button className="btn-quiet font-bold ml-2 underline" onClick={retry} data-testid="button-retry-load">
        Retry
      </button>
    </div>
  );
}

interface Totals {
  sales: number;
  expenses: number;
  cash: number;
  netProfit?: number;
}

function Dashboard() {
  const { profile, isLocalMode } = useAuth();
  const [totals, setTotals] = useState<Totals | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    if (supabase && supabaseConfigured && !isLocalMode) {
      try {
        const [salesResult, expenseResult] = await Promise.all([
          supabase.from('sales').select('total,payment_method').gte('created_at', start.toISOString()),
          supabase.from('expenses').select('amount,payment_method').gte('created_at', start.toISOString()),
        ]);
        if (salesResult.error || expenseResult.error) {
          setError((salesResult.error ?? expenseResult.error)!.message);
          setLoading(false);
          return;
        }
        const sales = salesResult.data ?? [];
        const expenses = expenseResult.data ?? [];
        const totalSales = sales.reduce((sum, r) => sum + Number(r.total), 0);
        const totalExpenses = expenses.reduce((sum, r) => sum + Number(r.amount), 0);
        const cashSales = sales.filter(r => r.payment_method === 'cash').reduce((sum, r) => sum + Number(r.total), 0);
        const cashExpenses = expenses.filter(r => r.payment_method === 'cash').reduce((sum, r) => sum + Number(r.amount), 0);

        setTotals({
          sales: totalSales,
          expenses: totalExpenses,
          cash: cashSales - cashExpenses,
          netProfit: totalSales - totalExpenses,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load live data.');
      } finally {
        setLoading(false);
      }
    } else {
      const startMs = start.getTime();
      const allSales = localStore.getSales();
      const allExpenses = localStore.getExpenses();

      const todaySales = allSales.filter(s => new Date(s.created_at).getTime() >= startMs);
      const todayExpenses = allExpenses.filter(e => new Date(e.created_at).getTime() >= startMs);

      const totalSales = todaySales.reduce((sum, r) => sum + Number(r.total), 0);
      const totalExpenses = todayExpenses.reduce((sum, r) => sum + Number(r.amount), 0);
      const cashSales = todaySales.filter(r => r.payment_method === 'cash').reduce((sum, r) => sum + Number(r.total), 0);
      const cashExpenses = todayExpenses.filter(r => r.payment_method === 'cash').reduce((sum, r) => sum + Number(r.amount), 0);

      setTotals({
        sales: totalSales,
        expenses: totalExpenses,
        cash: cashSales - cashExpenses,
        netProfit: totalSales - totalExpenses,
      });
      setLoading(false);
    }
  }, [isLocalMode]);

  useEffect(() => {
    void load();
  }, [load]);

  const isOwner = profile?.role === 'owner';
  const isManager = profile?.role === 'manager';

  const todayDateString = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  // Define summary cards based on authenticated role permissions
  const summaryCards = [
    {
      id: 'sales',
      label: 'Sales',
      sublabel: "today's total",
      value: totals?.sales ?? 0,
      icon: ShoppingBag,
      emoji: '🛒',
    },
    {
      id: 'expenses',
      label: 'Expenses',
      sublabel: "today's total",
      value: totals?.expenses ?? 0,
      icon: ReceiptText,
      emoji: '💸',
    },
    ...(isOwner || isManager
      ? [
          {
            id: 'cash',
            label: 'Cash Balance',
            sublabel: 'cash sales minus cash expenses',
            value: totals?.cash ?? 0,
            icon: Wallet,
            emoji: '💵',
          },
        ]
      : []),
    ...(isOwner
      ? [
          {
            id: 'net-profit',
            label: 'Net Profit',
            sublabel: "today's sales minus today's expenses",
            value: totals?.netProfit ?? 0,
            icon: TrendingUp,
            emoji: '📈',
          },
        ]
      : []),
  ];

  const headerTitle = isOwner ? 'Owner Dashboard' : isManager ? 'Manager Dashboard' : 'Employee Dashboard';
  const headerEmoji = isOwner ? '👑' : isManager ? '👔' : '💼';

  return (
    <section data-testid="page-dashboard" className="max-w-6xl mx-auto space-y-6">
      {/* Header with Today's Date and Role Dashboard title - no long descriptions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#48272c]/10">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#7d6065]">
            <Calendar size={14} className="text-[#8e3c48]" />
            <span>📅 {todayDateString}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#48272c] flex items-center gap-2 mt-1 tracking-tight">
            <span>{headerEmoji}</span> {headerTitle}
          </h1>
        </div>

        <button
          onClick={() => void load()}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#48272c]/15 bg-[#fffdf9] text-xs font-medium text-[#48272c] hover:bg-[#f2ece1] transition-colors shadow-2xs active:scale-95 cursor-pointer"
          title="Refresh live totals"
          data-testid="button-refresh-dashboard"
        >
          <RotateCcw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && <DataMessage error={error} retry={() => void load()} />}

      {/* Summary Cards */}
      {loading ? (
        <div className={`grid grid-cols-2 ${isOwner ? 'lg:grid-cols-4' : isManager ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-3 md:gap-4`}>
          {summaryCards.map((_, i) => (
            <div key={i} className="panel p-4 sm:p-5 rounded-2xl bg-[#fffdf9] border border-[#48272c]/10 min-h-[124px] animate-pulse flex flex-col justify-between">
              <div className="h-4 bg-[#48272c]/10 rounded w-20" />
              <div className="h-7 bg-[#48272c]/10 rounded w-28 my-2" />
              <div className="h-3 bg-[#48272c]/10 rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`grid grid-cols-2 ${isOwner ? 'lg:grid-cols-4' : isManager ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-3 md:gap-4`}
          data-testid="dashboard-summary-cards"
        >
          {summaryCards.map(card => {
            const Icon = card.icon;
            return (
              <article
                key={card.id}
                data-testid={`card-today-${card.id}`}
                className="panel p-4 sm:p-5 rounded-2xl bg-[#fffdf9] border border-[#48272c]/10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between min-h-[128px]"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7d6065] flex items-center gap-1.5 truncate">
                    <span>{card.emoji}</span>
                    <span>{card.label}</span>
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-[#48272c]/5 flex items-center justify-center text-[#48272c] shrink-0">
                    <Icon size={15} />
                  </div>
                </div>

                <div className="my-2">
                  <strong className="block text-xl sm:text-2xl lg:text-3xl font-bold font-mono tracking-tight text-[#48272c] truncate">
                    {money(card.value)}
                  </strong>
                </div>

                <div className="text-[11px] text-[#8c7478] truncate" title={card.sublabel}>
                  {card.sublabel}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="panel p-5 rounded-2xl bg-[#fffdf9] border border-[#48272c]/10 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#7d6065] mb-3">Quick actions</h2>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/sales"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#48272c] text-white hover:bg-[#381e22] text-sm font-semibold transition-all shadow-sm active:scale-95"
            data-testid="link-quick-sale"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span>➕ Sale</span>
          </Link>
          <Link
            to="/expenses"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#48272c]/20 bg-[#fbf8f2] hover:bg-[#f2ece1] text-[#48272c] text-sm font-semibold transition-all active:scale-95"
            data-testid="link-quick-expense"
          >
            <ReceiptText size={16} />
            <span>💸 Expense</span>
          </Link>
          <Link
            to="/transactions"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#48272c]/20 bg-[#fbf8f2] hover:bg-[#f2ece1] text-[#48272c] text-sm font-semibold transition-all active:scale-95"
            data-testid="link-quick-transactions"
          >
            <ClipboardList size={16} />
            <span>📋 Transactions</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function SaleForm() {
  const { isLocalMode, profile } = useAuth();
  const [category, setCategory] = useState<'yoghurt' | 'cake'>('yoghurt');
  const [item, setItem] = useState('Vanilla Greek Yoghurt 500ml');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState<number>(280);
  const [payment, setPayment] = useState<'cash' | 'mobile' | 'card'>('cash');
  const [isCustom, setIsCustom] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const presets = {
    yoghurt: [
      { name: 'Vanilla Greek Yoghurt 500ml', price: 280 },
      { name: 'Mango Passion Yoghurt 250ml', price: 160 },
      { name: 'Strawberry Probiotic Cup 200ml', price: 140 },
      { name: 'Plain Natural Tub 1 Litre', price: 450 },
    ],
    cake: [
      { name: 'Lemon Drizzle Slice', price: 220 },
      { name: 'Chocolate Fudge Slice', price: 250 },
      { name: 'Red Velvet Cupcake', price: 150 },
      { name: 'Black Forest 1kg Cake', price: 2400 },
    ],
  };

  const handleCategoryChange = (newCat: 'yoghurt' | 'cake') => {
    setCategory(newCat);
    setIsCustom(false);
    setMessage(null);
    const firstPreset = presets[newCat][0];
    setItem(firstPreset.name);
    setUnitPrice(firstPreset.price);
  };

  const handleSelectPreset = (preset: { name: string; price: number }) => {
    setItem(preset.name);
    setUnitPrice(preset.price);
    setIsCustom(false);
    setMessage(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !item.trim() || quantity < 1 || unitPrice < 0) return;
    setBusy(true);
    setMessage(null);

    const saleItem = item.trim();
    const totalAmount = quantity * unitPrice;

    try {
      if (supabase && supabaseConfigured && !isLocalMode) {
        const payload: Record<string, any> = {
          category,
          item: saleItem,
          quantity,
          unit_price: unitPrice,
          payment_method: payment,
        };
        if (profile?.id) {
          payload.created_by = profile.id;
        }

        const { error } = await supabase.from('sales').insert(payload);
        if (error) {
          setBusy(false);
          setMessage({ ok: false, text: error.message });
          return;
        }
      } else {
        localStore.addSale({
          category,
          item: saleItem,
          quantity,
          unit_price: unitPrice,
          payment_method: payment,
          created_by: profile?.id,
        });
      }

      setBusy(false);
      setMessage({
        ok: true,
        text: `Recorded ${quantity} × ${saleItem} (${money(totalAmount)})`,
      });
      setQuantity(1);
    } catch (err) {
      setBusy(false);
      setMessage({
        ok: false,
        text: err instanceof Error ? err.message : 'Failed to record sale.',
      });
    }
  };

  return (
    <section data-testid="page-sales" className="max-w-xl mx-auto px-1 py-2 sm:py-4">
      {/* Sleek Minimal Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b4f58] block">
            Counter Point of Sale
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#48272c] tracking-tight">
            Record Sale
          </h1>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#48272c]/10 text-[#48272c] text-xs font-semibold">
          <ShoppingBag size={13} />
          <span>Shop Floor</span>
        </div>
      </div>

      <form onSubmit={submit} data-testid="form-sale" className="space-y-4">
        <div className="bg-[#fdfbf7] border border-[#e8ded4] rounded-2xl p-4 sm:p-5 shadow-xs">
          {/* 1. Category Switcher */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <button
              type="button"
              onClick={() => handleCategoryChange('yoghurt')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all border ${
                category === 'yoghurt'
                  ? 'bg-[#48272c] text-[#fdfbf7] border-[#48272c] shadow-sm'
                  : 'bg-white/80 text-[#685456] border-[#e8ded4] hover:bg-white hover:text-[#48272c]'
              }`}
            >
              <span className="text-lg">🥛</span>
              <span>Yoghurt</span>
            </button>
            <button
              type="button"
              onClick={() => handleCategoryChange('cake')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all border ${
                category === 'cake'
                  ? 'bg-[#48272c] text-[#fdfbf7] border-[#48272c] shadow-sm'
                  : 'bg-white/80 text-[#685456] border-[#e8ded4] hover:bg-white hover:text-[#48272c]'
              }`}
            >
              <span className="text-lg">🎂</span>
              <span>Cake</span>
            </button>
          </div>

          {/* 2. Product Cards Grid */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#685456]">
                Select Product
              </span>
              {!isCustom ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustom(true);
                    setItem('');
                    setUnitPrice(100);
                  }}
                  className="text-[11px] font-bold text-[#8b4f58] hover:text-[#48272c] hover:underline"
                >
                  + Custom Item
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    handleSelectPreset(presets[category][0]);
                  }}
                  className="text-[11px] font-bold text-[#8b4f58] hover:text-[#48272c] hover:underline"
                >
                  ← Back to Menu
                </button>
              )}
            </div>

            {!isCustom ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {presets[category].map((p) => {
                  const isSelected = item === p.name;
                  return (
                    <button
                      type="button"
                      key={p.name}
                      onClick={() => handleSelectPreset(p)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-[#48272c]/8 border-[#48272c] ring-1 ring-[#48272c] shadow-xs'
                          : 'bg-white/90 border-[#e8ded4] hover:border-[#48272c]/40 hover:bg-white'
                      }`}
                    >
                      <div className="pr-2 min-w-0">
                        <div
                          className={`text-xs sm:text-sm font-semibold leading-tight truncate ${
                            isSelected ? 'text-[#48272c]' : 'text-[#2b181b]'
                          }`}
                        >
                          {p.name}
                        </div>
                        <div className="text-xs font-bold text-[#8b4f58] mt-0.5">
                          {money(p.price)}
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-[#48272c] border-[#48272c] text-[#fdfbf7]'
                            : 'border-[#d8cbbf] bg-transparent'
                        }`}
                      >
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-white border border-[#e8ded4] space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#685456] block mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    required
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    placeholder={
                      category === 'yoghurt'
                        ? 'e.g. Vanilla Chia Seed Cup 300ml'
                        : 'e.g. Carrot Cream Cheese Cake Slice'
                    }
                    className="w-full text-sm px-3 py-2 rounded-lg border border-[#d8cbbf] bg-[#fdfbf7] focus:outline-none focus:border-[#48272c]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#685456] block mb-1">
                    Unit Price in ETB
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Math.max(0, Number(e.target.value)))}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-[#d8cbbf] bg-[#fdfbf7] focus:outline-none focus:border-[#48272c]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Quantity Stepper */}
          <div className="mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#685456] block mb-2">
              Quantity
            </span>
            <div className="flex items-center justify-between bg-white/90 border border-[#e8ded4] rounded-xl p-2 sm:p-2.5">
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-11 h-11 rounded-lg flex items-center justify-center bg-[#f7f3ec] text-[#48272c] hover:bg-[#efe8dd] active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all border border-[#e4dcce]"
                aria-label="Decrease quantity"
              >
                <Minus size={18} strokeWidth={2.5} />
              </button>

              <div className="flex flex-col items-center">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#48272c]">
                  {quantity}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8b4f58]">
                  {quantity === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-11 h-11 rounded-lg flex items-center justify-center bg-[#48272c] text-white hover:bg-[#381e22] active:scale-95 transition-all shadow-xs"
                aria-label="Increase quantity"
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* 4. Payment Method */}
          <div className="mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#685456] block mb-2">
              Payment Method
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: 'Cash', emoji: '💵' },
                { id: 'mobile', label: 'Mobile Money', emoji: '📱' },
                { id: 'card', label: 'Card', emoji: '💳' },
              ].map((p) => {
                const isSelected = payment === p.id;
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setPayment(p.id as 'cash' | 'mobile' | 'card')}
                    className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-[#48272c] text-[#fdfbf7] border-[#48272c] shadow-xs font-semibold'
                        : 'bg-white/90 text-[#48272c]/80 border-[#e8ded4] hover:bg-white hover:text-[#48272c]'
                    }`}
                  >
                    <span className="text-lg leading-tight mb-1">{p.emoji}</span>
                    <span className="text-xs leading-none font-medium">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Automatic Large Total in ETB */}
          <div
            className="bg-[#48272c]/5 border border-[#48272c]/20 rounded-xl p-3.5 mb-4 text-center"
            data-testid="summary-sale-total"
          >
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#8b4f58] block mb-0.5">
              Sale Total
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#48272c] tracking-tight">
              {money(quantity * unitPrice)}
            </div>
            <div className="text-[11px] text-[#685456] font-medium mt-1">
              {quantity} × {money(unitPrice)} · {payment === 'mobile' ? 'Mobile Money' : payment.toUpperCase()}
            </div>
          </div>

          {/* 6. Large Save Sale Button */}
          <button
            type="submit"
            data-testid="button-save-sale"
            disabled={busy || !item.trim() || quantity < 1 || unitPrice < 0}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-[#48272c] hover:bg-[#381e22] text-[#fdfbf7] font-bold text-base shadow-sm transition-all active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            {busy ? (
              <>
                <span className="animate-spin text-lg">⏳</span>
                <span>Saving Sale...</span>
              </>
            ) : (
              <>
                <Check size={20} strokeWidth={2.5} />
                <span>Save Sale</span>
              </>
            )}
          </button>

          {/* Success or Error Feedback */}
          {message && (
            <div
              className={`mt-3 p-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 ${
                message.ok
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
              role="status"
              data-testid={message.ok ? 'status-sale-success' : 'status-sale-error'}
            >
              {message.ok ? (
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              ) : (
                <CircleAlert size={16} className="shrink-0 text-rose-600" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </div>
      </form>
    </section>
  );
}

const EXPENSE_CATEGORIES = [
  { id: 'ingredients', label: 'Ingredients', icon: Wheat },
  { id: 'packaging', label: 'Packaging', icon: Package },
  { id: 'rent', label: 'Rent', icon: Building2 },
  { id: 'utilities', label: 'Utilities', icon: Zap },
  { id: 'wages', label: 'Wages', icon: Users },
  { id: 'other', label: 'Other', icon: ReceiptText },
] as const;

function ExpenseForm() {
  const { isLocalMode, profile } = useAuth();
  const [category, setCategory] = useState<string>('ingredients');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [payment, setPayment] = useState<'cash' | 'mobile' | 'card'>('cash');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !description.trim() || !isValidAmount) return;
    setBusy(true);
    setMessage(null);

    const expenseDesc = description.trim();
    const finalAmount = parsedAmount;

    try {
      if (supabase && supabaseConfigured && !isLocalMode) {
        const payload: Record<string, any> = {
          category,
          description: expenseDesc,
          amount: finalAmount,
          payment_method: payment,
        };
        if (profile?.id) {
          payload.created_by = profile.id;
        }

        const { error } = await supabase.from('expenses').insert(payload);
        if (error) {
          setBusy(false);
          setMessage({ ok: false, text: error.message });
          return;
        }
      } else {
        localStore.addExpense({
          category: category as any,
          description: expenseDesc,
          amount: finalAmount,
          payment_method: payment,
          created_by: profile?.id,
        });
      }

      setBusy(false);
      setMessage({
        ok: true,
        text: `Recorded expense of ${money(finalAmount)} (${expenseDesc})`,
      });
      setDescription('');
      setAmount('');
    } catch (err) {
      setBusy(false);
      setMessage({
        ok: false,
        text: err instanceof Error ? err.message : 'Failed to record expense.',
      });
    }
  };

  return (
    <section data-testid="page-expenses" className="max-w-lg mx-auto px-1 py-2 sm:py-4">
      {/* Minimal Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#48272c] tracking-tight">
            Record Expense
          </h1>
          <p className="text-xs text-[#8b4f58] mt-0.5">Simple shop expense ledger</p>
        </div>
        <Link
          to="/transactions"
          className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#e4dcce] bg-white text-[#48272c] hover:bg-[#f7f3ec] transition-all flex items-center gap-1.5"
        >
          <ClipboardList size={13} />
          <span>Transactions</span>
        </Link>
      </div>

      <form onSubmit={submit} data-testid="form-expense">
        <div className="bg-[#fdfbf7] border border-[#e8ded4] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          {/* 1. Category Icons */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#685456] block mb-2">
              🧾 Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EXPENSE_CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                const IconComponent = cat.icon;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => {
                      setCategory(cat.id);
                      setMessage(null);
                    }}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-[#48272c] text-[#fdfbf7] border-[#48272c] shadow-xs font-bold'
                        : 'bg-white text-[#48272c] border-[#e8ded4] hover:bg-[#f7f3ec] hover:border-[#48272c]/40 font-medium'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 ${
                        isSelected
                          ? 'bg-white/20 text-[#fdfbf7]'
                          : 'bg-[#f7f3ec] text-[#48272c]'
                      }`}
                    >
                      <IconComponent size={18} />
                    </div>
                    <span className="text-xs leading-tight truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Description */}
          <div>
            <label
              htmlFor="expense-description"
              className="text-xs font-bold uppercase tracking-wider text-[#685456] block mb-1.5"
            >
              ✍️ Description
            </label>
            <input
              id="expense-description"
              data-testid="input-expense-description"
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Milk delivery, cake boxes, power..."
              className="w-full text-base px-3.5 py-2.5 rounded-xl border border-[#d8cbbf] bg-white text-[#2b181b] placeholder:text-[#ad9c98] focus:outline-none focus:border-[#48272c] transition-colors"
            />
          </div>

          {/* 3. Amount (ETB) */}
          <div>
            <label
              htmlFor="expense-amount"
              className="text-xs font-bold uppercase tracking-wider text-[#685456] block mb-1.5"
            >
              💰 Amount (ETB)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8b4f58] select-none pointer-events-none">
                ETB
              </span>
              <input
                id="expense-amount"
                data-testid="input-expense-amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full text-2xl font-extrabold pl-14 pr-4 py-2.5 rounded-xl border border-[#d8cbbf] bg-white text-[#48272c] placeholder:text-[#d8cbbf] focus:outline-none focus:border-[#48272c] transition-colors"
              />
            </div>
          </div>

          {/* 4. Payment Method */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#685456] block mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: 'Cash', emoji: '💵' },
                { id: 'mobile', label: 'Mobile', emoji: '📱' },
                { id: 'card', label: 'Card', emoji: '💳' },
              ].map((p) => {
                const isSelected = payment === p.id;
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setPayment(p.id as 'cash' | 'mobile' | 'card')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border transition-all text-xs font-bold ${
                      isSelected
                        ? 'bg-[#48272c] text-[#fdfbf7] border-[#48272c] shadow-xs'
                        : 'bg-white text-[#48272c] border-[#e8ded4] hover:bg-[#f7f3ec]'
                    }`}
                  >
                    <span>{p.emoji}</span>
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Large Burgundy Save Button */}
          <button
            type="submit"
            data-testid="button-save-expense"
            disabled={busy || !description.trim() || !isValidAmount}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-[#48272c] hover:bg-[#381e22] text-[#fdfbf7] font-bold text-base shadow-sm transition-all active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none cursor-pointer mt-2"
          >
            {busy ? (
              <>
                <span className="animate-spin text-lg">⏳</span>
                <span>Saving Expense...</span>
              </>
            ) : (
              <>
                <Check size={20} strokeWidth={2.5} />
                <span>Save Expense</span>
              </>
            )}
          </button>

          {/* Feedback Message */}
          {message && (
            <div
              className={`p-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 ${
                message.ok
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
              role="status"
              data-testid={message.ok ? 'status-expense-success' : 'status-expense-error'}
            >
              {message.ok ? (
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              ) : (
                <CircleAlert size={16} className="shrink-0 text-rose-600" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </div>
      </form>
    </section>
  );
}

interface Tx {
  id: string;
  kind: 'sale' | 'expense';
  label: string;
  item?: string;
  category: string;
  amount: number;
  payment: 'cash' | 'mobile' | 'card';
  at: string;
  created_by?: string;
  creator_name?: string;
  creator_role?: Role;
  creator_email?: string;
  quantity?: number;
  unit_price?: number;
}

function Transactions() {
  const { profile, isLocalMode } = useAuth();
  const [rows, setRows] = useState<Tx[]>([]);
  const [filter, setFilter] = useState<'all' | 'sale' | 'expense'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedTx, setSelectedTx] = useState<Tx | null>(null);
  const [editTarget, setEditTarget] = useState<Tx | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tx | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<{
    label: string;
    category: string;
    amount: number;
    quantity: number;
    unit_price: number;
    payment: 'cash' | 'mobile' | 'card';
  }>({
    label: '',
    category: '',
    amount: 0,
    quantity: 1,
    unit_price: 0,
    payment: 'cash',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    if (supabase && supabaseConfigured && !isLocalMode) {
      try {
        const [s, e, p] = await Promise.all([
          supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(300),
          supabase.from('expenses').select('*').order('created_at', { ascending: false }).limit(300),
          supabase.from('profiles').select('id, full_name, email, role'),
        ]);

        if (s.error || e.error) {
          setError((s.error ?? e.error)!.message);
          setLoading(false);
          return;
        }

        const profileMap = new Map((p.data ?? []).map((pr) => [pr.id, pr]));

        const sales: Tx[] = (s.data ?? []).map((r) => {
          const creator = r.created_by ? profileMap.get(r.created_by) : null;
          return {
            id: r.id,
            kind: 'sale',
            label: `${r.quantity} × ${r.item}`,
            item: r.item,
            category: r.category,
            amount: Number(r.total),
            payment: r.payment_method,
            at: r.created_at,
            created_by: r.created_by,
            creator_name: creator ? creator.full_name : (r.created_by === profile?.id ? profile?.full_name : 'Staff'),
            creator_role: creator ? (creator.role as Role) : undefined,
            creator_email: creator ? creator.email : undefined,
            quantity: Number(r.quantity),
            unit_price: Number(r.unit_price),
          };
        });

        const expenses: Tx[] = (e.data ?? []).map((r) => {
          const creator = r.created_by ? profileMap.get(r.created_by) : null;
          return {
            id: r.id,
            kind: 'expense',
            label: r.description,
            category: r.category,
            amount: Number(r.amount),
            payment: r.payment_method,
            at: r.created_at,
            created_by: r.created_by,
            creator_name: creator ? creator.full_name : (r.created_by === profile?.id ? profile?.full_name : 'Staff'),
            creator_role: creator ? (creator.role as Role) : undefined,
            creator_email: creator ? creator.email : undefined,
          };
        });

        setRows([...sales, ...expenses].sort((a, b) => b.at.localeCompare(a.at)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching transactions.');
      } finally {
        setLoading(false);
      }
    } else {
      const s = localStore.getSales();
      const e = localStore.getExpenses();
      const profiles = localStore.getProfiles();
      const profileMap = new Map(profiles.map((pr) => [pr.id, pr]));

      const sales: Tx[] = s.map((r) => {
        const creator = r.created_by ? profileMap.get(r.created_by) : null;
        return {
          id: r.id,
          kind: 'sale',
          label: `${r.quantity} × ${r.item}`,
          item: r.item,
          category: r.category,
          amount: Number(r.total),
          payment: r.payment_method,
          at: r.created_at,
          created_by: r.created_by,
          creator_name: creator ? creator.full_name : (r.created_by === profile?.id ? profile?.full_name : 'Staff'),
          creator_role: creator ? (creator.role as Role) : undefined,
          creator_email: creator ? creator.email : undefined,
          quantity: Number(r.quantity),
          unit_price: Number(r.unit_price),
        };
      });

      const expenses: Tx[] = e.map((r) => {
        const creator = r.created_by ? profileMap.get(r.created_by) : null;
        return {
          id: r.id,
          kind: 'expense',
          label: r.description,
          category: r.category,
          amount: Number(r.amount),
          payment: r.payment_method,
          at: r.created_at,
          created_by: r.created_by,
          creator_name: creator ? creator.full_name : (r.created_by === profile?.id ? profile?.full_name : 'Staff'),
          creator_role: creator ? (creator.role as Role) : undefined,
          creator_email: creator ? creator.email : undefined,
        };
      });

      setRows([...sales, ...expenses].sort((a, b) => b.at.localeCompare(a.at)));
      setLoading(false);
    }
  }, [isLocalMode, profile?.id, profile?.full_name]);

  useEffect(() => {
    void load();
  }, [load]);

  // Role permissions: owner & manager can edit/delete any; employee can edit/delete their own
  const canModify = (tx: Tx) => {
    if (!profile) return false;
    if (profile.role === 'owner' || profile.role === 'manager') return true;
    if (profile.role === 'employee' && tx.created_by && tx.created_by === profile.id) return true;
    return false;
  };

  // Filtered rows based on kind, date, and search
  const filteredRows = useMemo(() => {
    let result = rows;

    // 1. Kind filter
    if (filter !== 'all') {
      result = result.filter((r) => r.kind === filter);
    }

    // 2. Date filter
    if (dateFilter === 'today') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startMs = startOfToday.getTime();
      result = result.filter((r) => new Date(r.at).getTime() >= startMs);
    } else if (dateFilter === 'week') {
      const weekAgo = Date.now() - 7 * 86400000;
      result = result.filter((r) => new Date(r.at).getTime() >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = Date.now() - 30 * 86400000;
      result = result.filter((r) => new Date(r.at).getTime() >= monthAgo);
    }

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.label.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          (r.creator_name && r.creator_name.toLowerCase().includes(q)) ||
          r.payment.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
      );
    }

    return result;
  }, [rows, filter, dateFilter, searchQuery]);

  // Aggregate stats from filtered rows
  const stats = useMemo(() => {
    const totalSales = filteredRows
      .filter((r) => r.kind === 'sale')
      .reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = filteredRows
      .filter((r) => r.kind === 'expense')
      .reduce((sum, r) => sum + r.amount, 0);
    const netTotal = totalSales - totalExpenses;
    return { totalSales, totalExpenses, netTotal };
  }, [filteredRows]);

  // Open Edit modal
  const openEdit = (tx: Tx, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditTarget(tx);
    setEditForm({
      label: tx.item || tx.label.replace(/^\d+\s*×\s*/, ''),
      category: tx.category,
      amount: tx.amount,
      quantity: tx.quantity || 1,
      unit_price: tx.unit_price || tx.amount,
      payment: tx.payment,
    });
  };

  // Open Delete modal
  const openDelete = (tx: Tx, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeleteTarget(tx);
  };

  // Execute Edit Save
  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editTarget || !canModify(editTarget)) return;
    setActionBusy(true);

    try {
      if (supabase && supabaseConfigured && !isLocalMode) {
        if (editTarget.kind === 'sale') {
          const { error: err } = await supabase
            .from('sales')
            .update({
              item: editForm.label.trim(),
              category: editForm.category,
              quantity: editForm.quantity,
              unit_price: editForm.unit_price,
              payment_method: editForm.payment,
            })
            .eq('id', editTarget.id);
          if (err) throw err;
        } else {
          const { error: err } = await supabase
            .from('expenses')
            .update({
              description: editForm.label.trim(),
              category: editForm.category,
              amount: editForm.amount,
              payment_method: editForm.payment,
            })
            .eq('id', editTarget.id);
          if (err) throw err;
        }
      } else {
        if (editTarget.kind === 'sale') {
          localStore.updateSale(editTarget.id, {
            item: editForm.label.trim(),
            category: editForm.category as 'yoghurt' | 'cake',
            quantity: editForm.quantity,
            unit_price: editForm.unit_price,
            payment_method: editForm.payment,
          });
        } else {
          localStore.updateExpense(editTarget.id, {
            description: editForm.label.trim(),
            category: editForm.category as any,
            amount: editForm.amount,
            payment_method: editForm.payment,
          });
        }
      }

      setEditTarget(null);
      setSelectedTx(null);
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update transaction.');
    } finally {
      setActionBusy(false);
    }
  };

  // Execute Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget || !canModify(deleteTarget)) return;
    setActionBusy(true);

    try {
      if (supabase && supabaseConfigured && !isLocalMode) {
        const table = deleteTarget.kind === 'sale' ? 'sales' : 'expenses';
        const { error: err } = await supabase.from(table).delete().eq('id', deleteTarget.id);
        if (err) throw err;
      } else {
        if (deleteTarget.kind === 'sale') {
          localStore.deleteSale(deleteTarget.id);
        } else {
          localStore.deleteExpense(deleteTarget.id);
        }
      }

      setDeleteTarget(null);
      setSelectedTx(null);
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete transaction.');
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <section data-testid="page-transactions" className="max-w-4xl mx-auto px-1 py-2 sm:py-4">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b4f58] block">
            Shop Ledger
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#48272c] tracking-tight">
            Transactions
          </h1>
        </div>
        <button
          onClick={() => void load()}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#e4dcce] bg-white text-[#48272c] hover:bg-[#f7f3ec] transition-all flex items-center gap-1.5"
        >
          <RotateCcw size={13} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Bar Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-5">
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#fdfbf7] border border-[#e8ded4] shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#685456]">
              Sales
            </span>
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
              ↗
            </span>
          </div>
          <div className="text-base sm:text-xl font-bold text-emerald-700 truncate">
            {money(stats.totalSales)}
          </div>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#fdfbf7] border border-[#e8ded4] shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#685456]">
              Expenses
            </span>
            <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs">
              ↘
            </span>
          </div>
          <div className="text-base sm:text-xl font-bold text-[#8b4f58] truncate">
            {money(stats.totalExpenses)}
          </div>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#fdfbf7] border border-[#e8ded4] shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#685456]">
              Net Total
            </span>
            <span className="w-5 h-5 rounded-full bg-[#48272c]/10 text-[#48272c] flex items-center justify-center text-xs">
              =
            </span>
          </div>
          <div
            className={`text-base sm:text-xl font-extrabold truncate ${
              stats.netTotal >= 0 ? 'text-[#48272c]' : 'text-rose-600'
            }`}
          >
            {money(stats.netTotal)}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#fdfbf7] border border-[#e8ded4] rounded-2xl p-3 sm:p-4 mb-4 space-y-3 shadow-xs">
        {/* Top Controls: Search & Date Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="sm:col-span-2 relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b4f58]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search description, staff, payment..."
              className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl border border-[#d8cbbf] bg-white text-[#2b181b] focus:outline-none focus:border-[#48272c]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8b4f58] hover:text-[#48272c]"
              >
                ✕
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-[#d8cbbf] bg-white text-[#48272c] font-medium focus:outline-none focus:border-[#48272c]"
            >
              <option value="all">📅 All Time</option>
              <option value="today">📅 Today</option>
              <option value="week">📅 Last 7 Days</option>
              <option value="month">📅 This Month</option>
            </select>
          </div>
        </div>

        {/* Kind Switcher Tabs */}
        <div className="flex items-center justify-between border-t border-[#f0e8de] pt-2.5">
          <div className="flex gap-1.5">
            {[
              { id: 'all', label: 'All', icon: '🛒' },
              { id: 'sale', label: 'Sales', icon: '📈' },
              { id: 'expense', label: 'Expenses', icon: '💸' },
            ].map((f) => {
              const isSelected = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as any)}
                  data-testid={`button-filter-${f.id}`}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                    isSelected
                      ? 'bg-[#48272c] text-[#fdfbf7] font-bold shadow-xs'
                      : 'bg-white text-[#685456] hover:bg-[#f7f3ec] border border-[#e4dcce]'
                  }`}
                >
                  <span className="mr-1">{f.icon}</span>
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          <span
            className="text-[11px] font-semibold text-[#8b4f58]"
            data-testid="text-transaction-count"
          >
            {filteredRows.length} {filteredRows.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
      </div>

      {error && <DataMessage error={error} retry={() => void load()} />}

      {/* Transactions List */}
      <div
        className="bg-[#fdfbf7] border border-[#e8ded4] rounded-2xl overflow-hidden shadow-xs"
        data-testid="table-transactions"
      >
        {loading ? (
          <div className="p-8 text-center text-[#685456] text-sm">
            <span className="animate-spin text-2xl block mb-2">⏳</span>
            <span>Loading shop ledger...</span>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-8 text-center text-[#685456]" data-testid="state-transactions-empty">
            <ClipboardList size={28} className="mx-auto mb-2 text-[#8b4f58]/60" />
            <p className="font-bold text-[#48272c]">No transactions found</p>
            <p className="text-xs text-[#8b4f58] mt-1">
              {searchQuery || dateFilter !== 'all' || filter !== 'all'
                ? 'Try clearing the search or date filter.'
                : 'Transactions will appear here as your team records sales and expenses.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0e8de]">
            {filteredRows.map((r) => {
              const isSale = r.kind === 'sale';
              const canEdit = canModify(r);

              return (
                <div
                  key={`${r.kind}-${r.id}`}
                  data-testid={`row-transaction-${r.id}`}
                  onClick={() => setSelectedTx(r)}
                  className="p-3.5 sm:p-4 hover:bg-[#f7f3ec]/60 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                >
                  {/* Left: Type Icon + Details */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isSale
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isSale ? (
                        <ArrowUpRight size={18} strokeWidth={2.5} />
                      ) : (
                        <ArrowDownLeft size={18} strokeWidth={2.5} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-sm text-[#2b181b] leading-snug truncate">
                        {r.label}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#685456] mt-0.5">
                        <span className="capitalize font-semibold text-[#8b4f58]">
                          {r.category}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <User size={11} className="shrink-0 text-[#8b4f58]" />
                          <span>{r.creator_name || 'Staff'}</span>
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(r.at).toLocaleString('en-KE', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount, Payment & Action Buttons */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-sm sm:text-base font-extrabold tracking-tight ${
                          isSale ? 'text-emerald-700' : 'text-[#8b4f58]'
                        }`}
                      >
                        {isSale ? '+' : '−'}
                        {money(r.amount)}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#685456]">
                        {r.payment === 'mobile' ? 'Mobile' : r.payment}
                      </div>
                    </div>

                    {/* Action buttons (only for authorized roles) */}
                    {canEdit && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => openEdit(r, e)}
                          title="Edit Transaction"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#685456] hover:text-[#48272c] hover:bg-white border border-transparent hover:border-[#d8cbbf] transition-all"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => openDelete(r, e)}
                          title="Delete Transaction"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="bg-[#fdfbf7] border border-[#e8ded4] rounded-2xl w-full max-w-md p-5 shadow-xl text-[#2b181b]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#f0e8de] mb-4">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full ${
                    selectedTx.kind === 'sale'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedTx.kind === 'sale' ? 'Sale' : 'Expense'}
                </span>
                <span className="text-xs font-mono text-[#8b4f58]">
                  #{selectedTx.id.slice(0, 10)}
                </span>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#685456] hover:bg-[#f7f3ec]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Details Content */}
            <div className="space-y-3 mb-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b4f58] block">
                  Description / Item
                </span>
                <span className="text-base font-bold text-[#48272c]">
                  {selectedTx.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b4f58] block">
                    Category
                  </span>
                  <span className="text-sm font-semibold capitalize text-[#2b181b]">
                    {selectedTx.category}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b4f58] block">
                    Payment Method
                  </span>
                  <span className="text-sm font-semibold capitalize text-[#2b181b]">
                    {selectedTx.payment === 'mobile' ? 'Mobile Money' : selectedTx.payment}
                  </span>
                </div>
              </div>

              {selectedTx.kind === 'sale' && selectedTx.quantity && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b4f58] block">
                      Quantity
                    </span>
                    <span className="text-sm font-semibold text-[#2b181b]">
                      {selectedTx.quantity} {selectedTx.quantity === 1 ? 'unit' : 'units'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b4f58] block">
                      Unit Price
                    </span>
                    <span className="text-sm font-semibold text-[#2b181b]">
                      {money(selectedTx.unit_price || 0)}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-white border border-[#e8ded4]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b4f58] block mb-0.5">
                  Total Amount
                </span>
                <span
                  className={`text-2xl font-extrabold ${
                    selectedTx.kind === 'sale' ? 'text-emerald-700' : 'text-[#8b4f58]'
                  }`}
                >
                  {selectedTx.kind === 'sale' ? '+' : '−'}
                  {money(selectedTx.amount)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#f7f3ec] border border-[#e4dcce] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#685456] font-medium">Recorded By:</span>
                  <span className="font-bold text-[#48272c]">
                    {selectedTx.creator_name || 'Shop Staff'}
                    {selectedTx.creator_role ? ` (${selectedTx.creator_role})` : ''}
                  </span>
                </div>
                {selectedTx.creator_email && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#685456] font-medium">Email:</span>
                    <span className="font-mono text-[11px] text-[#48272c]">
                      {selectedTx.creator_email}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[#685456] font-medium">Recorded At:</span>
                  <span className="text-[#48272c]">
                    {new Date(selectedTx.at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f0e8de]">
              {canModify(selectedTx) && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedTx;
                      setSelectedTx(null);
                      openEdit(target);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#d8cbbf] bg-white text-xs font-bold text-[#48272c] hover:bg-[#f7f3ec]"
                  >
                    <Pencil size={12} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedTx;
                      setSelectedTx(null);
                      openDelete(target);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 hover:bg-rose-100"
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-1.5 rounded-xl bg-[#48272c] text-[#fdfbf7] text-xs font-bold hover:bg-[#381e22]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          onClick={() => setEditTarget(null)}
        >
          <div
            className="bg-[#fdfbf7] border border-[#e8ded4] rounded-2xl w-full max-w-md p-5 shadow-xl text-[#2b181b]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#f0e8de] mb-4">
              <h2 className="text-lg font-serif font-bold text-[#48272c]">
                Edit {editTarget.kind === 'sale' ? 'Sale' : 'Expense'}
              </h2>
              <button
                onClick={() => setEditTarget(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#685456] hover:bg-[#f7f3ec]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#685456] block mb-1">
                  {editTarget.kind === 'sale' ? 'Product Name' : 'Description'}
                </label>
                <input
                  type="text"
                  required
                  value={editForm.label}
                  onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-[#d8cbbf] bg-white focus:outline-none focus:border-[#48272c]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#685456] block mb-1">
                  Category
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-[#d8cbbf] bg-white focus:outline-none focus:border-[#48272c]"
                >
                  {editTarget.kind === 'sale' ? (
                    <>
                      <option value="yoghurt">Yoghurt</option>
                      <option value="cake">Cake</option>
                    </>
                  ) : (
                    <>
                      <option value="ingredients">Ingredients</option>
                      <option value="packaging">Packaging</option>
                      <option value="rent">Rent</option>
                      <option value="utilities">Utilities</option>
                      <option value="wages">Wages</option>
                      <option value="other">Other</option>
                    </>
                  )}
                </select>
              </div>

              {editTarget.kind === 'sale' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#685456] block mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={editForm.quantity}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          quantity: Math.max(1, Number(e.target.value)),
                        })
                      }
                      className="w-full text-sm px-3 py-2 rounded-xl border border-[#d8cbbf] bg-white focus:outline-none focus:border-[#48272c]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#685456] block mb-1">
                      Unit Price (ETB)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={editForm.unit_price}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          unit_price: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-full text-sm px-3 py-2 rounded-xl border border-[#d8cbbf] bg-white focus:outline-none focus:border-[#48272c]"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#685456] block mb-1">
                    Amount (ETB)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={editForm.amount}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        amount: Math.max(0.01, Number(e.target.value)),
                      })
                    }
                    className="w-full text-sm px-3 py-2 rounded-xl border border-[#d8cbbf] bg-white focus:outline-none focus:border-[#48272c]"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#685456] block mb-1">
                  Payment Method
                </label>
                <select
                  value={editForm.payment}
                  onChange={(e) =>
                    setEditForm({ ...editForm, payment: e.target.value as any })
                  }
                  className="w-full text-sm px-3 py-2 rounded-xl border border-[#d8cbbf] bg-white focus:outline-none focus:border-[#48272c]"
                >
                  <option value="cash">Cash</option>
                  <option value="mobile">Mobile Money</option>
                  <option value="card">Card</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#f0e8de] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-3.5 py-2 rounded-xl border border-[#d8cbbf] bg-white text-xs font-bold text-[#685456] hover:bg-[#f7f3ec]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionBusy}
                  className="px-4 py-2 rounded-xl bg-[#48272c] text-[#fdfbf7] text-xs font-bold hover:bg-[#381e22] disabled:opacity-50"
                >
                  {actionBusy ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-[#fdfbf7] border border-[#e8ded4] rounded-2xl w-full max-w-sm p-5 shadow-xl text-[#2b181b]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mb-3">
              <Trash2 size={20} />
            </div>
            <h2 className="text-base font-bold text-[#48272c] mb-1">
              Delete Transaction?
            </h2>
            <p className="text-xs text-[#685456] mb-4 leading-relaxed">
              Are you sure you want to delete this {deleteTarget.kind}? This will remove{' '}
              <strong>{deleteTarget.label}</strong> ({money(deleteTarget.amount)}) permanently.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-2 rounded-xl border border-[#d8cbbf] bg-white text-xs font-bold text-[#685456] hover:bg-[#f7f3ec]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => void handleConfirmDelete()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {actionBusy ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

interface ReportDay {
  date: string;
  yoghurt: number;
  cake: number;
  expenses: number;
  profit: number;
}

type ReportFilterMode = 'day' | 'week' | 'month' | 'custom';

function Reports() {
  const { isLocalMode } = useAuth();
  const [filterMode, setFilterMode] = useState<ReportFilterMode>('month');

  // Compute local today's date formatted as YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date(Date.now() - 30 * 86400000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [customEnd, setCustomEnd] = useState<string>(todayStr);

  const [data, setData] = useState<ReportDay[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Compute start/end ISO strings and user-friendly period label
  const { startIso, endIso, periodLabel } = useMemo(() => {
    if (filterMode === 'day') {
      const start = new Date(`${selectedDate}T00:00:00`).toISOString();
      const end = new Date(`${selectedDate}T23:59:59.999`).toISOString();
      const parts = selectedDate.split('-');
      const formattedDate =
        parts.length === 3
          ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : selectedDate;
      return { startIso: start, endIso: end, periodLabel: formattedDate };
    }

    if (filterMode === 'week') {
      const now = new Date();
      const start = new Date(Date.now() - 7 * 86400000).toISOString();
      const end = now.toISOString();
      return { startIso: start, endIso: end, periodLabel: 'Last 7 Days' };
    }

    if (filterMode === 'month') {
      const now = new Date();
      const start = new Date(Date.now() - 30 * 86400000).toISOString();
      const end = now.toISOString();
      return { startIso: start, endIso: end, periodLabel: 'Last 30 Days' };
    }

    // Custom
    const start = new Date(`${customStart}T00:00:00`).toISOString();
    const end = new Date(`${customEnd}T23:59:59.999`).toISOString();
    return {
      startIso: start,
      endIso: end,
      periodLabel: `${customStart} → ${customEnd}`,
    };
  }, [filterMode, selectedDate, customStart, customEnd]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    if (supabase && supabaseConfigured && !isLocalMode) {
      try {
        const [s, e] = await Promise.all([
          supabase
            .from('sales')
            .select('category,total,created_at')
            .gte('created_at', startIso)
            .lte('created_at', endIso),
          supabase
            .from('expenses')
            .select('amount,created_at')
            .gte('created_at', startIso)
            .lte('created_at', endIso),
        ]);
        if (s.error || e.error) {
          setError((s.error ?? e.error)!.message);
          setLoading(false);
          return;
        }

        const map = new Map<string, ReportDay>();
        const dayFor = (iso: string) => {
          const d = new Date(iso);
          const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (!map.has(dateKey)) {
            map.set(dateKey, { date: dateKey, yoghurt: 0, cake: 0, expenses: 0, profit: 0 });
          }
          return map.get(dateKey)!;
        };

        // For single-day filter, ensure the day exists in map even if 0 transactions
        if (filterMode === 'day') {
          map.set(selectedDate, { date: selectedDate, yoghurt: 0, cake: 0, expenses: 0, profit: 0 });
        }

        for (const r of s.data ?? []) {
          dayFor(r.created_at)[r.category as 'yoghurt' | 'cake'] += Number(r.total || 0);
        }
        for (const r of e.data ?? []) {
          dayFor(r.created_at).expenses += Number(r.amount || 0);
        }

        const list = [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
        list.forEach((d) => (d.profit = d.yoghurt + d.cake - d.expenses));
        setData(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error generating reports.');
      } finally {
        setLoading(false);
      }
    } else {
      const s = localStore.getSales().filter((item) => item.created_at >= startIso && item.created_at <= endIso);
      const e = localStore.getExpenses().filter((item) => item.created_at >= startIso && item.created_at <= endIso);

      const map = new Map<string, ReportDay>();
      const dayFor = (iso: string) => {
        const d = new Date(iso);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!map.has(dateKey)) {
          map.set(dateKey, { date: dateKey, yoghurt: 0, cake: 0, expenses: 0, profit: 0 });
        }
        return map.get(dateKey)!;
      };

      if (filterMode === 'day') {
        map.set(selectedDate, { date: selectedDate, yoghurt: 0, cake: 0, expenses: 0, profit: 0 });
      }

      for (const r of s) {
        dayFor(r.created_at)[r.category] += Number(r.total || 0);
      }
      for (const r of e) {
        dayFor(r.created_at).expenses += Number(r.amount || 0);
      }

      const list = [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
      list.forEach((d) => (d.profit = d.yoghurt + d.cake - d.expenses));
      setData(list);
      setLoading(false);
    }
  }, [startIso, endIso, isLocalMode, filterMode, selectedDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const yoghurtTotal = useMemo(() => data.reduce((acc, d) => acc + d.yoghurt, 0), [data]);
  const cakeTotal = useMemo(() => data.reduce((acc, d) => acc + d.cake, 0), [data]);
  const totalSales = yoghurtTotal + cakeTotal;
  const expensesTotal = useMemo(() => data.reduce((acc, d) => acc + d.expenses, 0), [data]);
  const netProfitTotal = totalSales - expensesTotal;

  const formatXAxis = (isoDate: string) => {
    try {
      const parts = isoDate.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return isoDate;
    } catch {
      return isoDate;
    }
  };

  return (
    <section data-testid="page-reports" className="max-w-5xl mx-auto px-1 py-2 sm:py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b4f58] block">
            Performance Ledger
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#48272c] tracking-tight">
            Reports &amp; Analytics
          </h1>
        </div>
        <button
          onClick={() => void load()}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#e4dcce] bg-white text-[#48272c] hover:bg-[#f7f3ec] transition-all flex items-center gap-1.5 shadow-xs"
        >
          <RotateCcw size={13} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Calendar Filter Panel */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#fffdf9] border border-[#e8ded4] shadow-xs mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar size={16} className="text-[#8b4f58]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#685456]">
              Filter Period
            </span>
          </div>
          <span className="text-xs font-semibold text-[#8b4f58] bg-[#48272c]/5 px-2.5 py-1 rounded-full">
            {periodLabel}
          </span>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            type="button"
            data-testid="button-report-day"
            onClick={() => setFilterMode('day')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              filterMode === 'day'
                ? 'bg-[#48272c] text-white border-[#48272c] shadow-xs'
                : 'bg-white text-[#48272c] border-[#e4dcce] hover:bg-[#f7f3ec]'
            }`}
          >
            📅 Single Day
          </button>
          <button
            type="button"
            data-testid="button-report-7-days"
            onClick={() => setFilterMode('week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              filterMode === 'week'
                ? 'bg-[#48272c] text-white border-[#48272c] shadow-xs'
                : 'bg-white text-[#48272c] border-[#e4dcce] hover:bg-[#f7f3ec]'
            }`}
          >
            🗓️ Last 7 Days
          </button>
          <button
            type="button"
            data-testid="button-report-30-days"
            onClick={() => setFilterMode('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              filterMode === 'month'
                ? 'bg-[#48272c] text-white border-[#48272c] shadow-xs'
                : 'bg-white text-[#48272c] border-[#e4dcce] hover:bg-[#f7f3ec]'
            }`}
          >
            🗓️ Last 30 Days
          </button>
          <button
            type="button"
            data-testid="button-report-custom"
            onClick={() => setFilterMode('custom')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              filterMode === 'custom'
                ? 'bg-[#48272c] text-white border-[#48272c] shadow-xs'
                : 'bg-white text-[#48272c] border-[#e4dcce] hover:bg-[#f7f3ec]'
            }`}
          >
            🗓️ Custom Range
          </button>
        </div>

        {/* Date Inputs based on mode */}
        {filterMode === 'day' && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#f0e8de]">
            <label htmlFor="report-single-date" className="text-xs font-bold text-[#685456]">
              Select Any Date:
            </label>
            <input
              id="report-single-date"
              type="date"
              data-testid="input-report-date"
              value={selectedDate}
              max={todayStr}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-xl border border-[#d8cbbf] bg-white text-[#48272c] focus:outline-none focus:border-[#48272c]"
            />
            {selectedDate !== todayStr && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-[#e4dcce] bg-white text-[#48272c] hover:bg-[#f7f3ec] transition-all"
              >
                Reset to Today
              </button>
            )}
          </div>
        )}

        {filterMode === 'custom' && (
          <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-[#f0e8de]">
            <div className="flex items-center gap-1.5">
              <label htmlFor="report-custom-start" className="text-xs font-bold text-[#685456]">
                From:
              </label>
              <input
                id="report-custom-start"
                type="date"
                data-testid="input-report-start-date"
                value={customStart}
                max={customEnd}
                onChange={(e) => setCustomStart(e.target.value)}
                className="text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-xl border border-[#d8cbbf] bg-white text-[#48272c] focus:outline-none focus:border-[#48272c]"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="report-custom-end" className="text-xs font-bold text-[#685456]">
                To:
              </label>
              <input
                id="report-custom-end"
                type="date"
                data-testid="input-report-end-date"
                value={customEnd}
                min={customStart}
                max={todayStr}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-xl border border-[#d8cbbf] bg-white text-[#48272c] focus:outline-none focus:border-[#48272c]"
              />
            </div>
          </div>
        )}
      </div>

      {error && <DataMessage error={error} retry={() => void load()} />}

      {/* 4 Summary Cards */}
      {loading ? (
        <LoadingCards />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 mb-5" data-testid="report-summary">
          {/* 1. Yoghurt Sales */}
          <article
            data-testid="metric-report-yoghurt"
            className="p-3.5 sm:p-4 rounded-2xl bg-[#fffdf9] border border-[#e8ded4] shadow-xs flex flex-col justify-between min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7d6065] flex items-center gap-1.5">
                <span>🥛</span>
                <span>Yoghurt</span>
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#c87a32]/10 text-[#c87a32] flex items-center justify-center">
                <Wheat size={15} />
              </div>
            </div>
            <div className="my-1.5">
              <strong className="block text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#48272c] truncate">
                {money(yoghurtTotal)}
              </strong>
            </div>
            <div className="text-[11px] text-[#8c7478]">
              {totalSales > 0 ? `${Math.round((yoghurtTotal / totalSales) * 100)}% of sales` : 'ETB sales'}
            </div>
          </article>

          {/* 2. Cake Sales */}
          <article
            data-testid="metric-report-cake"
            className="p-3.5 sm:p-4 rounded-2xl bg-[#fffdf9] border border-[#e8ded4] shadow-xs flex flex-col justify-between min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7d6065] flex items-center gap-1.5">
                <span>🎂</span>
                <span>Cake</span>
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#48272c]/10 text-[#48272c] flex items-center justify-center">
                <CakeSlice size={15} />
              </div>
            </div>
            <div className="my-1.5">
              <strong className="block text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#48272c] truncate">
                {money(cakeTotal)}
              </strong>
            </div>
            <div className="text-[11px] text-[#8c7478]">
              {totalSales > 0 ? `${Math.round((cakeTotal / totalSales) * 100)}% of sales` : 'ETB sales'}
            </div>
          </article>

          {/* 3. Expenses */}
          <article
            data-testid="metric-report-expenses"
            className="p-3.5 sm:p-4 rounded-2xl bg-[#fffdf9] border border-[#e8ded4] shadow-xs flex flex-col justify-between min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7d6065] flex items-center gap-1.5">
                <span>💸</span>
                <span>Expenses</span>
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#b84a5b]/10 text-[#b84a5b] flex items-center justify-center">
                <ArrowDownLeft size={15} />
              </div>
            </div>
            <div className="my-1.5">
              <strong className="block text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#b84a5b] truncate">
                {money(expensesTotal)}
              </strong>
            </div>
            <div className="text-[11px] text-[#8c7478]">
              Total outgoing costs
            </div>
          </article>

          {/* 4. Net Profit */}
          <article
            data-testid="metric-report-net-profit"
            className="p-3.5 sm:p-4 rounded-2xl bg-[#fffdf9] border border-[#e8ded4] shadow-xs flex flex-col justify-between min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7d6065] flex items-center gap-1.5">
                <span>📈</span>
                <span>Net Profit</span>
              </span>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  netProfitTotal >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                <TrendingUp size={15} />
              </div>
            </div>
            <div className="my-1.5">
              <strong
                className={`block text-xl sm:text-2xl font-bold font-mono tracking-tight truncate ${
                  netProfitTotal >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {money(netProfitTotal)}
              </strong>
            </div>
            <div className="text-[11px] text-[#8c7478]">
              Sales minus expenses
            </div>
          </article>
        </div>
      )}

      {/* Chart Panel */}
      <div
        className="p-4 sm:p-6 rounded-2xl bg-[#fffdf9] border border-[#e8ded4] shadow-xs"
        data-testid="chart-sales-expenses"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b4f58] block">
              Movement Overview
            </span>
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#48272c]">
              Daily Sales &amp; Expenses (ETB)
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-[#7d6065]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#c87a32]" /> 🥛 Yoghurt
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#48272c]" /> 🎂 Cake
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#b84a5b]" /> 💸 Expenses
            </span>
          </div>
        </div>

        {loading ? (
          <div className="h-64 sm:h-80 rounded-xl bg-[#48272c]/5 animate-pulse flex items-center justify-center text-xs font-medium text-[#7d6065]">
            Loading report data...
          </div>
        ) : data.length === 0 || (yoghurtTotal === 0 && cakeTotal === 0 && expensesTotal === 0) ? (
          <div className="h-56 flex flex-col items-center justify-center text-center p-6" data-testid="state-report-empty">
            <div className="w-12 h-12 rounded-full bg-[#48272c]/5 flex items-center justify-center text-[#48272c] mb-2">
              <BarChart3 size={22} />
            </div>
            <strong className="text-sm font-bold text-[#48272c]">No activity in this period</strong>
            <p className="text-xs text-[#8c7478] max-w-xs mt-1">
              No sales or expenses recorded for {periodLabel}. Choose another date or range above.
            </p>
          </div>
        ) : (
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0e8de" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 11, fill: '#7d6065' }}
                  axisLine={{ stroke: '#e8ded4' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                  tick={{ fontSize: 11, fill: '#7d6065' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any) => [money(Number(value) || 0), '']}
                  labelFormatter={(label) => formatXAxis(String(label))}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e8ded4',
                    background: '#fffdf9',
                    fontSize: 12,
                    color: '#48272c',
                    boxShadow: '0 4px 14px rgba(72,39,44,0.08)',
                  }}
                />
                <Bar dataKey="yoghurt" stackId="sales" fill="#c87a32" name="Yoghurt" radius={[0, 0, 0, 0]} />
                <Bar dataKey="cake" stackId="sales" fill="#48272c" name="Cake" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expenses" fill="#b84a5b" name="Expenses" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}

function Staff() {
  const { profile: me, isLocalMode } = useAuth();
  const [staff, setStaff] = useState<Profile[]>([]);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Password Reset Modal State
  const [resetStaff, setResetStaff] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetModalBusy, setResetModalBusy] = useState(false);
  const [resetModalMsg, setResetModalMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Delete Staff Modal State
  const [staffToDelete, setStaffToDelete] = useState<Profile | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Supabase Staff Connection States
  const [supabaseStaffIds, setSupabaseStaffIds] = useState<Set<string>>(new Set());
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);

  const [form, setForm] = useState<{ email: string; password: string; full_name: string; role: Role }>({
    email: '',
    password: '',
    full_name: '',
    role: 'employee',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const dummyEmails = new Set([
      'manager@sweetcraft.com',
      'employee@sweetcraft.com',
      'owner@sweetcraft.com',
    ]);
    const dummyIds = new Set(['usr-owner-2', 'usr-manager-1', 'usr-emp-1']);

    if (supabase && supabaseConfigured && !isLocalMode) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('full_name');
        
        if (error) {
          console.warn('Failed to load profiles from Supabase:', error.message);
          setStaff(localStore.getProfiles());
          setSupabaseStaffIds(new Set());
        } else if (data && data.length > 0) {
          // Identify any legacy mock dummy rows and clean them from Supabase in background
          const mockRows = (data as any[]).filter(
            p => dummyIds.has(p.id) || dummyEmails.has((p.email || '').toLowerCase().trim())
          );
          if (mockRows.length > 0) {
            void supabase.from('profiles').delete().in('id', mockRows.map(p => p.id));
          }

          // Filter out dummy mock profiles
          const realDbData = (data as any[]).filter(
            p => !dummyIds.has(p.id) && !dummyEmails.has((p.email || '').toLowerCase().trim())
          );

          const localProfiles = localStore.getProfiles();
          const supabaseIds = new Set(realDbData.map(p => p.id));
          setSupabaseStaffIds(supabaseIds);
          const supabaseEmails = new Set(realDbData.map(p => (p.email || '').toLowerCase()).filter(Boolean));

          const merged: Profile[] = realDbData.map(p => {
            const match = localProfiles.find(lp => lp.id === p.id || (lp.email && p.email && lp.email.toLowerCase() === p.email.toLowerCase()));
            return {
              id: p.id,
              full_name: p.full_name || match?.full_name || 'Staff Member',
              role: (p.role as Role) || match?.role || 'employee',
              active: p.active ?? true,
              email: p.email || match?.email || '',
            };
          });

          for (const lp of localProfiles) {
            const emailLower = (lp.email || '').toLowerCase();
            if (!supabaseIds.has(lp.id) && (!emailLower || !supabaseEmails.has(emailLower))) {
              merged.push(lp);
            }
          }
          setStaff(merged);
        } else {
          setStaff(localStore.getProfiles());
          setSupabaseStaffIds(new Set());
        }
      } catch (err) {
        console.error('Error in staff load:', err);
        setStaff(localStore.getProfiles());
        setSupabaseStaffIds(new Set());
      }
    } else {
      setStaff(localStore.getProfiles());
      setSupabaseStaffIds(new Set());
    }
    setLoading(false);
  }, [isLocalMode]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);

    const cleanEmail = form.email.trim().toLowerCase();
    const cleanName = form.full_name.trim();
    const cleanPass = form.password;
    const role = form.role;

    if (!cleanName) {
      setMessage({ ok: false, text: 'Please enter staff member full name.' });
      setBusy(false);
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setMessage({ ok: false, text: 'Please enter a valid email address.' });
      setBusy(false);
      return;
    }
    if (cleanPass.length < 6) {
      setMessage({ ok: false, text: 'Password must be at least 6 characters.' });
      setBusy(false);
      return;
    }

    try {
      if (supabase && supabaseConfigured && !isLocalMode) {
        const creds = getStoredCredentials();
        // Ephemeral client with no persistent session
        // This registers the user in Supabase Auth without disrupting current Owner session
        const ephemeralClient = createClient(creds.url, creds.anon, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        });

        // 1. Register user in Supabase Auth
        const { data: signUpData, error: signUpError } = await ephemeralClient.auth.signUp({
          email: cleanEmail,
          password: cleanPass,
          options: {
            data: {
              full_name: cleanName,
              role: role,
            },
          },
        });

        if (signUpError) {
          const errLower = signUpError.message.toLowerCase();
          if (errLower.includes('already registered') || errLower.includes('already in use')) {
            // Already in Supabase - update local store credentials so staff can log in
            localStore.saveOrUpdateStaffMember({
              email: cleanEmail,
              full_name: cleanName,
              role: role,
              password: cleanPass,
              active: true,
            });
            setMessage({
              ok: true,
              text: `Staff member "${cleanName}" (${cleanEmail}) is registered in Supabase. Password updated so they can sign in immediately.`,
            });
            setForm({ email: '', password: '', full_name: '', role: 'employee' });
            await load();
            return;
          }

          // Supabase free-tier SMTP rate limit exceeded (e.g. "email rate limit exceeded")
          if (
            errLower.includes('rate limit') ||
            errLower.includes('rate_limit') ||
            errLower.includes('over_email_send_rate_limit') ||
            errLower.includes('too many requests')
          ) {
            const fallbackId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `usr-${Date.now()}`;
            localStore.saveOrUpdateStaffMember({
              id: fallbackId,
              email: cleanEmail,
              full_name: cleanName,
              role: role,
              password: cleanPass,
              active: true,
            });

            // Try to upsert to Supabase profiles database table so they're in the remote database too
            try {
              let profRes = await supabase.from('profiles').upsert({
                id: fallbackId,
                full_name: cleanName,
                role: role,
                active: true,
                email: cleanEmail,
              });
              if (profRes.error) {
                await supabase.from('profiles').upsert({
                  id: fallbackId,
                  full_name: cleanName,
                  role: role,
                  active: true,
                });
              }
            } catch {
              // Ignore table schema error
            }

            setMessage({
              ok: true,
              text: `Staff member "${cleanName}" (${cleanEmail}) registered successfully! Supabase email rate limit was reached, so the account is saved for immediate sign-in with password. (Tip: In Supabase Auth → Providers → Email, turn OFF "Confirm email" to disable email limits).`,
            });
            setForm({ email: '', password: '', full_name: '', role: 'employee' });
            await load();
            return;
          }

          throw new Error(signUpError.message);
        }

        const newUserId = signUpData?.user?.id || ((typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `usr-${Date.now()}`);

        // 2. Save profile in Supabase profiles table
        let profileSaved = false;

        // If ephemeral client acquired a session (e.g. email confirmations off)
        if (signUpData.session) {
          try {
            let ephRes = await ephemeralClient.from('profiles').upsert({
              id: newUserId,
              full_name: cleanName,
              role: role,
              active: true,
              email: cleanEmail,
            });
            if (ephRes.error) {
              // Retry without email column in case table schema lacks it
              ephRes = await ephemeralClient.from('profiles').upsert({
                id: newUserId,
                full_name: cleanName,
                role: role,
                active: true,
              });
            }
            if (!ephRes.error) profileSaved = true;
          } catch {
            // fallback
          }
        }

        // Upsert via Owner's authenticated client
        if (!profileSaved) {
          try {
            let ownerRes = await supabase.from('profiles').upsert({
              id: newUserId,
              full_name: cleanName,
              role: role,
              active: true,
              email: cleanEmail,
            });
            if (ownerRes.error) {
              ownerRes = await supabase.from('profiles').upsert({
                id: newUserId,
                full_name: cleanName,
                role: role,
                active: true,
              });
            }
            if (!ownerRes.error) {
              profileSaved = true;
            }
          } catch (e) {
            console.warn('Owner upsert notice:', e);
          }
        }

        // 3. Always sync to local store with exact ID and password
        localStore.saveOrUpdateStaffMember({
          id: newUserId,
          email: cleanEmail,
          full_name: cleanName,
          role: role,
          password: cleanPass,
          active: true,
        });

        const emailNotice = !signUpData.session
          ? ' Note: If email confirmation is enabled in your Supabase project, staff can confirm via email or owner can disable "Confirm email" in Supabase Auth to enable instant direct sign-in.'
          : '';

        setMessage({
          ok: true,
          text: `Staff member "${cleanName}" registered successfully as ${role}! They can now log in with ${cleanEmail}.${emailNotice}`,
        });
        setForm({ email: '', password: '', full_name: '', role: 'employee' });
        await load();
      } else {
        // Local / Offline mode
        localStore.saveOrUpdateStaffMember({
          email: cleanEmail,
          full_name: cleanName,
          role: role,
          password: cleanPass,
          active: true,
        });

        setMessage({
          ok: true,
          text: `Staff member "${cleanName}" registered successfully as ${role}! They can now log in with ${cleanEmail}.`,
        });
        setForm({ email: '', password: '', full_name: '', role: 'employee' });
        await load();
      }
    } catch (err) {
      setMessage({
        ok: false,
        text: err instanceof Error ? err.message : 'Failed to register staff member.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = async (p: Profile) => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const nextActive = !p.active;
      if (supabase && supabaseConfigured && !isLocalMode) {
        const { error } = await supabase
          .from('profiles')
          .update({ active: nextActive })
          .eq('id', p.id);
        if (error) console.warn('Supabase toggle notice:', error.message);
      }
      localStore.toggleStaffStatus(p.id, nextActive);
      if (p.email) {
        localStore.toggleStaffStatus(p.email, nextActive);
      }

      setMessage({
        ok: true,
        text: `${p.full_name} has been ${nextActive ? 'reactivated' : 'deactivated'}.`,
      });
      await load();
    } catch (err) {
      setMessage({
        ok: false,
        text: err instanceof Error ? err.message : 'Action failed.',
      });
    } finally {
      setBusy(false);
    }
  };

  const executePasswordReset = async () => {
    if (!resetStaff) return;
    setResetModalBusy(true);
    setResetModalMsg(null);

    try {
      if (newPassword.trim()) {
        if (newPassword.trim().length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        localStore.resetStaffPassword(resetStaff.id, newPassword.trim());
        if (resetStaff.email) {
          localStore.resetStaffPassword(resetStaff.email, newPassword.trim());
        }
      }

      if (resetStaff.email && supabase && supabaseConfigured && !isLocalMode) {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(resetStaff.email);
          if (error) {
            console.warn('Supabase reset password email notice:', error.message);
          }
        } catch {
          // ignore
        }
      }

      setResetModalMsg({
        ok: true,
        text: `Password updated for ${resetStaff.full_name}. Staff can now sign in immediately with the new password.`,
      });
      setTimeout(() => {
        setResetStaff(null);
        setNewPassword('');
        setResetModalMsg(null);
      }, 1400);
    } catch (err) {
      setResetModalMsg({
        ok: false,
        text: err instanceof Error ? err.message : 'Failed to reset password.',
      });
    } finally {
      setResetModalBusy(false);
    }
  };

  const executeDeleteStaff = async () => {
    if (!staffToDelete || deleteBusy) return;
    setDeleteBusy(true);
    setMessage(null);

    const target = staffToDelete;
    try {
      if (supabase && supabaseConfigured && !isLocalMode) {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', target.id);

        if (error) {
          console.warn('Supabase delete profile notice:', error.message);
        }
      }

      localStore.deleteProfile(target.id);
      if (target.email) {
        localStore.deleteProfile(target.email);
      }

      setMessage({
        ok: true,
        text: `Staff member "${target.full_name}" has been permanently deleted.`,
      });
      setStaffToDelete(null);
      await load();
    } catch (err) {
      setMessage({
        ok: false,
        text: err instanceof Error ? err.message : 'Failed to delete staff member.',
      });
    } finally {
      setDeleteBusy(false);
    }
  };

  const syncStaffToSupabase = async () => {
    if (!supabase || !supabaseConfigured || isLocalMode) {
      setShowConnectModal(true);
      return;
    }
    setSyncBusy(true);
    setMessage(null);

    try {
      const currentStaff = localStore.getProfiles();
      let syncedCount = 0;
      let errorCount = 0;

      for (const member of currentStaff) {
        try {
          let res = await supabase.from('profiles').upsert({
            id: member.id,
            full_name: member.full_name,
            role: member.role,
            active: member.active,
            email: member.email || undefined,
          });

          if (res.error) {
            res = await supabase.from('profiles').upsert({
              id: member.id,
              full_name: member.full_name,
              role: member.role,
              active: member.active,
            });
          }

          if (!res.error) {
            syncedCount++;
          } else {
            console.warn(`Sync failed for ${member.full_name}:`, res.error.message);
            errorCount++;
          }
        } catch (memberErr) {
          console.warn(`Sync error for ${member.full_name}:`, memberErr);
          errorCount++;
        }
      }

      await load();

      if (errorCount === 0) {
        setMessage({
          ok: true,
          text: `All ${syncedCount} staff member(s) are connected and synced with your live Supabase database!`,
        });
      } else {
        setMessage({
          ok: syncedCount > 0,
          text: `Synced ${syncedCount} staff member(s) to Supabase. Note: Make sure the public.profiles table exists in Supabase.`,
        });
      }
    } catch (err) {
      setMessage({
        ok: false,
        text: err instanceof Error ? err.message : 'Failed to sync staff with Supabase.',
      });
    } finally {
      setSyncBusy(false);
    }
  };

  const handlePushSingleStaffToSupabase = async (targetStaff: Profile) => {
    if (!supabase || !supabaseConfigured || isLocalMode) {
      setShowConnectModal(true);
      return;
    }
    setSyncBusy(true);
    setMessage(null);
    try {
      let res = await supabase.from('profiles').upsert({
        id: targetStaff.id,
        full_name: targetStaff.full_name,
        role: targetStaff.role,
        active: targetStaff.active,
        email: targetStaff.email || undefined,
      });

      if (res.error) {
        res = await supabase.from('profiles').upsert({
          id: targetStaff.id,
          full_name: targetStaff.full_name,
          role: targetStaff.role,
          active: targetStaff.active,
        });
      }

      if (res.error) {
        throw new Error(res.error.message);
      }

      setMessage({
        ok: true,
        text: `Staff member "${targetStaff.full_name}" is now connected to your Supabase database!`,
      });
      await load();
    } catch (err) {
      setMessage({
        ok: false,
        text: err instanceof Error ? err.message : 'Failed to connect staff member to Supabase.',
      });
    } finally {
      setSyncBusy(false);
    }
  };

  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staff;
    const q = searchQuery.toLowerCase();
    return staff.filter(
      s => s.full_name.toLowerCase().includes(q) || (s.email && s.email.toLowerCase().includes(q)) || s.role.toLowerCase().includes(q)
    );
  }, [staff, searchQuery]);

  const activeCount = staff.filter(s => s.active).length;
  const managerCount = staff.filter(s => s.role === 'manager').length;
  const employeeCount = staff.filter(s => s.role === 'employee').length;

  return (
    <section data-testid="page-staff" className="max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#6B1D2F]/10 text-[#6B1D2F]">
              <Crown size={13} className="text-[#6B1D2F]" /> Owner Control
            </span>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#6B1D2F] tracking-tight">
            Staff Management
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            Register and link employees with your Supabase database.
          </p>
        </div>

        {/* Supabase Connection & Sync Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {supabase && supabaseConfigured && !isLocalMode ? (
            <button
              type="button"
              onClick={() => void syncStaffToSupabase()}
              disabled={syncBusy}
              data-testid="button-sync-staff-supabase"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors flex items-center gap-1.5 shadow-xs"
              title="Ensure all staff members are synced to your live Supabase database"
            >
              {syncBusy ? <RotateCcw size={14} className="animate-spin" /> : <Database size={14} />}
              <span>{syncBusy ? 'Syncing to Supabase…' : 'Sync Staff with Supabase'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowConnectModal(true)}
              data-testid="button-connect-staff-supabase"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#6B1D2F] hover:bg-[#521624] text-white transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Database size={14} />
              <span>Connect to Supabase</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowConnectModal(true)}
            className="p-2 rounded-xl border border-[#E8E1D7] text-[#6B1D2F] bg-white hover:bg-[#FAF7F2] transition-colors"
            title="Configure Supabase Database Credentials"
            aria-label="Supabase Settings"
          >
            <ShieldCheck size={16} />
          </button>
        </div>
      </div>

      {/* Status notification */}
      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border mb-6 text-sm ${
            message.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
          role="status"
          data-testid={message.ok ? 'status-staff-success' : 'status-staff-error'}
        >
          {message.ok ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <CircleAlert size={18} className="text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E1D7] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6B1D2F]/10 flex items-center justify-center text-[#6B1D2F]">
            <Users size={20} />
          </div>
          <div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] font-medium">Total Staff</div>
            <div className="text-xl font-bold text-[#6B1D2F]">{staff.length}</div>
          </div>
        </div>

        <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E1D7] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-700">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] font-medium">Active</div>
            <div className="text-xl font-bold text-emerald-700">{activeCount}</div>
          </div>
        </div>

        <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E1D7] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700">
            <Shield size={20} />
          </div>
          <div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] font-medium">Managers</div>
            <div className="text-xl font-bold text-amber-800">{managerCount}</div>
          </div>
        </div>

        <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E1D7] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-700">
            <User size={20} />
          </div>
          <div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] font-medium">Employees</div>
            <div className="text-xl font-bold text-blue-800">{employeeCount}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Add Staff Form + Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Register Form */}
        <div className="lg:col-span-5">
          <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E1D7] p-5 sm:p-6 shadow-sm sticky top-4">
            <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-[#E8E1D7]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#6B1D2F] text-white flex items-center justify-center">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-serif font-bold text-[#6B1D2F]">Register Staff</h2>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Create login credentials</p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                  supabase && supabaseConfigured && !isLocalMode
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-stone-100 text-stone-700 border border-stone-200'
                }`}
                title={
                  supabase && supabaseConfigured && !isLocalMode
                    ? 'Directly connected to Supabase profiles database'
                    : 'Saved to local browser database'
                }
              >
                <Database size={11} />
                <span>{supabase && supabaseConfigured && !isLocalMode ? 'Supabase Live' : 'Local Store'}</span>
              </span>
            </div>

            <form onSubmit={e => void handleCreate(e)} data-testid="form-create-staff" className="space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="staff-name" className="block text-xs font-semibold text-[#6B1D2F] uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  <input
                    id="staff-name"
                    data-testid="input-staff-name"
                    required
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                    placeholder="e.g. Abebe Bekele"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#E8E1D7] bg-white focus:outline-none focus:ring-2 focus:ring-[#6B1D2F]/30 focus:border-[#6B1D2F]"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="staff-email" className="block text-xs font-semibold text-[#6B1D2F] uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  <input
                    id="staff-email"
                    data-testid="input-staff-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="staff@sweetcraft.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#E8E1D7] bg-white focus:outline-none focus:ring-2 focus:ring-[#6B1D2F]/30 focus:border-[#6B1D2F]"
                  />
                </div>
              </div>

              {/* Temporary Password */}
              <div>
                <label htmlFor="staff-password" className="block text-xs font-semibold text-[#6B1D2F] uppercase tracking-wider mb-1.5">
                  Temporary Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  <input
                    id="staff-password"
                    data-testid="input-staff-password"
                    type={showPassword ? 'text' : 'password'}
                    minLength={6}
                    required
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-[#E8E1D7] bg-white focus:outline-none focus:ring-2 focus:ring-[#6B1D2F]/30 focus:border-[#6B1D2F]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[#6B1D2F]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">
                  At least 6 characters. Staff will use this to sign in.
                </p>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#6B1D2F] uppercase tracking-wider mb-2">
                  Role & Permissions
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role: 'employee' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      form.role === 'employee'
                        ? 'border-[#6B1D2F] bg-[#6B1D2F]/10 ring-2 ring-[#6B1D2F]'
                        : 'border-[#E8E1D7] bg-white hover:border-[#6B1D2F]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#6B1D2F]">Employee</span>
                      {form.role === 'employee' && <CheckCircle2 size={15} className="text-[#6B1D2F]" />}
                    </div>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))] leading-tight">
                      Records sales & expenses
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role: 'manager' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      form.role === 'manager'
                        ? 'border-[#6B1D2F] bg-[#6B1D2F]/10 ring-2 ring-[#6B1D2F]'
                        : 'border-[#E8E1D7] bg-white hover:border-[#6B1D2F]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#6B1D2F]">Manager</span>
                      {form.role === 'manager' && <CheckCircle2 size={15} className="text-[#6B1D2F]" />}
                    </div>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))] leading-tight">
                      All records + financial reports
                    </p>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={busy}
                data-testid="button-create-staff"
                className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-[#6B1D2F] hover:bg-[#521624] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-2"
              >
                {busy ? (
                  <>
                    <RotateCcw size={16} className="animate-spin" />
                    <span>Registering staff…</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Register Staff Member</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Staff Roster */}
        <div className="lg:col-span-7">
          <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E1D7] overflow-hidden shadow-sm">
            {/* Roster Header */}
            <div className="p-4 sm:p-5 border-b border-[#E8E1D7] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#6B1D2F]">Staff Roster</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {staff.length} registered member{staff.length === 1 ? '' : 's'}
                </p>
              </div>

              {/* Search Filter */}
              <div className="relative w-full sm:w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <input
                  type="text"
                  placeholder="Filter staff…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#E8E1D7] bg-white focus:outline-none focus:ring-2 focus:ring-[#6B1D2F]/30"
                />
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]" data-testid="state-staff-loading">
                <RotateCcw size={20} className="animate-spin mx-auto mb-2 text-[#6B1D2F]" />
                Loading staff roster…
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="p-8 text-center" data-testid="state-staff-empty">
                <Users size={28} className="mx-auto mb-2 text-[#6B1D2F]/40" />
                <p className="text-sm font-semibold text-[#6B1D2F]">No staff members found</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                  {searchQuery ? 'Try clearing your search query.' : 'Register your first employee or manager using the form.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#E8E1D7]">
                {filteredStaff.map(p => {
                  const isCurrent = p.id === me?.id;
                  const initials = p.full_name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <div
                      key={p.id}
                      data-testid={`row-staff-${p.id}`}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/60 transition-colors"
                    >
                      {/* Staff Info */}
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            p.role === 'owner'
                              ? 'bg-[#6B1D2F] text-white'
                              : p.role === 'manager'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {initials}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-[#6B1D2F]">
                              {p.full_name}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] bg-[#6B1D2F]/10 text-[#6B1D2F] px-1.5 py-0.5 rounded-md font-semibold">
                                You
                              </span>
                            )}
                          </div>
                          {p.email && (
                            <div className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1 mt-0.5">
                              <Mail size={12} /> {p.email}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                p.role === 'owner'
                                  ? 'bg-[#6B1D2F] text-white'
                                  : p.role === 'manager'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {p.role}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                                p.active ? 'text-emerald-700' : 'text-zinc-500'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${p.active ? 'bg-emerald-600' : 'bg-zinc-400'}`} />
                              {p.active ? 'Active' : 'Deactivated'}
                            </span>

                            {/* Supabase live connection indicator */}
                            {supabaseStaffIds.has(p.id) ? (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200"
                                title="Connected and saved in Supabase database"
                                data-testid={`badge-staff-supabase-synced-${p.id}`}
                              >
                                <Database size={10} />
                                <span>Supabase Synced</span>
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200"
                                title="Stored in local browser storage"
                                data-testid={`badge-staff-local-${p.id}`}
                              >
                                <span>Local Only</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                        {/* Push to Supabase button for unsynced staff */}
                        {!supabaseStaffIds.has(p.id) && supabase && supabaseConfigured && !isLocalMode && (
                          <button
                            type="button"
                            onClick={() => void handlePushSingleStaffToSupabase(p)}
                            disabled={syncBusy}
                            data-testid={`button-push-staff-supabase-${p.id}`}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center gap-1"
                            title="Sync this staff member to Supabase database"
                          >
                            <Database size={12} />
                            <span className="hidden sm:inline">Connect to Supabase</span>
                            <span className="sm:hidden">Sync</span>
                          </button>
                        )}

                        {!isCurrent && (
                          <>
                            <button
                              type="button"
                              onClick={() => void handleToggleActive(p)}
                              disabled={busy}
                              data-testid={`button-toggle-staff-${p.id}`}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                                p.active
                                  ? 'border-[#E8E1D7] text-rose-700 bg-white hover:bg-rose-50'
                                  : 'border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                              }`}
                            >
                              {p.active ? 'Deactivate' : 'Reactivate'}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setResetStaff(p);
                                setNewPassword('');
                                setResetModalMsg(null);
                              }}
                              disabled={busy}
                              data-testid={`button-reset-password-${p.id}`}
                              className="px-3 py-1.5 rounded-xl text-xs font-medium border border-[#E8E1D7] text-[#6B1D2F] bg-white hover:bg-[#FAF7F2] flex items-center gap-1"
                            >
                              <KeyRound size={12} />
                              <span>Reset</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setStaffToDelete(p)}
                              disabled={busy || deleteBusy}
                              data-testid={`button-delete-staff-${p.id}`}
                              className="px-3 py-1.5 rounded-xl text-xs font-medium border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 hover:border-rose-300 transition-colors flex items-center gap-1"
                              title={`Delete ${p.full_name}`}
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E1D7] max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8E1D7]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#6B1D2F] text-white flex items-center justify-center">
                  <KeyRound size={16} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-[#6B1D2F]">Reset Password</h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{resetStaff.full_name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetStaff(null)}
                className="text-[hsl(var(--muted-foreground))] hover:text-[#6B1D2F]"
              >
                <X size={18} />
              </button>
            </div>

            {resetModalMsg && (
              <div
                className={`p-3 rounded-xl border mb-4 text-xs font-medium ${
                  resetModalMsg.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {resetModalMsg.text}
              </div>
            )}

            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4 leading-relaxed">
              Set a new temporary password for <strong>{resetStaff.full_name}</strong>
              {resetStaff.email ? ` (${resetStaff.email})` : ''}.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-[#6B1D2F] uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E8E1D7] bg-white focus:outline-none focus:ring-2 focus:ring-[#6B1D2F]/30"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetStaff(null)}
                className="px-4 py-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] hover:text-[#6B1D2F]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void executePasswordReset()}
                disabled={resetModalBusy}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#6B1D2F] hover:bg-[#521624] transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {resetModalBusy ? <RotateCcw size={13} className="animate-spin" /> : <Check size={13} />}
                <span>Save New Password</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Staff Confirmation Modal */}
      {staffToDelete && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          data-testid="modal-delete-staff-confirm"
        >
          <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E1D7] max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8E1D7]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-200">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-[#6B1D2F]">Delete Staff Member</h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Irreversible removal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !deleteBusy && setStaffToDelete(null)}
                className="text-[hsl(var(--muted-foreground))] hover:text-[#6B1D2F] transition-colors p-1"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-white/90 border border-rose-200 rounded-xl p-3.5 mb-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#6B1D2F]/10 text-[#6B1D2F] font-bold text-xs flex items-center justify-center shrink-0">
                  {staffToDelete.full_name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-[#6B1D2F] truncate">
                    {staffToDelete.full_name}
                  </div>
                  {staffToDelete.email && (
                    <div className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                      {staffToDelete.email}
                    </div>
                  )}
                  <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                    {staffToDelete.role}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-6 leading-relaxed">
              Are you sure you want to permanently delete <strong>{staffToDelete.full_name}</strong>? 
              Their login access and profile will be permanently deleted from the system.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                disabled={deleteBusy}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-[hsl(var(--muted-foreground))] hover:text-[#6B1D2F] hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void executeDeleteStaff()}
                disabled={deleteBusy}
                data-testid="button-confirm-delete-staff"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {deleteBusy ? (
                  <>
                    <RotateCcw size={13} className="animate-spin" />
                    <span>Deleting…</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Delete Staff Member</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supabase Connection Setup Modal */}
      {showConnectModal && (
        <ConnectionModal
          onClose={() => {
            setShowConnectModal(false);
            void load();
          }}
        />
      )}
    </section>
  );
}

function NotFound() {
  return (
    <div className="empty-state" style={{ minHeight: '60vh' }}>
      <div>
        <span className="empty-icon">
          <CircleAlert size={24} />
        </span>
        <h2 className="section-title mb-2">Page Not Found</h2>
        <p className="page-intro mb-4">The shop page you requested does not exist.</p>
        <Link to="/" className="btn btn-primary inline-flex">
          Return to Today
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <Protected>
                  <Dashboard />
                </Protected>
              }
            />
            <Route
              path="/sales"
              element={
                <Protected>
                  <SaleForm />
                </Protected>
              }
            />
            <Route
              path="/expenses"
              element={
                <Protected>
                  <ExpenseForm />
                </Protected>
              }
            />
            <Route
              path="/transactions"
              element={
                <Protected>
                  <Transactions />
                </Protected>
              }
            />
            <Route
              path="/reports"
              element={
                <Protected>
                  <Reports />
                </Protected>
              }
            />
            <Route
              path="/staff"
              element={
                <Protected>
                  <Staff />
                </Protected>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
