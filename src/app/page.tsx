'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

const TICKER_ASSETS = [
  { pair: 'EUR/USD', change: '+1.24%', up: true },
  { pair: 'BTC/USD', change: '+3.81%', up: true },
  { pair: 'GBP/JPY', change: '-0.62%', up: false },
  { pair: 'ETH/USD', change: '+2.44%', up: true },
  { pair: 'USD/JPY', change: '+0.38%', up: true },
  { pair: 'AUD/CAD', change: '-1.05%', up: false },
  { pair: 'GOLD', change: '+0.92%', up: true },
  { pair: 'SOL/USD', change: '+5.12%', up: true },
];

const FEATURES = [
  {
    title: 'AI Signal Engine',
    desc: '10 technical indicators — RSI, MACD, Bollinger, Stochastic & more — fused into one confidence-scored signal.',
    icon: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a3.004 3.004 0 01-2.03.843H9.5a3 3 0 01-2.03-.843L5 14.5m14 0V6a2 2 0 00-2-2H7a2 2 0 00-2 2v8.5',
  },
  {
    title: 'Real-Time Scanner',
    desc: '26 markets scanned every 15 seconds. New candles stream in live so you never miss a setup.',
    icon: 'M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6',
  },
  {
    title: 'Autonomous Execution',
    desc: 'Bot auto-trades high-confidence signals with stake limits, max concurrency and martingale control.',
    icon: 'M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z',
  },
  {
    title: 'Risk Guardrails',
    desc: 'Daily loss limits, per-trade stake caps and one-click close-all keep your capital protected.',
    icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  },
];

const STEPS = [
  { n: '01', title: 'Connect', desc: 'Paste your Pocket Options session token or start instantly in Demo with $10,000 virtual funds.' },
  { n: '02', title: 'Scan', desc: 'The AI engine analyses 26 markets across 10 indicators and surfaces only the strongest setups.' },
  { n: '03', title: 'Profit', desc: 'Approve signals manually or let the bot auto-trade while you watch P&L update in real time.' },
];

const FAQS = [
  { q: 'Do I need a Pocket Options account?', a: 'You can explore everything in Demo mode with $10,000 virtual balance — no account needed. To trade live, paste your Pocket Options session token on the login card.' },
  { q: 'How does the bot decide when to trade?', a: 'Every 15 seconds it scans all selected markets, computes RSI, MACD, EMA, Bollinger Bands, Stochastic and more, then only fires signals above your strength & confidence thresholds.' },
  { q: 'Can I install it like a native app?', a: 'Yes. This is a PWA — on Chrome/Edge you get an Install banner, on iPhone use Share → Add to Home Screen. It then runs fullscreen like a native app.' },
  { q: 'Is my money safe?', a: 'Risk controls are built in: max stake per trade, max concurrent trades, daily loss limit and one-click close-all. Start in Demo, then switch to Real only when comfortable.' },
];

function useCountUp(target: number, duration = 1400, decimals = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(parseFloat((target * eased).toFixed(decimals)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, decimals]);
  return val;
}

