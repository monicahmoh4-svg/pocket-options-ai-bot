'use client'

import { useState, useMemo } from 'react'
import { MarketScanResult } from '../types'

interface MarketScannerProps {
  scans: MarketScanResult[]
  isScanning: boolean
  lastScanTime: number
  onSelectMarket: (assetId: string) => void
}

type SortKey = keyof MarketScanResult
type SortDirection = 'asc' | 'desc'
type CategoryFilter = 'ALL' | 'FOREX' | 'CRYPTO'

const CRYPTO_ASSETS = [
  'BTC', 'ETH', 'SOL', 'DOGE', 'ADA', 'XRP', 'DOT', 'AVAX', 'MATIC', 'LINK',
  'SHIB', 'LTC', 'UNI', 'ATOM', 'FIL',
]

function getCryptoCategory(assetName: string): string {
  const name = assetName.toUpperCase()
  if (CRYPTO_ASSETS.some((c) => name.includes(c))) return 'CRYPTO'
  if (name.includes('/BTC') || name.includes('/ETH')) return 'CRYPTO'
  return 'FOREX'
}

function formatTimeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function TrendIndicator({ trend }: { trend: MarketScanResult['trend'] }) {
  if (trend === 'BULLISH') {
    return (
      <span className="inline-flex items-center gap-1 text-green-400">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-xs font-semibold">BULLISH</span>
      </span>
    )
  }
  if (trend === 'BEARISH') {
    return (
      <span className="inline-flex items-center gap-1 text-red-400">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-xs font-semibold">BEARISH</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-gray-400">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <span className="text-xs font-semibold">SIDEWAYS</span>
    </span>
  )
}

function RSIValue({ value }: { value: number }) {
  let colorClass = 'text-yellow-400'
  if (value < 30) colorClass = 'text-green-400'
  else if (value > 70) colorClass = 'text-red-400'

  return (
    <span className={`font-mono font-medium ${colorClass}`}>
      {value.toFixed(1)}
    </span>
  )
}

function VolatilityBar({ value }: { value: number }) {
  const clamped = Math.min(Math.max(value, 0), 100)
  let barColor = 'bg-green-500'
  if (clamped > 60) barColor = 'bg-red-500'
  else if (clamped > 35) barColor = 'bg-yellow-500'

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 font-mono">{clamped.toFixed(0)}%</span>
    </div>
  )
}

