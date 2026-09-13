'use client'

import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { ChartDataPoint, TradeHistory } from '../types'

interface ProfitChartProps {
  chartData: ChartDataPoint[]
  tradeHistory: TradeHistory
  currentBalance: number
}

type TimeRange = '1H' | '6H' | '24H' | '7D' | 'ALL'
type ChartType = 'balance' | 'profit' | 'trades'

const TIME_RANGES: { label: TimeRange; hours: number | null }[] = [
  { label: '1H', hours: 1 },
  { label: '6H', hours: 6 },
  { label: '24H', hours: 24 },
  { label: '7D', hours: 168 },
  { label: 'ALL', hours: null },
]

const CHART_TYPES: { label: string; value: ChartType; icon: string }[] = [
  { label: 'Balance', value: 'balance', icon: '📈' },
  { label: 'Profit', value: 'profit', icon: '💰' },
  { label: 'Trades', value: 'trades', icon: '📊' },
]

export default function ProfitChart({
  chartData,
  tradeHistory,
  currentBalance,
}: ProfitChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL')
  const [chartType, setChartType] = useState<ChartType>('balance')

  const filteredData = useMemo(() => {
    if (timeRange === 'ALL' || chartData.length === 0) return chartData

    const range = TIME_RANGES.find((r) => r.label === timeRange)
    if (!range || !range.hours) return chartData

    const cutoff = Date.now() - range.hours * 60 * 60 * 1000
    return chartData.filter((point) => {
      const pointTime = new Date(point.time).getTime()
      return pointTime >= cutoff
    })
  }, [chartData, timeRange])

  const tradeBarData = useMemo(() => {
    return tradeHistory.trades
      .filter((t) => t.profit !== undefined)
      .slice(-50)
      .map((t) => ({
        time: new Date(t.closeTime || t.openTime).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        profit: t.profit || 0,
        asset: t.assetName,
        direction: t.direction,
      }))
  }, [tradeHistory.trades])

  const startingBalance = useMemo(() => {
    if (chartData.length > 0) return chartData[0].balance
    return currentBalance - tradeHistory.totalProfit
  }, [chartData, currentBalance, tradeHistory.totalProfit])

  const totalReturn = useMemo(() => {
    if (startingBalance === 0) return 0
    return ((currentBalance - startingBalance) / startingBalance) * 100
  }, [startingBalance, currentBalance])

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`

  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'profit') return [`$${value.toFixed(2)}`, 'Profit']
    if (name === 'balance') return [`$${value.toFixed(2)}`, 'Balance']
    return [value, name]
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
        <div className="text-xs text-gray-400 mb-2">{label}</div>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-300 capitalize">{entry.dataKey}</span>
            </span>
            <span className="font-medium text-white">
              {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }

  const TradeTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null
    const data = payload[0]?.payload
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
        <div className="text-xs text-gray-400 mb-1">{label}</div>
        <div className="text-sm text-white font-medium">{data?.asset}</div>
        <div className={`text-sm font-medium ${data?.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {formatCurrency(data?.profit || 0)}
        </div>
        <div className="text-xs text-gray-500 mt-1">{data?.direction}</div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-800 gap-3">
        <div className="flex items-center gap-2">
          {CHART_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setChartType(type.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                chartType === type.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>
        <div className="flex bg-gray-800 rounded-lg p-1">
          {TIME_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => setTimeRange(range.label)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                timeRange === range.label
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="p-4">
        {filteredData.length === 0 && tradeBarData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-3">📊</div>
              <div className="text-sm">No chart data available</div>
            </div>
          </div>
        ) : (
          <div className="h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'balance' ? (
                <LineChart data={filteredData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="time"
                    stroke="#6B7280"
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    tickFormatter={(val) => {
                      const d = new Date(val)
                      return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
                    }}
                  />
                  <YAxis
                    stroke="#6B7280"
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    tickFormatter={(val) => `$${val}`}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: '#3B82F6', stroke: '#1F2937', strokeWidth: 2 }}
                  />
                </LineChart>
              ) : chartType === 'profit' ? (
                <AreaChart data={filteredData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="profitGradientPositive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="profitGradientNegative" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="time"
                    stroke="#6B7280"
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    tickFormatter={(val) => {
                      const d = new Date(val)
                      return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
                    }}
                  />
                  <YAxis
                    stroke="#6B7280"
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#22C55E"
                    strokeWidth={2}
                    fill="url(#profitGradientPositive)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#22C55E', stroke: '#1F2937', strokeWidth: 2 }}
                  />
                </AreaChart>
              ) : (
                <BarChart data={tradeBarData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="time"
                    stroke="#6B7280"
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  />
                  <YAxis
                    stroke="#6B7280"
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip content={<TradeTooltip />} />
                  <Bar
                    dataKey="profit"
                    radius={[4, 4, 0, 0]}
                    fill="#3B82F6"
                  >
                    {tradeBarData.map((entry, index) => (
                      <rect
                        key={index}
                        fill={entry.profit >= 0 ? '#22C55E' : '#EF4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-px bg-gray-800 border-t border-gray-800">
        <div className="bg-gray-900 p-4 text-center">
          <div className="text-xs text-gray-500 mb-1">Starting Balance</div>
          <div className="text-lg font-bold text-white">{formatCurrency(startingBalance)}</div>
        </div>
        <div className="bg-gray-900 p-4 text-center">
          <div className="text-xs text-gray-500 mb-1">Current Balance</div>
          <div className="text-lg font-bold text-blue-400">{formatCurrency(currentBalance)}</div>
        </div>
        <div className="bg-gray-900 p-4 text-center">
          <div className="text-xs text-gray-500 mb-1">Total Return</div>
          <div className={`text-lg font-bold ${totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  )
}
