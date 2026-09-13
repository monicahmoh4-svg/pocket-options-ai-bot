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

    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    animationRef.current = requestAnimationFrame(animate)
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current) }
  }, [value])

  return (
    <span>
      {prefix}{displayValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{suffix}
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
  return (
    <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider truncate">Balance</p>
          <p className="text-lg sm:text-2xl font-bold text-white tabular-nums">
            <AnimatedNumber value={balance} prefix="$" />
          </p>
        </div>
        <div className="hidden sm:block h-8 w-px bg-gray-800" />
        <div className="hidden sm:block min-w-0">
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">P&L</p>
          <p className={`text-sm sm:text-lg font-bold tabular-nums ${todayProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            <AnimatedNumber value={todayProfit} prefix={todayProfit >= 0 ? '+$' : '-$'} />
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden md:flex items-center gap-4">
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Trades</p>
            <p className="text-sm font-bold text-emerald-400">{totalTrades}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Win Rate</p>
            <p className="text-sm font-bold text-emerald-400">{winRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-800/50">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className="text-[10px] sm:text-xs text-gray-400">{isConnected ? 'Live' : 'Offline'}</span>
          </div>
          <span className={`text-[10px] sm:text-xs font-bold px-2 py-1 rounded-lg ${isDemo ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
            {isDemo ? 'DEMO' : 'REAL'}
          </span>
        </div>
      </div>
    </div>
  )
}
