'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BotControlsProps {
  botActive: boolean
  isConnected: boolean
  balance: number
  todayProfit: number
  activeTradeCount: number
  winRate: number
  onToggleBot: () => void
  onReconnect: () => void
  onCloseAllTrades: () => void
  onScanMarkets: () => void
}

export default function BotControls({
  botActive,
  isConnected,
  balance,
  todayProfit,
  activeTradeCount,
  winRate,
  onToggleBot,
  onReconnect,
  onCloseAllTrades,
  onScanMarkets,
}: BotControlsProps) {
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value)
  }

  return (
    <div className="card-dark p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">AI Trading Bot</h2>
            <p className="text-xs text-gray-500">Pocket Options Automated</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 hidden sm:inline">Auto-trade</span>
          <motion.div
            className={`w-11 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors ${botActive ? 'bg-emerald-500' : 'bg-gray-700'}`}
            animate={{ backgroundColor: botActive ? '#10b981' : '#374151' }}
            transition={{ duration: 0.3 }}
            onClick={onToggleBot}
          >
            <motion.div
              className="w-4 h-4 bg-white rounded-full shadow-md"
              animate={{ x: botActive ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </motion.div>
        </div>
      </div>

      <div className="flex justify-center mb-4 sm:mb-6">
        <motion.button
          onClick={onToggleBot}
          className={`relative w-32 h-32 sm:w-40 sm:h-40 rounded-full flex flex-col items-center justify-center font-bold text-base sm:text-xl transition-all ${
            botActive
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-2xl shadow-emerald-500/30'
              : 'bg-gradient-to-br from-gray-700 to-gray-800 text-gray-300 border-2 border-gray-600'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: botActive
              ? '0 0 60px rgba(16, 185, 129, 0.4)'
              : '0 0 20px rgba(0, 0, 0, 0.3)'
          }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait">
            <motion.div key={botActive ? 'active' : 'inactive'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center">
              {botActive ? (
                <>
                  <svg className="w-10 h-10 sm:w-14 sm:h-14 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>BOT ON</span>
                </>
              ) : (
                <>
                  <svg className="w-10 h-10 sm:w-14 sm:h-14 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  <span>BOT OFF</span>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="flex items-center justify-between mb-4 sm:mb-6 p-3 bg-gray-800/50 rounded-xl border border-gray-700/30">
        <div className="flex items-center gap-2">
          <motion.div
            className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}
            animate={{ scale: isConnected ? [1, 1.2, 1] : 1, opacity: isConnected ? [1, 0.7, 1] : 1 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="text-sm text-gray-300">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        {!isConnected && (
          <motion.button onClick={onReconnect} className="px-3 py-1.5 btn-primary text-xs font-medium rounded-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            Reconnect
          </motion.button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="bg-gray-800/30 rounded-xl p-3 text-center border border-gray-700/20">
          <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Balance</p>
          <p className="text-sm font-bold text-white">{formatCurrency(balance)}</p>
        </div>
        <div className="bg-gray-800/30 rounded-xl p-3 text-center border border-gray-700/20">
          <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">P&L</p>
          <p className={`text-sm font-bold ${todayProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {todayProfit >= 0 ? '+' : ''}{formatCurrency(todayProfit)}
          </p>
        </div>
        <div className="bg-gray-800/30 rounded-xl p-3 text-center border border-gray-700/20">
          <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Active</p>
          <p className="text-sm font-bold text-white">{activeTradeCount}</p>
        </div>
        <div className="bg-gray-800/30 rounded-xl p-3 text-center border border-gray-700/20">
          <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Win Rate</p>
          <p className={`text-sm font-bold ${winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>{winRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <motion.button onClick={onScanMarkets} className="flex items-center justify-center gap-2 px-4 py-3 btn-primary text-sm font-medium rounded-xl" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Scan
        </motion.button>
        <motion.button onClick={() => setShowCloseConfirm(true)} disabled={activeTradeCount === 0} className={`flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-xl transition-all text-sm ${activeTradeCount > 0 ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/20' : 'bg-gray-800/30 text-gray-600 cursor-not-allowed border border-gray-700/20'}`} whileHover={activeTradeCount > 0 ? { scale: 1.02 } : {}} whileTap={activeTradeCount > 0 ? { scale: 0.98 } : {}}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Close All
        </motion.button>
      </div>

      <AnimatePresence>
        {showCloseConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCloseConfirm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-gray-900 rounded-2xl p-6 max-w-sm mx-4 border border-gray-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                  <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Close All Trades?</h3>
                  <p className="text-sm text-gray-400">This will immediately close {activeTradeCount} active trade(s)</p>
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button onClick={() => setShowCloseConfirm(false)} className="flex-1 px-4 py-2.5 btn-secondary rounded-xl" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  Cancel
                </motion.button>
                <motion.button onClick={() => { onCloseAllTrades(); setShowCloseConfirm(false); }} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl transition-all" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  Close All
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