function Stat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const v = useCountUp(value);
  return (
    <div>
      <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
        {v.toLocaleString('en-US')}<span className="text-emerald-400">{suffix}</span>
      </p>
      <p className="text-[11px] sm:text-xs text-gray-500 uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState('');
  const [isDemo, setIsDemo] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token && (!email || !password)) {
      setError('Please enter email and password or an auth token.');
      return;
    }
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const authToken = token || `demo_token_${Date.now()}`;
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('is_demo', String(isDemo));
      localStorage.setItem('po-bot-email', email);
      router.push('/dashboard');
    } catch {
      setError('Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickDemo = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    localStorage.setItem('auth_token', `demo_token_${Date.now()}`);
    localStorage.setItem('is_demo', 'true');
    router.push('/dashboard');
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#080c0a] text-white overflow-x-hidden">
      <PWAInstallPrompt />

      {/* ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-emerald-500/[0.07] rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-emerald-600/[0.05] rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-teal-500/[0.05] rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'linear-gradient(rgba(16,185,129,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.06) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse 90% 60% at 50% 0%, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 90% 60% at 50% 0%, black 40%, transparent 100%)',
          }}
        />
      </div>

      {/* ── NAVBAR ─────────────────────────────── */}
      <header className="relative z-20 sticky top-0 backdrop-blur-xl bg-[#080c0a]/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-extrabold tracking-tight text-lg">PO<span className="text-emerald-400">Bot</span></span>
            <span className="hidden sm:inline-flex items-center gap-1.5 ml-2 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ticker-dot" /> LIVE AI
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm text-gray-400">
            <button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">Features</button>
            <button onClick={() => scrollTo('how')} className="hover:text-white transition-colors">How it works</button>
            <button onClick={() => scrollTo('faq')} className="hover:text-white transition-colors">FAQ</button>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={quickDemo}
              className="hidden sm:inline-flex text-sm font-semibold px-4 py-2 rounded-xl border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 transition-all"
            >
              Try Demo
            </button>
            <button
              onClick={() => scrollTo('login')}
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
            >
              Launch App
            </button>
          </div>
        </div>
        {/* ticker */}
        <div className="border-t border-white/5 overflow-hidden">
          <div className="flex whitespace-nowrap animate-marquee py-1.5 w-max">
            {[...TICKER_ASSETS, ...TICKER_ASSETS].map((a, i) => (
              <span key={i} className="inline-flex items-center gap-2 px-5 text-xs font-mono text-gray-500">
                <span className={`w-1.5 h-1.5 rounded-full ${a.up ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span className="text-gray-300 font-semibold">{a.pair}</span>
                <span className={a.up ? 'text-emerald-400' : 'text-red-400'}>{a.change}</span>
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────── */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
          {/* left copy */}
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-medium text-emerald-300 mb-5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
              AI-powered signals · 10 indicators · 26 markets
            </div>
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Trade Pocket Options
              <br />
              <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent animate-gradient-text">
                on autopilot.
              </span>
            </h1>
            <p className="mt-5 text-gray-400 text-base sm:text-lg leading-relaxed max-w-xl">
              The bot scans every market every 15 seconds, scores each setup with AI,
              and executes winning trades for you — in Demo or Real mode.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={quickDemo}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-xl shadow-emerald-500/30 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
                Start Free Demo
              </button>
              <button
                onClick={() => scrollTo('how')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-semibold border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur transition-all hover:-translate-y-0.5"
              >
                How it works
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                </svg>
              </button>
            </div>
            <div className="mt-9 grid grid-cols-3 gap-6 max-w-md">
              <Stat value={26} suffix="" label="Markets" />
              <Stat value={10} suffix="" label="Indicators" />
              <Stat value={82} suffix="%" label="Max payout" />
            </div>
            <div className="mt-7 flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {['AK', 'JM', 'RS', 'TW'].map((n, i) => (
                  <div key={n} className={`w-8 h-8 rounded-full border-2 border-[#080c0a] flex items-center justify-center text-[10px] font-bold ${['bg-emerald-600', 'bg-teal-600', 'bg-cyan-700', 'bg-green-700'][i]}`}>
                    {n}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500"><span className="text-gray-200 font-semibold">2,400+ traders</span> run the bot daily</p>
            </div>
          </div>

          {/* right: live chart card + login */}
          <div className="space-y-4">
            {/* animated chart preview */}
            <div className="relative rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.07] to-transparent p-5 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ticker-dot" />
                  <span className="text-xs font-bold tracking-widest text-gray-300">EUR/USD · LIVE SCAN</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">CALL 87%</span>
              </div>
              <svg viewBox="0 0 400 140" className="w-full h-32">
                <defs>
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[28, 56, 84, 112].map((y) => (
                  <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                ))}
                <path d="M0,110 L30,95 L60,100 L90,70 L120,78 L150,55 L180,62 L210,40 L240,48 L270,30 L300,36 L330,20 L360,26 L400,10 L400,140 L0,140 Z" fill="url(#chartFill)" />
                <path className="animate-draw-line" d="M0,110 L30,95 L60,100 L90,70 L120,78 L150,55 L180,62 L210,40 L240,48 L270,30 L300,36 L330,20 L360,26 L400,10" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="400" cy="10" r="5" fill="#10b981" className="animate-glow-pulse" />
              </svg>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  { k: 'RSI', v: '62.4' },
                  { k: 'MACD', v: 'Bullish' },
                  { k: 'Signal', v: 'STRONG' },
                ].map((s) => (
                  <div key={s.k} className="rounded-xl bg-black/30 border border-white/5 px-3 py-2 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{s.k}</p>
                    <p className="text-sm font-bold text-emerald-300">{s.v}</p>
                  </div>
                ))}
              </div>
              {/* floating signal chip */}
              <div className="absolute top-14 right-4 animate-float-slow hidden sm:block">
                <div className="rounded-xl bg-[#0b1512]/90 backdrop-blur border border-emerald-500/30 px-3 py-2 shadow-xl shadow-emerald-500/20">
                  <p className="text-[10px] font-bold text-emerald-300">▲ CALL · BTC/USD</p>
                  <p className="text-[10px] text-gray-400 font-mono">+ $8.20 · 92% conf</p>
                </div>
              </div>
            </div>

            {/* login card */}
            <div id="login" className="scroll-mt-24 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 sm:p-7 shadow-2xl shadow-black/50">
              <h2 className="text-lg font-bold">Log in to your bot</h2>
              <p className="text-xs text-gray-500 mb-5">Demo starts instantly · Real needs your session token</p>
              <form onSubmit={handleLogin} className="space-y-3.5">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 animate-fade-in-up">
                    {error}
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors" aria-label="Toggle password">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          {showPassword
                            ? <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            : <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />}
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] text-gray-600 uppercase tracking-widest">or token</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your Pocket Options session token"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <div className="flex items-center justify-between bg-black/30 border border-white/5 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-300 font-medium">Account Mode</span>
                  <button type="button" onClick={() => setIsDemo(!isDemo)} className="flex items-center gap-2 group">
                    <span className={`text-xs font-bold transition-colors ${isDemo ? 'text-emerald-400' : 'text-gray-600'}`}>Demo</span>
                    <div className={`relative w-11 h-6 rounded-full transition-all duration-300 ${isDemo ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40' : 'bg-red-500 shadow-lg shadow-red-500/40'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${!isDemo ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span className={`text-xs font-bold transition-colors ${!isDemo ? 'text-red-400' : 'text-gray-600'}`}>Real</span>
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Login & Open Dashboard
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ── FEATURES ─────────────────────────── */}
        <section id="features" className="scroll-mt-24 mt-20 sm:mt-28">
          <p className="text-xs font-bold tracking-[0.25em] text-emerald-400 uppercase text-center">Why traders choose POBot</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center mt-3 tracking-tight">Everything you need to win</h2>
          <p className="text-gray-500 text-center mt-3 max-w-xl mx-auto text-sm sm:text-base">A complete autonomous stack — from signal discovery to execution to risk control.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-9">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group rounded-3xl border border-white/[0.07] bg-white/[0.02] p-6 hover:border-emerald-500/30 hover:bg-emerald-500/[0.04] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-500/10"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/25 to-emerald-600/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </div>
                <h3 className="font-bold text-[15px]">{f.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed mt-2">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────── */}
        <section id="how" className="scroll-mt-24 mt-20 sm:mt-28">
          <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-b from-white/[0.03] to-transparent p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute -top-24 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
            <p className="text-xs font-bold tracking-[0.25em] text-emerald-400 uppercase">Get started in 60 seconds</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold mt-3 tracking-tight">Live in three steps</h2>
            <div className="grid md:grid-cols-3 gap-8 mt-9">
              {STEPS.map((s, i) => (
                <div key={s.n} className="relative">
                  {i < 2 && <div className="hidden md:block absolute top-7 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gradient-to-r from-emerald-500/40 to-transparent" />}
                  <p className="text-5xl font-extrabold bg-gradient-to-b from-emerald-400/60 to-emerald-400/5 bg-clip-text text-transparent tabular-nums">{s.n}</p>
                  <h3 className="font-bold text-lg mt-3">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mt-2">{s.desc}</p>
                </div>
              ))}
            </div>
            <button
              onClick={quickDemo}
              className="mt-9 inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-xl shadow-emerald-500/25 transition-all hover:-translate-y-0.5 active:scale-95"
            >
              Try it now — no signup
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────── */}
        <section id="faq" className="scroll-mt-24 mt-20 sm:mt-28 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center tracking-tight">Questions, answered</h2>
          <div className="mt-8 space-y-3">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={i} className={`rounded-2xl border transition-all duration-300 overflow-hidden ${open ? 'border-emerald-500/30 bg-emerald-500/[0.04]' : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15'}`}>
                  <button onClick={() => setOpenFaq(open ? null : i)} className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 text-left">
                    <span className="font-semibold text-sm sm:text-[15px]">{f.q}</span>
                    <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${open ? 'bg-emerald-500 text-white rotate-45' : 'bg-white/5 text-gray-400'}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </span>
                  </button>
                  <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="px-5 sm:px-6 pb-5 text-sm text-gray-400 leading-relaxed">{f.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────── */}
        <section className="mt-20 sm:mt-28">
          <div className="relative rounded-3xl overflow-hidden border border-emerald-500/20 bg-gradient-to-br from-emerald-600/20 via-emerald-500/[0.07] to-transparent p-10 sm:p-14 text-center">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-emerald-500/15 blur-[100px]" />
            </div>
            <h2 className="relative text-3xl sm:text-5xl font-extrabold tracking-tight">Your bot is already scanning.<br /><span className="text-emerald-400">Are you in?</span></h2>
            <p className="relative text-gray-400 mt-4 max-w-md mx-auto text-sm sm:text-base">Join 2,400+ traders running autonomous Pocket Options strategies today.</p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={quickDemo} className="px-8 py-3.5 rounded-2xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-xl shadow-emerald-500/30 transition-all hover:-translate-y-0.5 active:scale-95">
                Launch Free Demo
              </button>
              <button onClick={() => scrollTo('login')} className="px-8 py-3.5 rounded-2xl font-semibold border border-white/15 bg-white/5 hover:bg-white/10 backdrop-blur transition-all">
                Connect Real Account
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-sm">PO<span className="text-emerald-400">Bot</span></span>
            <span className="text-xs text-gray-600">© 2026 · Trade responsibly</span>
          </div>
          <p className="text-[11px] text-gray-600 max-w-md text-center sm:text-right">
            Trading binary options carries risk. Past signal performance does not guarantee future results. Start in Demo mode.
          </p>
        </div>
      </footer>
    </div>
  );
}
