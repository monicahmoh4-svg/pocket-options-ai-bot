'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [isDemo, setIsDemo] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token && (!email || !password)) {
      setError('Please enter email and password or an auth token.');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate auth delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const authData = {
        email,
        token,
        isDemo,
        loggedInAt: Date.now(),
      };

      localStorage.setItem('po-bot-auth', JSON.stringify(authData));
      router.push('/dashboard');
    } catch {
      setError('Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a14] via-[#12122a] to-[#0a0a14] px-4 py-8">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-po-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-po-blue/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-gradient-to-b from-po-card/80 to-po-darker/90 border border-white/5 rounded-2xl shadow-2xl shadow-black/40 backdrop-blur-sm p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-po-green to-emerald-600 flex items-center justify-center shadow-lg shadow-po-green/20 animate-pulse-green">
              <svg
                className="w-9 h-9 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-white mb-1">
            Pocket Options AI Trading Bot
          </h1>
          <p className="text-sm text-gray-400 text-center mb-8">
            Autonomous Trading with AI-Powered Signals
          </p>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-po-red/10 border border-po-red/30 text-po-red text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-po-darker/80 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-po-green/50 focus:ring-1 focus:ring-po-green/30 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-po-darker/80 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-po-green/50 focus:ring-1 focus:ring-po-green/30 transition-colors"
              />
            </div>

            {/* OR Separator */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-gray-500 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Auth Token */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Auth Token
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your session token"
                className="w-full bg-po-darker/80 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-po-green/50 focus:ring-1 focus:ring-po-green/30 transition-colors"
              />
            </div>

            {/* Demo / Real Toggle */}
            <div className="flex items-center justify-between bg-po-darker/60 border border-white/5 rounded-lg px-4 py-3">
              <span className="text-sm text-gray-300">Account Mode</span>
              <button
                type="button"
                onClick={() => setIsDemo(!isDemo)}
                className="flex items-center gap-2"
              >
                <span className={`text-xs font-medium ${!isDemo ? 'text-gray-500' : 'text-po-green'}`}>
                  Demo
                </span>
                <div
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                    isDemo ? 'bg-po-green' : 'bg-po-red'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                      !isDemo ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className={`text-xs font-medium ${!isDemo ? 'text-po-red' : 'text-gray-500'}`}>
                  Real
                </span>
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-po-green to-emerald-500 hover:from-emerald-500 hover:to-po-green text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg shadow-po-green/20 hover:shadow-po-green/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Authenticating...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  Login
                </>
              )}
            </button>
          </form>

          {/* Features */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a3.004 3.004 0 01-2.03.843H9.5a3 3 0 01-2.03-.843L5 14.5m14 0V6a2 2 0 00-2-2H7a2 2 0 00-2 2v8.5" />
                  </svg>
                ),
                label: 'AI Signal Generation',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                  </svg>
                ),
                label: 'Real-Time Market Scanning',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  </svg>
                ),
                label: 'Autonomous Trade Execution',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
                label: 'Risk Management Controls',
              },
            ].map((feature) => (
              <div
                key={feature.label}
                className="flex items-center gap-2.5 bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2.5"
              >
                <div className="text-po-green shrink-0">{feature.icon}</div>
                <span className="text-xs text-gray-300 leading-tight">{feature.label}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="text-[11px] text-gray-500 text-center mt-6">
            By continuing, you agree to our{' '}
            <span className="text-gray-400 underline underline-offset-2 cursor-pointer hover:text-white transition-colors">
              Terms of Service
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
