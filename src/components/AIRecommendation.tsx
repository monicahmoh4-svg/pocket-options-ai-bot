'use client'

import { useMemo } from 'react'

interface AIRecommendation {
  action: string
  reason: string
  risk: number
  signalId: string
}

interface AIRecommendationProps {
  recommendations: AIRecommendation[]
}

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  EXECUTE: { label: 'EXECUTE', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40' },
  REDUCE_STAKE: { label: 'REDUCE STAKE', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/40' },
  SKIP: { label: 'SKIP', color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/40' },
  AVOID: { label: 'AVOID', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40' },
}

function getRiskColor(risk: number): string {
  if (risk <= 3) return 'bg-emerald-500'
  if (risk <= 6) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getRiskTextColor(risk: number): string {
  if (risk <= 3) return 'text-emerald-400'
  if (risk <= 6) return 'text-yellow-400'
  return 'text-red-400'
}

function RecommendationCard({ rec, index }: { rec: AIRecommendation; index: number }) {
  const config = ACTION_CONFIG[rec.action] || ACTION_CONFIG.SKIP

  return (
    <div
      className={`border ${config.border} ${config.bg} rounded-lg p-4 animate-slideIn`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-bold tracking-wider px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
          {config.label}
        </span>
        <span className="text-[10px] text-gray-500 font-mono">{rec.signalId}</span>
      </div>

      <p className="text-sm text-gray-300 mb-3 leading-relaxed">{rec.reason}</p>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Risk</span>
            <span className={`text-xs font-mono font-bold ${getRiskTextColor(rec.risk)}`}>
              {rec.risk}/10
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${getRiskColor(rec.risk)}`}
              style={{ width: `${(rec.risk / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AIRecommendation({ recommendations }: AIRecommendationProps) {
  const sorted = useMemo(
    () => [...recommendations].reverse(),
    [recommendations]
  )

  const lastTen = useMemo(() => recommendations.slice(0, 10), [recommendations])

  const breakdown = useMemo(() => {
    const counts: Record<string, number> = { EXECUTE: 0, REDUCE_STAKE: 0, SKIP: 0, AVOID: 0 }
    lastTen.forEach((r) => {
      counts[r.action] = (counts[r.action] || 0) + 1
    })
    return counts
  }, [lastTen])

  const performance = useMemo(() => {
    if (lastTen.length === 0) return 0
    const positive = lastTen.filter((r) => r.action === 'EXECUTE').length
    return Math.round((positive / lastTen.length) * 100)
  }, [lastTen])

  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin mb-3" />
        <p className="text-sm italic">AI is analyzing markets...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
            AI Recommendations
          </h3>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {Object.entries(breakdown).map(([action, count]) => {
            const cfg = ACTION_CONFIG[action]
            return (
              <div key={action} className={`text-center py-1.5 rounded ${cfg.bg}`}>
                <div className={`text-lg font-bold font-mono ${cfg.color}`}>{count}</div>
                <div className="text-[9px] text-gray-500 uppercase">{cfg.label}</div>
              </div>
            )
          })}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">AI Accuracy</span>
          <span className={`text-sm font-bold font-mono ${performance >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
            {performance}%
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {sorted.map((rec, i) => (
          <RecommendationCard key={rec.signalId} rec={rec} index={i} />
        ))}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #1a1a2e;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 2px;
        }
      `}</style>
    </div>
  )
}
