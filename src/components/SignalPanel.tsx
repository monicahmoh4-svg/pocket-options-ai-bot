'use client'

import { useState, useMemo } from 'react'
import { Signal } from '../types'

interface SignalPanelProps {
  signals: Signal[]
  onExecuteTrade: (signal: Signal) => void
  isExecuting: boolean
}

type SortMode = 'strength' | 'time'
type DirectionFilter = 'ALL' | 'CALL' | 'PUT'

function formatTimeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function StrengthBar({ value }: { value: number }) {
  const clamped = Math.min(Math.max(value, 0), 100)
  let gradientClass = 'from-red-500 to-orange-500'
  if (clamped >= 80) gradientClass = 'from-green-400 to-emerald-500'
  else if (clamped >= 60) gradientClass = 'from-yellow-400 to-orange-500'
  else if (clamped >= 40) gradientClass = 'from-orange-400 to-red-500'

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">Strength</span>
        <span className="text-xs font-mono font-semibold text-white">{clamped}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradientClass} transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

function DirectionBadge({ direction }: { direction: Signal['direction'] }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full ${
        direction === 'CALL'
          ? 'bg-green-500/15 text-green-400 border border-green-500/30'
          : 'bg-red-500/15 text-red-400 border border-red-500/30'
      }`}
    >
      {direction === 'CALL' ? (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {direction}
    </span>
  )
}

function IndicatorChip({ indicator }: { indicator: Signal['indicators'][number] }) {
  const chipColor =
    indicator.signal === 'CALL'
      ? 'bg-green-500/10 text-green-400 border-green-500/20'
      : indicator.signal === 'PUT'
        ? 'bg-red-500/10 text-red-400 border-red-500/20'
        : 'bg-gray-500/10 text-gray-400 border-gray-500/20'

  const signalIcon =
    indicator.signal === 'CALL' ? (
      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
          clipRule="evenodd"
        />
      </svg>
    ) : indicator.signal === 'PUT' ? (
      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    ) : (
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
    )

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded border ${chipColor}`}
    >
      {signalIcon}
      {indicator.name}
    </span>
  )
}

