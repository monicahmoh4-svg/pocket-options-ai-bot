'use client'

import { useState, useEffect } from 'react'

interface NavigationProps {
  botActive: boolean
  isConnected: boolean
  isDemo: boolean
  onToggleDemo: (isDemo: boolean) => void
  activeTab: string
  onTabChange: (tab: string) => void
}

const navLinks = [
  { name: 'Dashboard', key: 'overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'Signals', key: 'signals', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { name: 'Markets', key: 'markets', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { name: 'Trades', key: 'trades', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: 'Settings', key: 'settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { name: 'Log', key: 'log', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
]

export default function Navigation({
  botActive,
  isConnected,
  isDemo,
  onToggleDemo,
  activeTab,
  onTabChange,
}: NavigationProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleNavClick = (key: string) => {
    onTabChange(key)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-3 left-3 z-50 p-2 bg-gray-900/90 border border-gray-800 rounded-xl lg:hidden hover:bg-gray-800 transition-all shadow-lg backdrop-blur-sm"
        aria-label="Toggle menu"
      >
        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-full bg-gray-900/95 backdrop-blur-xl border-r border-gray-800/50 z-40 transition-all duration-300 ease-in-out ${isExpanded ? 'w-60' : 'w-16'} ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-3 border-b border-gray-800/50 min-h-[60px]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              {isExpanded && <span className="text-lg font-bold text-white whitespace-nowrap">PO Bot</span>}
            </div>
            <button onClick={() => setIsExpanded(!isExpanded)} className="hidden lg:block p-1 text-gray-500 hover:text-emerald-400 transition-colors" aria-label="Toggle sidebar">
              <svg className={`w-4 h-4 transition-transform ${isExpanded ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <div className={`p-3 border-b border-gray-800/50 ${!isExpanded ? 'px-2' : ''}`}>
            {isExpanded ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Bot</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${botActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className={`text-xs font-medium ${botActive ? 'text-emerald-400' : 'text-red-400'}`}>{botActive ? 'ON' : 'OFF'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Conn</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                    <span className={`text-xs font-medium ${isConnected ? 'text-emerald-400' : 'text-yellow-400'}`}>{isConnected ? 'OK' : 'N/A'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${botActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} title={botActive ? 'Active' : 'Inactive'} />
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-yellow-400'}`} title={isConnected ? 'Connected' : 'Disconnected'} />
              </div>
            )}
          </div>

          <nav className="flex-1 p-2 space-y-1">
            {navLinks.map((link) => {
              const isActive = activeTab === link.key
              return (
                <button
                  key={link.key}
                  onClick={() => handleNavClick(link.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left group ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-white border border-transparent'
                  } ${!isExpanded ? 'justify-center px-2' : ''}`}
                  title={!isExpanded ? link.name : undefined}
                >
                  <svg className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={link.icon} />
                  </svg>
                  {isExpanded && <span className="text-sm font-medium">{link.name}</span>}
                </button>
              )
            })}
          </nav>

          <div className={`p-3 border-t border-gray-800/50 ${!isExpanded ? 'px-2' : ''}`}>
            {isExpanded ? (
              <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Account</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDemo ? 'bg-yellow-500/10 text-yellow-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {isDemo ? 'DEMO' : 'REAL'}
                  </span>
                </div>
                <button onClick={() => onToggleDemo(!isDemo)} className="relative w-full h-7 bg-gray-700/50 rounded-full transition-colors border border-gray-600/30" aria-label="Toggle account type">
                  <div className={`absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300 ${isDemo ? 'left-0.5 bg-yellow-500 shadow-lg shadow-yellow-500/30' : 'left-[calc(100%-26px)] bg-emerald-500 shadow-lg shadow-emerald-500/30'}`} />
                  <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-medium">
                    <span className={isDemo ? 'text-white' : 'text-gray-500'}>Demo</span>
                    <span className={!isDemo ? 'text-white' : 'text-gray-500'}>Real</span>
                  </div>
                </button>
              </div>
            ) : (
              <button onClick={() => onToggleDemo(!isDemo)} className="w-full flex items-center justify-center p-2 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-colors border border-gray-700/30" title={isDemo ? 'Switch to Real' : 'Switch to Demo'}>
                <span className="text-sm">{isDemo ? '🎮' : '💰'}</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
