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
  { name: 'Dashboard', key: 'overview', icon: '📊' },
  { name: 'Signals', key: 'signals', icon: '📡' },
  { name: 'Markets', key: 'markets', icon: '📈' },
  { name: 'Trades', key: 'trades', icon: '💹' },
  { name: 'Settings', key: 'settings', icon: '⚙️' },
  { name: 'Log', key: 'log', icon: '📋' },
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
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false)
      }
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
        className="fixed top-3 left-3 z-50 p-2 bg-gray-800 rounded-lg lg:hidden hover:bg-gray-700 transition-colors shadow-lg"
        aria-label="Toggle menu"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-full bg-gray-900 border-r border-gray-800 z-40 transition-all duration-300 ease-in-out ${isExpanded ? 'w-60' : 'w-16'} ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="flex items-center justify-between p-3 border-b border-gray-800 min-h-[60px]">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              {isExpanded && <span className="text-lg font-bold text-white whitespace-nowrap">PO Bot</span>}
            </div>
            <button onClick={() => setIsExpanded(!isExpanded)} className="hidden lg:block p-1 text-gray-400 hover:text-white transition-colors" aria-label="Toggle sidebar">
              <svg className={`w-4 h-4 transition-transform ${isExpanded ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <div className={`p-3 border-b border-gray-800 ${!isExpanded ? 'px-2' : ''}`}>
            {isExpanded ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Bot</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${botActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className={`text-xs font-medium ${botActive ? 'text-green-400' : 'text-red-400'}`}>{botActive ? 'ON' : 'OFF'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Conn</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-blue-500' : 'bg-yellow-500'}`} />
                    <span className={`text-xs font-medium ${isConnected ? 'text-blue-400' : 'text-yellow-400'}`}>{isConnected ? 'OK' : 'N/A'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${botActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} title={botActive ? 'Active' : 'Inactive'} />
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-blue-500' : 'bg-yellow-500'}`} title={isConnected ? 'Connected' : 'Disconnected'} />
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
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 text-left ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  } ${!isExpanded ? 'justify-center px-2' : ''}`}
                  title={!isExpanded ? link.name : undefined}
                >
                  <span className="text-base">{link.icon}</span>
                  {isExpanded && <span className="text-sm font-medium">{link.name}</span>}
                </button>
              )
            })}
          </nav>

          <div className={`p-3 border-t border-gray-800 ${!isExpanded ? 'px-2' : ''}`}>
            {isExpanded ? (
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Account</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDemo ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}`}>
                    {isDemo ? 'DEMO' : 'REAL'}
                  </span>
                </div>
                <button onClick={() => onToggleDemo(!isDemo)} className="relative w-full h-7 bg-gray-700 rounded-full transition-colors" aria-label="Toggle account type">
                  <div className={`absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300 ${isDemo ? 'left-0.5 bg-yellow-500' : 'left-[calc(100%-26px)] bg-green-500'}`} />
                  <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-medium">
                    <span className={isDemo ? 'text-white' : 'text-gray-500'}>Demo</span>
                    <span className={!isDemo ? 'text-white' : 'text-gray-500'}>Real</span>
                  </div>
                </button>
              </div>
            ) : (
              <button onClick={() => onToggleDemo(!isDemo)} className="w-full flex items-center justify-center p-1.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors" title={isDemo ? 'Switch to Real' : 'Switch to Demo'}>
                <span className="text-sm">{isDemo ? '🎮' : '💰'}</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
