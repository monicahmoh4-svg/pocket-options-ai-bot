'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

interface NavigationProps {
  botActive: boolean
  isConnected: boolean
  isDemo: boolean
  onToggleDemo: (isDemo: boolean) => void
}

const navLinks = [
  { name: 'Dashboard', path: '/', icon: '📊' },
  { name: 'Signals', path: '/signals', icon: '📡' },
  { name: 'Markets', path: '/markets', icon: '📈' },
  { name: 'Trades', path: '/trades', icon: '💹' },
  { name: 'Settings', path: '/settings', icon: '⚙️' },
]

export default function Navigation({
  botActive,
  isConnected,
  isDemo,
  onToggleDemo,
}: NavigationProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleDemoToggle = () => {
    onToggleDemo(!isDemo)
  }

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={toggleMobileMenu}
        className="fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg lg:hidden hover:bg-gray-700 transition-colors"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isMobileMenuOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gray-900 border-r border-gray-800 z-40 transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-64' : 'w-20'
        } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              {isExpanded && (
                <span className="text-xl font-bold text-white whitespace-nowrap">
                  PO Bot
                </span>
              )}
            </div>
            <button
              onClick={toggleSidebar}
              className="hidden lg:block p-1 text-gray-400 hover:text-white transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg
                className={`w-5 h-5 transition-transform ${isExpanded ? '' : 'rotate-180'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>
          </div>

          {/* Status Indicators */}
          <div className={`p-4 border-b border-gray-800 ${!isExpanded ? 'px-2' : ''}`}>
            {isExpanded ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Bot Status</span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        botActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        botActive ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {botActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Connection</span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        isConnected ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        isConnected ? 'text-blue-500' : 'text-yellow-500'
                      }`}
                    >
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    botActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}
                  title={botActive ? 'Bot Active' : 'Bot Inactive'}
                />
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? 'bg-blue-500' : 'bg-yellow-500'
                  }`}
                  title={isConnected ? 'Connected' : 'Disconnected'}
                />
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navLinks.map((link) => {
              const isActive = router.pathname === link.path
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  } ${!isExpanded ? 'justify-center' : ''}`}
                  title={!isExpanded ? link.name : undefined}
                >
                  <span className="text-xl">{link.icon}</span>
                  {isExpanded && (
                    <span className="font-medium">{link.name}</span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Account Toggle */}
          <div className={`p-4 border-t border-gray-800 ${!isExpanded ? 'px-2' : ''}`}>
            {isExpanded ? (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">Account Type</span>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      isDemo
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'bg-green-500/20 text-green-500'
                    }`}
                  >
                    {isDemo ? 'DEMO' : 'REAL'}
                  </span>
                </div>
                <button
                  onClick={handleDemoToggle}
                  className="relative w-full h-8 bg-gray-700 rounded-full transition-colors"
                  aria-label="Toggle account type"
                >
                  <div
                    className={`absolute top-1 w-6 h-6 rounded-full transition-all duration-300 ${
                      isDemo
                        ? 'left-1 bg-yellow-500'
                        : 'left-[calc(100%-28px)] bg-green-500'
                    }`}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-medium">
                    <span className={isDemo ? 'text-white' : 'text-gray-500'}>
                      Demo
                    </span>
                    <span className={!isDemo ? 'text-white' : 'text-gray-500'}>
                      Real
                    </span>
                  </div>
                </button>
              </div>
            ) : (
              <button
                onClick={handleDemoToggle}
                className="w-full flex items-center justify-center p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                title={isDemo ? 'Switch to Real Account' : 'Switch to Demo Account'}
              >
                <span className="text-lg">{isDemo ? '🎮' : '💰'}</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
