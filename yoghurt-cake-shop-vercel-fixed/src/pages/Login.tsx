import { useState, useEffect, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { ArrowUpRight, Eye, EyeOff, KeyRound, X, CheckCircle2, Moon, Sun } from 'lucide-react';

export default function Login() {
  const { isDark, toggleTheme } = useTheme();
  const {
    session,
    profile,
    signIn,
    resetPassword,
    isLocalMode,
    switchToLocalMode,
    switchToLiveMode,
    configured,
  } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [forgotBusy, setForgotBusy] = useState(false);

  useEffect(() => {
    if (session && profile) {
      nav('/', { replace: true });
    }
  }, [session, profile, nav]);

  // Hook rules: all hooks called unconditionally before early return
  if (session && profile) {
    return <Navigate to="/" replace />;
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await signIn(email.trim(), password);
    setBusy(false);
    if (err) {
      setError(err);
    } else {
      nav('/');
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setForgotBusy(true);
    setForgotStatus(null);
    const result = await resetPassword(forgotEmail.trim() || email.trim());
    setForgotBusy(false);
    setForgotStatus(result);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f7f4ee] font-sans text-[#3d2428] selection:bg-[#e39a88]/30">
      {/* Left Column: Deep Wine Hero / Editorial Ledger */}
      <section className="relative w-full md:w-[48%] lg:w-[46%] bg-[#48272c] text-[#fdfaf7] flex flex-col justify-between p-8 sm:p-12 md:p-14 lg:p-16 overflow-hidden min-h-[440px] md:min-h-screen shrink-0">
        {/* Subtle Decorative Concentric Arcs */}
        <svg
          className="absolute -right-24 sm:-right-20 md:-right-16 top-[18%] md:top-[22%] pointer-events-none w-[440px] sm:w-[500px] h-[440px] sm:h-[500px] text-[#e39a88]/20 z-0"
          viewBox="0 0 500 500"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="280" cy="250" r="135" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="280" cy="250" r="215" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="280" cy="250" r="295" stroke="currentColor" strokeWidth="1.2" opacity="0.65" />
        </svg>

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#e39a88] flex items-center justify-center text-[#48272c] shadow-xs shrink-0">
            {/* Custom cake slice icon matching the brand mark */}
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 17h16v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3Z" />
              <path d="M4 12h16v5H4z" />
              <path d="M6 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4H6V8Z" />
              <circle cx="12" cy="3.5" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <span className="font-serif font-bold text-xl sm:text-[22px] tracking-tight text-[#faf5f0]">
            Yoghurt &amp; Cake Shop
          </span>
        </div>

        {/* Center Editorial Copy */}
        <div className="relative z-10 my-10 md:my-auto max-w-[420px]">
          <span className="block text-[11px] uppercase tracking-[0.22em] font-semibold text-[#aa878c] mb-4">
            The Daily Shop Ledger
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-bold text-[#fdfaf7] leading-[1.08] tracking-tight mb-5">
            Good things,<br />well accounted.
          </h1>
          <p className="text-sm sm:text-[15px] text-[#cfb7ba] leading-[1.65] max-w-[370px] font-normal m-0">
            A focused place for the little details that keep a yoghurt and cake shop running beautifully.
          </p>
        </div>

        {/* Bottom Metadata */}
        <div className="relative z-10 text-[10px] sm:text-[11px] uppercase tracking-[0.24em] text-[#aa878c] font-semibold">
          Sales · Expenses · The Whole Day
        </div>
      </section>

      {/* Right Column: Cream Background with Floating White Card */}
      <section className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-14 min-h-[500px] md:min-h-screen">
        <div className="w-full max-w-[420px]">
          {/* Main Floating Card */}
          <div className="bg-white rounded-[28px] sm:rounded-[32px] p-8 sm:p-10 shadow-[0_12px_40px_rgba(72,39,44,0.04)] border border-[#ede7de]">
            {/* Card Eyebrow with Theme Toggle */}
            <div className="flex items-center justify-between mb-2">
              <span className="block text-[11px] font-semibold tracking-[0.18em] uppercase text-[#8f7b7e]">
                Staff Access
              </span>
              <button
                type="button"
                onClick={toggleTheme}
                data-testid="button-login-theme-toggle"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#f4efe9] text-[#48272c] hover:opacity-85 transition-opacity"
                title={isDark ? 'Switch to Cream Theme' : 'Switch to Dark Burgundy Theme'}
              >
                {isDark ? <Moon size={12} className="text-pink-400" /> : <Sun size={12} className="text-amber-500" />}
                <span>{isDark ? 'Dark' : 'Cream'}</span>
              </button>
            </div>

            {/* Card Title & Subtitle */}
            <h2 className="font-serif text-3xl sm:text-[32px] font-bold text-[#3d2428] mb-1.5 tracking-tight">
              Welcome back
            </h2>
            <p className="text-xs sm:text-[13px] text-[#7a6467] mb-7 font-normal">
              Sign in with your shop account.
            </p>

            {/* Login Form */}
            <form onSubmit={submit} data-testid="form-login" className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-[#3d2428] mb-1.5" htmlFor="login-email">
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@yourshop.com"
                  className="w-full px-4 py-3 bg-[#f4efe9] border border-[#e5ded6] rounded-xl text-sm text-[#3d2428] placeholder:text-[#9e8c8f] focus:outline-none focus:ring-2 focus:ring-[#48272c]/15 focus:border-[#48272c] transition-all"
                  data-testid="input-login-email"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#3d2428]" htmlFor="login-password">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotStatus(null);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] text-[#8e7a7d] hover:text-[#48272c] hover:underline cursor-pointer bg-transparent border-0 p-0 transition-colors"
                    data-testid="link-forgot-password"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full pl-4 pr-11 py-3 bg-[#f4efe9] border border-[#e5ded6] rounded-xl text-sm text-[#3d2428] placeholder:text-[#9e8c8f] focus:outline-none focus:ring-2 focus:ring-[#48272c]/15 focus:border-[#48272c] transition-all"
                    data-testid="input-login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#9e8c8f] hover:text-[#3d2428] transition-colors cursor-pointer bg-transparent border-0"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error Notice */}
              {error && (
                <div
                  className="w-full bg-[#fae8e5] text-[#8e3530] text-xs px-4 py-3 rounded-xl font-medium leading-relaxed"
                  role="alert"
                  data-testid="status-login-error"
                >
                  <p className="m-0 mb-1">{error}</p>
                  {!isLocalMode && (
                    <button
                      type="button"
                      onClick={() => {
                        switchToLocalMode();
                        setError(null);
                      }}
                      className="text-[11px] font-bold text-[#6B1D2F] underline hover:text-[#48272c] cursor-pointer mt-1"
                    >
                      Try signing in with Shop Local Store mode
                    </button>
                  )}
                </div>
              )}

              {/* Sign in Button */}
              <button
                type="submit"
                className="w-full mt-2 bg-[#48272c] hover:bg-[#381e22] text-[#fdfaf7] rounded-xl py-3.5 px-4 text-sm font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                disabled={busy || !email.trim() || !password}
                data-testid="button-submit-login"
              >
                {busy ? (
                  'Signing in…'
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowUpRight size={16} className="stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>

              {/* Mode Switcher & Card Sub-caption */}
              <div className="mt-6 pt-4 border-t border-[#ede7de] flex items-center justify-between text-xs text-[#8e7a7d]">
                <span className="flex items-center gap-1.5 font-medium">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      !isLocalMode ? 'bg-emerald-500 shadow-xs' : 'bg-amber-500 shadow-xs'
                    }`}
                  />
                  <span className="text-[11px] font-semibold text-[#5a4649]">
                    {!isLocalMode ? 'Live Supabase' : 'Shop Store (Local)'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (isLocalMode) {
                      switchToLiveMode();
                    } else {
                      switchToLocalMode();
                    }
                    setError(null);
                  }}
                  className="text-[11px] font-semibold text-[#6B1D2F] hover:underline cursor-pointer bg-transparent border-0 p-0"
                  data-testid="button-toggle-login-mode"
                >
                  {isLocalMode ? (configured ? 'Switch to Live' : 'Connect Live') : 'Switch to Local'}
                </button>
              </div>
          </div>
        </div>
      </section>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 relative shadow-2xl border border-[#ede7de]">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 text-[#8e7a7d] hover:text-[#3d2428] cursor-pointer bg-transparent border-0 p-1 rounded-lg"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <span className="w-9 h-9 rounded-xl bg-[#f4efe9] text-[#48272c] flex items-center justify-center">
                <KeyRound size={17} />
              </span>
              <h3 className="text-lg font-serif font-bold text-[#3d2428] m-0">
                Reset Password
              </h3>
            </div>
            <p className="text-xs text-[#7a6467] mb-5 leading-relaxed">
              Enter your registered staff email address to receive password reset instructions.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3d2428] mb-1.5" htmlFor="forgot-email-input">
                  Staff email address
                </label>
                <input
                  id="forgot-email-input"
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="e.g. employee@sweetcraft.com"
                  className="w-full px-4 py-2.5 bg-[#f4efe9] border border-[#e5ded6] rounded-xl text-sm text-[#3d2428] placeholder:text-[#9e8c8f] focus:outline-none focus:ring-2 focus:ring-[#48272c]/15 focus:border-[#48272c]"
                  data-testid="input-forgot-email"
                />
              </div>

              {forgotStatus && (
                <div
                  className={`text-xs p-3 rounded-xl flex items-start gap-2 ${
                    forgotStatus.ok
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                  role="status"
                  data-testid="status-forgot-message"
                >
                  {forgotStatus.ok && <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
                  <span className="leading-snug">{forgotStatus.message}</span>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full bg-[#48272c] hover:bg-[#381e22] text-[#fdfaf7] rounded-xl py-3 px-4 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                  disabled={forgotBusy || !forgotEmail.trim()}
                  data-testid="button-send-reset"
                >
                  {forgotBusy ? 'Sending request…' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
