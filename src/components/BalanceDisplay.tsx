'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BalanceDisplayProps {
  balance: number
  todayProfit: number
  totalTrades: number
  winRate: number
  isDemo: boolean
  isConnected: boolean
}

function AnimatedNumber({ value, prefix = '', suffix = '' }: {
  value: number
  prefix?: string
  suffix?: string
}) {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValue = useRef(value)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const startValue = prevValue.current
    const endValue = value
    const duration = 800
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (endValue - startValue) * eased

      setDisplayValue(current)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        prevValue.current = endValue
      }
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [value])

  const formatted = displayValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}

export default function BalanceDisplay({
  balance,
  todayProfit,
  totalTrades,
  winRate,
  isDemo,
  isConnected,
}: BalanceDisplayProps) {
  const [prevProfit, setPrevProfit] = useState(todayProfit)
  const [profitDirection, setProfitDirection] = useState<'up' | 'down' | 'neutral'>('neutral')

  useEffect(() => {
    if (todayProfit > prevProfit) {
      setProfitDirection('up')
    } else if (todayProfit < prevProfit) {
      setProfitDirection('down')
    } else {
      setProfitDirection('neutral')
    }
    setPrevProfit(todayProfit)

    const timeout = setTimeout(() => setProfitDirection('neutral'), 1000)
    return () => clearTimeout(timeout)
  }, [todayProfit, prevProfit])

  const profitColor =
    todayProfit > 0
      ? 'text-green-500'
      : todayProfit < 0
      ? 'text-red-500'
      : 'text-gray-400'

  const profitBg =
    todayProfit > 0
      ? 'bg-green-500/10'
      : todayProfit < 0
      ? 'bg-red-500/10'
      : 'bg-gray-500/10'

  return (
    <div className="bg-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-xl border border-gray-800">
      <div className="flex items-center justify-between mb-3 sm:mb-6">
        <h2 className="text-sm sm:text-lg font-semibold text-gray-300">Account Overview</h2>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-[10px] sm:text-xs text-gray-500">{isConnected ? 'Live' : 'Offline'}</span>
          </div>
          <span className={`text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${isDemo ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'bg-green-500/20 text-green-500 border border-green-500/30'}`}>
            {isDemo ? 'DEMO' : 'REAL'}
          </span>
        </div>
      </div>

      <div className="mb-3 sm:mb-6">
        <p className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1">Total Balance</p>
        <div className="text-2xl sm:text-4xl font-bold text-white">
          <AnimatedNumber value={balance} prefix="$" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className={`rounded-lg sm:rounded-xl p-2 sm:p-4 ${profitBg}`}>
          <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2">Today&apos;s P&L</p>
          <div className={`text-sm sm:text-xl font-bold ${profitColor}`}>
            <AnimatePresence mode="wait">
              <motion.span
                key={todayProfit}
                initial={{ opacity: 0, y: profitDirection === 'up' ? 10 : profitDirection === 'down' ? -10 : 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: profitDirection === 'up' ? -10 : profitDirection === 'down' ? 10 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatedNumber value={todayProfit} prefix={todayProfit >= 0 ? '+$' : '-$'} />
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        <div className="rounded-lg sm:rounded-xl p-2 sm:p-4 bg-gray-800/50">
          <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2">Total Trades</p>
          <div className="text-sm sm:text-xl font-bold text-blue-400">
            <AnimatedNumber value={totalTrades} />
          </div>
        </div>

        <div className="rounded-lg sm:rounded-xl p-2 sm:p-4 bg-gray-800/50">
          <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2">Win Rate</p>
          <div className="text-sm sm:text-xl font-bold text-purple-400">
            <AnimatedNumber value={winRate} suffix="%" />
          </div>
        </div>
      </div>

      <div className="mt-3 sm:mt-6">
        <div className="flex items-center justify-between mb-1 sm:mb-2">
          <span className="text-[10px] sm:text-xs text-gray-500">Win/Loss Ratio</span>
          <span className="text-[10px] sm:text-xs text-gray-400">{winRate.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 sm:h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${winRate}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-0.5 sm:mt-1">
          <span className="text-[10px] sm:text-xs text-green-500">{Math.round((winRate / 100) * totalTrades)} W</span>
          <span className="text-[10px] sm:text-xs text-red-500">{totalTrades - Math.round((winRate / 100) * totalTrades)} L</span>
        </div>
      </div>
    </div>
  )
}