export default function MarketScanner({
  scans,
  isScanning,
  lastScanTime,
  onSelectMarket,
}: MarketScannerProps) {
  const [sortKey, setSortKey] = useState<SortKey>('volatility')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL')
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('desc')
    }
  }

  const filteredAndSorted = useMemo(() => {
    let filtered = [...scans]

    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter((s) => getCryptoCategory(s.assetName) === categoryFilter)
    }

    filtered.sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      return 0
    })

    return filtered
  }, [scans, sortKey, sortDirection, categoryFilter])

  const SortHeader = ({
    label,
    field,
  }: {
    label: string
    field: SortKey
  }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === field && (
          <svg
            className={`w-3 h-3 transition-transform ${sortDirection === 'asc' ? '' : 'rotate-180'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </span>
    </th>
  )

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {isScanning && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-400 rounded-full animate-ping" />
              )}
            </div>
            <h2 className="text-lg font-bold text-white">Market Scanner</h2>
          </div>
          {isScanning && (
            <span className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              Scanning...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            Last scan: {formatTimeAgo(lastScanTime)}
          </span>
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            {(['ALL', 'FOREX', 'CRYPTO'] as CategoryFilter[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scanning Progress Bar */}
      {isScanning && (
        <div className="h-0.5 bg-gray-800 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 animate-loading-bar" />
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <SortHeader label="Asset" field="assetName" />
              <SortHeader label="Price" field="currentPrice" />
              <SortHeader label="24h Change" field="change24h" />
              <SortHeader label="Trend" field="trendStrength" />
              <SortHeader label="RSI" field="rsi" />
              <SortHeader label="Volatility" field="volatility" />
              <SortHeader label="Signal" field="macd" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filteredAndSorted.map((scan) => {
              const isStrong =
                (scan.trend === 'BULLISH' && scan.rsi < 35 && scan.trendStrength > 60) ||
                (scan.trend === 'BEARISH' && scan.rsi > 65 && scan.trendStrength > 60)

              return (
                <tr
                  key={scan.assetId}
                  className={`transition-colors cursor-pointer ${
                    isStrong ? 'bg-blue-500/5 hover:bg-blue-500/10' : 'hover:bg-gray-800/50'
                  }`}
                  onClick={() =>
                    setExpandedAsset(expandedAsset === scan.assetId ? null : scan.assetId)
                  }
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-white">
                        {scan.assetName.slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{scan.assetName}</div>
                        <div className="text-xs text-gray-500">
                          {getCryptoCategory(scan.assetName)}
                        </div>
                      </div>
                      {isStrong && (
                        <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-white">
                      ${scan.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-sm font-medium ${
                        scan.change24h > 0 ? 'text-green-400' : scan.change24h < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}
                    >
                      {scan.change24h > 0 ? '+' : ''}
                      {scan.change24h.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <TrendIndicator trend={scan.trend} />
                      <div className="w-20 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            scan.trend === 'BULLISH'
                              ? 'bg-green-500'
                              : scan.trend === 'BEARISH'
                                ? 'bg-red-500'
                                : 'bg-gray-500'
                          }`}
                          style={{ width: `${scan.trendStrength}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RSIValue value={scan.rsi} />
                  </td>
                  <td className="px-4 py-3">
                    <VolatilityBar value={scan.volatility} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        scan.macd > 0
                          ? 'bg-green-500/10 text-green-400'
                          : scan.macd < 0
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-gray-500/10 text-gray-400'
                      }`}
                    >
                      {scan.macd > 0 ? 'BUY' : scan.macd < 0 ? 'SELL' : 'HOLD'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectMarket(scan.assetId)
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors"
                    >
                      Select
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-gray-800/50">
        {filteredAndSorted.map((scan) => {
          const isExpanded = expandedAsset === scan.assetId
          const isStrong =
            (scan.trend === 'BULLISH' && scan.rsi < 35 && scan.trendStrength > 60) ||
            (scan.trend === 'BEARISH' && scan.rsi > 65 && scan.trendStrength > 60)

          return (
            <div
              key={scan.assetId}
              className={`p-4 transition-colors ${
                isStrong ? 'bg-blue-500/5' : ''
              }`}
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedAsset(isExpanded ? null : scan.assetId)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-white">
                    {scan.assetName.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{scan.assetName}</span>
                      {isStrong && (
                        <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                      )}
                    </div>
                    <div className="text-sm font-mono text-gray-300">
                      ${scan.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium ${
                      scan.change24h > 0 ? 'text-green-400' : scan.change24h < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}
                  >
                    {scan.change24h > 0 ? '+' : ''}
                    {scan.change24h.toFixed(2)}%
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 space-y-3 pl-13">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Trend</div>
                      <TrendIndicator trend={scan.trend} />
                      <div className="w-full h-1.5 bg-gray-700 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            scan.trend === 'BULLISH'
                              ? 'bg-green-500'
                              : scan.trend === 'BEARISH'
                                ? 'bg-red-500'
                                : 'bg-gray-500'
                          }`}
                          style={{ width: `${scan.trendStrength}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">RSI</div>
                      <RSIValue value={scan.rsi} />
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Volatility</div>
                      <VolatilityBar value={scan.volatility} />
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">MACD Signal</div>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          scan.macd > 0
                            ? 'bg-green-500/10 text-green-400'
                            : scan.macd < 0
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-gray-500/10 text-gray-400'
                        }`}
                      >
                        {scan.macd > 0 ? 'BUY' : scan.macd < 0 ? 'SELL' : 'HOLD'}
                      </span>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Support</div>
                      <span className="text-sm font-mono text-white">
                        ${scan.supportLevel.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Resistance</div>
                      <span className="text-sm font-mono text-white">
                        ${scan.resistanceLevel.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectMarket(scan.assetId)
                    }}
                    className="w-full py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Select Market
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredAndSorted.length === 0 && !isScanning && (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <svg className="w-12 h-12 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-gray-400 text-sm">No markets found</p>
          <p className="text-gray-500 text-xs mt-1">
            {categoryFilter !== 'ALL' ? 'Try a different filter' : 'Start scanning to see results'}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 bg-gray-800/30">
        <span className="text-xs text-gray-500">
          {filteredAndSorted.length} market{filteredAndSorted.length !== 1 ? 's' : ''}
        </span>
        <span className="text-xs text-gray-500">
          Updated {formatTimeAgo(lastScanTime)}
        </span>
      </div>
    </div>
  )
}