export default function SignalPanel({
  signals,
  onExecuteTrade,
  isExecuting,
}: SignalPanelProps) {
  const [sortMode, setSortMode] = useState<SortMode>('time')
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('ALL')
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null)

  const sortedSignals = useMemo(() => {
    let filtered = [...signals]

    if (directionFilter !== 'ALL') {
      filtered = filtered.filter((s) => s.direction === directionFilter)
    }

    filtered.sort((a, b) => {
      if (sortMode === 'strength') return b.strength - a.strength
      return b.timestamp - a.timestamp
    })

    return filtered
  }, [signals, sortMode, directionFilter])

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <h2 className="text-lg font-bold text-white">Trading Signals</h2>
          </div>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
            {signals.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            {(['ALL', 'CALL', 'PUT'] as DirectionFilter[]).map((dir) => (
              <button
                key={dir}
                onClick={() => setDirectionFilter(dir)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  directionFilter === dir
                    ? dir === 'CALL'
                      ? 'bg-green-600 text-white'
                      : dir === 'PUT'
                        ? 'bg-red-600 text-white'
                        : 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {dir}
              </button>
            ))}
          </div>
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setSortMode('time')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                sortMode === 'time' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Time
            </button>
            <button
              onClick={() => setSortMode('strength')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                sortMode === 'strength'
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Strength
            </button>
          </div>
        </div>
      </div>

      {/* Signal List */}
      <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-800/50">
        {sortedSignals.map((signal) => {
          const isStrong = signal.strength > 80
          const isExpanded = expandedSignal === signal.id

          return (
            <div
              key={signal.id}
              className={`transition-colors ${
                isStrong
                  ? 'bg-gradient-to-r from-yellow-500/5 via-orange-500/5 to-yellow-500/5'
                  : 'hover:bg-gray-800/30'
              }`}
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedSignal(isExpanded ? null : signal.id)}
              >
                {/* Top Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-white border border-gray-700">
                      {signal.assetName.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {signal.assetName}
                        </span>
                        {isStrong && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30">
                            STRONG
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <DirectionBadge direction={signal.direction} />
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(signal.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {/* Strength Bar */}
                <div className="mb-3">
                  <StrengthBar value={signal.strength} />
                </div>

                {/* Confidence */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Confidence</span>
                    <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          signal.confidence >= 75
                            ? 'bg-blue-400'
                            : signal.confidence >= 50
                              ? 'bg-blue-500'
                              : 'bg-gray-500'
                        }`}
                        style={{ width: `${signal.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-white">{signal.confidence}%</span>
                  </div>
                </div>

                {/* Quick Info Row */}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-white font-medium">${signal.recommendedStake}</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                    <span className="font-medium">+${signal.potentialProfit.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{signal.expiry}s</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">
                      {signal.indicators.filter((i) => i.signal === signal.direction).length}/
                      {signal.indicators.length} agree
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-800/50 pt-4">
                  {/* Indicator Breakdown */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Indicator Breakdown
                    </h4>
                    <div className="space-y-2">
                      {signal.indicators.map((ind) => (
                        <div
                          key={ind.name}
                          className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white font-medium">{ind.name}</span>
                            <span className="text-[10px] text-gray-500">
                              (wt: {(ind.weight * 100).toFixed(0)}%)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-300">
                              {ind.value.toFixed(2)}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                ind.signal === 'CALL'
                                  ? 'bg-green-500/20 text-green-400'
                                  : ind.signal === 'PUT'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {ind.signal}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Indicator Chips */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Signals Summary
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {signal.indicators.map((ind) => (
                        <IndicatorChip key={ind.name} indicator={ind} />
                      ))}
                    </div>
                  </div>

                  {/* Trade Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <div className="text-[10px] text-gray-400 uppercase mb-1">Stake</div>
                      <div className="text-sm font-bold text-white">${signal.recommendedStake}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <div className="text-[10px] text-gray-400 uppercase mb-1">Profit</div>
                      <div className="text-sm font-bold text-green-400">
                        +${signal.potentialProfit.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <div className="text-[10px] text-gray-400 uppercase mb-1">Expiry</div>
                      <div className="text-sm font-bold text-white">{signal.expiry}s</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <div className="text-[10px] text-gray-400 uppercase mb-1">ROI</div>
                      <div className="text-sm font-bold text-blue-400">
                        {signal.recommendedStake > 0
                          ? ((signal.potentialProfit / signal.recommendedStake) * 100).toFixed(1)
                          : '0'}
                        %
                      </div>
                    </div>
                  </div>

                  {/* Execute Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onExecuteTrade(signal)
                    }}
                    disabled={isExecuting}
                    className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${
                      isExecuting
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : signal.direction === 'CALL'
                          ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/20 hover:shadow-green-500/30'
                          : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 hover:shadow-red-500/30'
                    }`}
                  >
                    {isExecuting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Executing Trade...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Execute {signal.direction} Trade - ${signal.recommendedStake}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {sortedSignals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <p className="text-gray-400 text-sm font-medium mb-1">No signals found</p>
          <p className="text-gray-500 text-xs">
            {directionFilter !== 'ALL'
              ? `No ${directionFilter} signals available. Try "ALL" filter.`
              : 'Signals will appear as markets are scanned and analyzed.'}
          </p>
        </div>
      )}

      {/* Footer */}
      {sortedSignals.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 bg-gray-800/30">
          <span className="text-xs text-gray-500">
            {sortedSignals.length} signal{sortedSignals.length !== 1 ? 's' : ''} shown
          </span>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              {sortedSignals.filter((s) => s.direction === 'CALL').length} CALL
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              {sortedSignals.filter((s) => s.direction === 'PUT').length} PUT
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
