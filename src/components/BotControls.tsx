'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BotControlsProps {
  botActive: boolean;
  isConnected: boolean;
  balance: number;
  todayProfit: number;
  activeTradeCount: number;
  winRate: number;
  onToggleBot: () => void;
  onReconnect: () => void;
  onCloseAllTrades: () => void;
  onScanMarkets: () => void;
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
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl border border-gray-700">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-white">AI Trading Bot</h2>
            <p className="text-[10px] sm:text-xs text-gray-400">Pocket Options Automated</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:inline">Auto-trade</span>
          <motion.div
            className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full flex items-center px-0.5 sm:px-1 ${botActive ? 'bg-green-500' : 'bg-gray-600'}`}
            animate={{ backgroundColor: botActive ? '#22c55e' : '#4b5563' }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white rounded-full shadow-md"
              animate={{ x: botActive ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </motion.div>
        </div>
      </div>

      <div className="flex justify-center mb-4 sm:mb-6">
        <motion.button
          onClick={onToggleBot}
          className={`relative w-28 h-28 sm:w-40 sm:h-40 rounded-full flex flex-col items-center justify-center font-bold text-base sm:text-xl transition-all ${botActive ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' : 'bg-gradient-to-br from-red-500 to-rose-600 text-white'}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{ boxShadow: botActive ? '0 0 40px rgba(34, 197, 94, 0.5)' : '0 0 40px rgba(239, 68, 68, 0.3)' }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait">
            <motion.div key={botActive ? 'active' : 'inactive'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center">
              {botActive ? (
                <>
                  <svg className="w-8 h-8 sm:w-12 sm:h-12 mb-1 sm:mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                  </svg>
                  <span>BOT ON</span>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 sm:w-12 sm:h-12 mb-1 sm:mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <span>BOT OFF</span>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="flex items-center justify-between mb-4 sm:mb-6 p-2.5 sm:p-3 bg-gray-700/50 rounded-xl">
        <div className="flex items-center gap-2">
          <motion.div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} animate={{ scale: isConnected ? [1, 1.2, 1] : 1, opacity: isConnected ? [1, 0.7, 1] : 1 }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <span className="text-xs sm:text-sm text-gray-300">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        {!isConnected && (
          <motion.button onClick={onReconnect} className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] sm:text-xs font-medium rounded-lg transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            Reconnect
          </motion.button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
          <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Balance</p>
          <p className="text-xs sm:text-sm font-bold text-white">{formatCurrency(balance)}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
          <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">P&L</p>
          <motion.p className={`text-xs sm:text-sm font-bold ${todayProfit >= 0 ? 'text-green-400' : 'text-red-400'}`} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 0.5 }}>
            {todayProfit >= 0 ? '+' : ''}{formatCurrency(todayProfit)}
          </motion.p>
        </div>
        <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
          <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Active</p>
          <p className="text-xs sm:text-sm font-bold text-white">{activeTradeCount}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
          <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Win Rate</p>
          <p className={`text-xs sm:text-sm font-bold ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>{winRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <motion.button onClick={onScanMarkets} className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Scan
        </motion.button>
        <motion.button onClick={() => setShowCloseConfirm(true)} disabled={activeTradeCount === 0} className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 font-medium rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm ${activeTradeCount > 0 ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`} whileHover={activeTradeCount > 0 ? { scale: 1.02 } : {}} whileTap={activeTradeCount > 0 ? { scale: 0.98 } : {}}>
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Close All
        </motion.button>
      </div>

      {/* Close All Confirmation Modal */}
      <AnimatePresence>
        {showCloseConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowCloseConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-2xl p-6 max-w-sm mx-4 border border-gray-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Close All Trades?</h3>
                  <p className="text-sm text-gray-400">This will immediately close {activeTradeCount} active trade(s)</p>
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowCloseConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={() => {
                    onCloseAllTrades();
                    setShowCloseConfirm(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Close All
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
