'use client'

import { useState, useMemo } from 'react'
import { Trade, TradeHistory as TradeHistoryType } from '../types'

interface TradeHistoryProps {
  tradeHistory: TradeHistoryType
  activeTrades: Trade[]
  onCloseTrade: (tradeId: string) => void
}

type SortField = 'time' | 'profit' | 'asset'
type SortOrder = 'asc' | 'desc'
type FilterStatus = 'ALL' | 'WIN' | 'LOSS'

export default function TradeHistory({
  tradeHistory,
  activeTrades,
  onCloseTrade,
}: TradeHistoryProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')
  const [sortField, setSortField] = useState<SortField>('time')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const tradesPerPage = 10

  const winRate = tradeHistory.totalTrades > 0
    ? ((tradeHistory.wins / tradeHistory.totalTrades) * 100).toFixed(1)
    : '0.0'

  const sortedTrades = useMemo(() => {
    const trades = [...tradeHistory.trades]

    if (filterStatus !== 'ALL') {
      return trades.filter((t) => t.status === filterStatus)
    }

    trades.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'time':
          comparison = (b.closeTime || b.openTime) - (a.closeTime || a.openTime)
          break
        case 'profit':
          comparison = (b.profit || 0) - (a.profit || 0)
          break
        case 'asset':
          comparison = a.assetName.localeCompare(b.assetName)
          break
      }
      return sortOrder === 'desc' ? comparison : -comparison
    })

    return trades
  }, [tradeHistory.trades, filterStatus, sortField, sortOrder])

  const totalPages = Math.ceil(sortedTrades.length / tradesPerPage)
  const paginatedTrades = sortedTrades.slice(
    (currentPage - 1) * tradesPerPage,
    currentPage * tradesPerPage
  )

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const getTimeRemaining = (trade: Trade) => {
    if (trade.status !== 'OPEN' && trade.status !== 'PENDING') return '--'
    const elapsed = (Date.now() - trade.openTime) / 1000
    const remaining = Math.max(0, trade.expiry - elapsed)
    if (remaining <= 0) return 'Expiring...'
    const minutes = Math.floor(remaining / 60)
    const seconds = Math.floor(remaining % 60)
    return `${minutes}m ${seconds}s`
  }

  const getCurrentPnL = (trade: Trade) => {
    if (trade.status !== 'OPEN') return trade.profit || 0
    if (!trade.exitPrice) return 0
    const priceDiff = trade.exitPrice - trade.entryPrice
    if (trade.direction === 'CALL') {
      return priceDiff > 0 ? trade.amount * 0.85 : -trade.amount
    }
    return priceDiff < 0 ? trade.amount * 0.85 : -trade.amount
  }

  const formatCurrency = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}$${Math.abs(value).toFixed(2)}`
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-600 ml-1">↕</span>
    return <span className="text-blue-400 ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-px bg-gray-800">
        <div className="bg-gray-900 p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Total Trades</div>
          <div className="text-lg font-bold text-white">{tradeHistory.totalTrades}</div>
        </div>
        <div className="bg-gray-900 p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Wins</div>
          <div className="text-lg font-bold text-green-500">{tradeHistory.wins}</div>
        </div>
        <div className="bg-gray-900 p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Losses</div>
          <div className="text-lg font-bold text-red-500">{tradeHistory.losses}</div>
        </div>
        <div className="bg-gray-900 p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Win Rate</div>
          <div className={`text-lg font-bold ${Number(winRate) >= 50 ? 'text-green-500' : 'text-red-500'}`}>
            {winRate}%
          </div>
        </div>
        <div className="bg-gray-900 p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Total Profit</div>
          <div className={`text-lg font-bold ${tradeHistory.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(tradeHistory.totalProfit)}
          </div>
        </div>
        <div className="bg-gray-900 p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Max Win</div>
          <div className="text-lg font-bold text-green-500">{formatCurrency(tradeHistory.maxWin)}</div>
        </div>
        <div className="bg-gray-900 p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Max Loss</div>
          <div className="text-lg font-bold text-red-500">{formatCurrency(tradeHistory.maxLoss)}</div>
        </div>
        <div className="bg-gray-900 p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Avg Profit</div>
          <div className={`text-lg font-bold ${tradeHistory.avgProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(tradeHistory.avgProfit)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'active'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/50'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <span className={`w-2 h-2 rounded-full ${activeTrades.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
            Active Trades ({activeTrades.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/50'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
          }`}
        >
          History ({tradeHistory.totalTrades})
        </button>
      </div>

      {/* Active Trades Tab */}
      {activeTab === 'active' && (
        <div className="p-4">
          {activeTrades.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">📭</div>
              <div className="text-sm">No active trades</div>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-800">
                      <th className="text-left py-3 px-3 font-medium">Asset</th>
                      <th className="text-left py-3 px-3 font-medium">Direction</th>
                      <th className="text-right py-3 px-3 font-medium">Amount</th>
                      <th className="text-right py-3 px-3 font-medium">Entry Price</th>
                      <th className="text-right py-3 px-3 font-medium">Time Left</th>
                      <th className="text-right py-3 px-3 font-medium">P&L</th>
                      <th className="text-center py-3 px-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTrades.map((trade) => {
                      const pnl = getCurrentPnL(trade)
                      return (
                        <tr
                          key={trade.id}
                          className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                        >
                          <td className="py-3 px-3">
                            <div className="font-medium text-white">{trade.assetName}</div>
                            <div className="text-xs text-gray-500">{formatTime(trade.openTime)}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                trade.direction === 'CALL'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {trade.direction === 'CALL' ? '↑' : '↓'} {trade.direction}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-white">${trade.amount.toFixed(2)}</td>
                          <td className="py-3 px-3 text-right text-gray-300">{trade.entryPrice.toFixed(5)}</td>
                          <td className="py-3 px-3 text-right">
                            <span className="text-yellow-400 font-mono text-xs">
                              {getTimeRemaining(trade)}
                            </span>
                          </td>
                          <td className={`py-3 px-3 text-right font-medium ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(pnl)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => onCloseTrade(trade.id)}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded transition-colors"
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {activeTrades.map((trade) => {
                  const pnl = getCurrentPnL(trade)
                  return (
                    <div key={trade.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-medium text-white">{trade.assetName}</div>
                          <div className="text-xs text-gray-500">{formatTime(trade.openTime)}</div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            trade.direction === 'CALL'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {trade.direction === 'CALL' ? '↑' : '↓'} {trade.direction}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <div className="text-gray-500 text-xs">Amount</div>
                          <div className="text-white">${trade.amount.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Entry</div>
                          <div className="text-gray-300">{trade.entryPrice.toFixed(5)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Time Left</div>
                          <div className="text-yellow-400 font-mono">{getTimeRemaining(trade)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">P&L</div>
                          <div className={`font-medium ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(pnl)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => onCloseTrade(trade.id)}
                        className="w-full px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded transition-colors"
                      >
                        Close Trade
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="p-4">
          {/* Filters & Sort Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex bg-gray-800 rounded-lg p-1">
              {(['ALL', 'WIN', 'LOSS'] as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status)
                    setCurrentPage(1)
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {status === 'ALL' ? 'All' : status}
                </button>
              ))}
            </div>
            <div className="flex bg-gray-800 rounded-lg p-1">
              {(['time', 'profit', 'asset'] as SortField[]).map((field) => (
                <button
                  key={field}
                  onClick={() => toggleSort(field)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors capitalize ${
                    sortField === field
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {field}<SortIcon field={field} />
                </button>
              ))}
            </div>
          </div>

          {sortedTrades.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">📋</div>
              <div className="text-sm">No trades found</div>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-800">
                      <th className="text-left py-3 px-3 font-medium">Asset</th>
                      <th className="text-left py-3 px-3 font-medium">Direction</th>
                      <th className="text-right py-3 px-3 font-medium">Amount</th>
                      <th className="text-right py-3 px-3 font-medium">Entry</th>
                      <th className="text-right py-3 px-3 font-medium">Exit</th>
                      <th className="text-right py-3 px-3 font-medium">Profit</th>
                      <th className="text-left py-3 px-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTrades.map((trade) => (
                      <tr
                        key={trade.id}
                        className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="font-medium text-white">{trade.assetName}</div>
                          <div className="text-xs text-gray-500">{formatTime(trade.openTime)}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                              trade.direction === 'CALL'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {trade.direction === 'CALL' ? '↑' : '↓'} {trade.direction}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-white">${trade.amount.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right text-gray-300">{trade.entryPrice.toFixed(5)}</td>
                        <td className="py-3 px-3 text-right text-gray-300">
                          {trade.exitPrice?.toFixed(5) || '--'}
                        </td>
                        <td className={`py-3 px-3 text-right font-medium ${
                          (trade.profit || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {trade.profit !== undefined ? formatCurrency(trade.profit) : '--'}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                              trade.status === 'WIN'
                                ? 'bg-green-500/20 text-green-400'
                                : trade.status === 'LOSS'
                                  ? 'bg-red-500/20 text-red-400'
                                  : trade.status === 'CANCELLED'
                                    ? 'bg-gray-500/20 text-gray-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                            }`}
                          >
                            {trade.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {paginatedTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className={`bg-gray-800 rounded-lg p-4 border-l-4 ${
                      trade.status === 'WIN'
                        ? 'border-l-green-500'
                        : trade.status === 'LOSS'
                          ? 'border-l-red-500'
                          : 'border-l-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-medium text-white">{trade.assetName}</div>
                        <div className="text-xs text-gray-500">{formatTime(trade.openTime)}</div>
                      </div>
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                          trade.status === 'WIN'
                            ? 'bg-green-500/20 text-green-400'
                            : trade.status === 'LOSS'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {trade.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-500 text-xs">Direction</div>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium ${
                            trade.direction === 'CALL' ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {trade.direction === 'CALL' ? '↑' : '↓'} {trade.direction}
                        </span>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Amount</div>
                        <div className="text-white">${trade.amount.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Entry</div>
                        <div className="text-gray-300">{trade.entryPrice.toFixed(5)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Exit</div>
                        <div className="text-gray-300">{trade.exitPrice?.toFixed(5) || '--'}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-gray-500 text-xs">Profit</div>
                        <div className={`text-lg font-bold ${
                          (trade.profit || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {trade.profit !== undefined ? formatCurrency(trade.profit) : '--'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
                  <div className="text-xs text-gray-500">
                    Showing {(currentPage - 1) * tradesPerPage + 1}-
                    {Math.min(currentPage * tradesPerPage, sortedTrades.length)} of{' '}
                    {sortedTrades.length}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-xs bg-gray-800 text-gray-400 rounded hover:bg-gray-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Prev
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let page: number
                      if (totalPages <= 5) {
                        page = i + 1
                      } else if (currentPage <= 3) {
                        page = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i
                      } else {
                        page = currentPage - 2 + i
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 text-xs rounded transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-xs bg-gray-800 text-gray-400 rounded hover:bg-gray-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
