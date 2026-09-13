'use client'

import { useEffect, useRef, useState, useMemo } from 'react'

interface LogEntry {
  time: string
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
}

interface ConnectionLogProps {
  logs: LogEntry[]
  onClear: () => void
}

const TYPE_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  info: { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: '●' },
  success: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: '✓' },
  error: { color: 'text-red-400', bg: 'bg-red-500/10', icon: '✕' },
  warning: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: '▲' },
}

const FILTER_OPTIONS = ['All', 'Info', 'Success', 'Error', 'Warning'] as const

function LogLine({ entry, index }: { entry: LogEntry; index: number }) {
  const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.info

  return (
    <div
      className={`flex items-start gap-2 px-3 py-1.5 border-l-2 ${config.border || 'border-transparent'} hover:bg-white/5 transition-colors animate-logEntry`}
      style={{ animationDelay: `${index * 20}ms` }}
    >
      <span className="text-[10px] text-gray-600 font-mono whitespace-nowrap mt-0.5 select-none">
        {entry.time}
      </span>
      <span className={`${config.color} text-xs mt-0.5 select-none flex-shrink-0`}>
        {config.icon}
      </span>
      <span className="text-xs text-gray-300 font-mono break-all leading-relaxed">
        {entry.message}
      </span>
    </div>
  )
}

export default function ConnectionLog({ logs, onClear }: ConnectionLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [filter, setFilter] = useState<string>('All')

  const filteredLogs = useMemo(() => {
    if (filter === 'All') return logs
    const key = filter.toLowerCase() as LogEntry['type']
    return logs.filter((l) => l.type === key)
  }, [logs, filter])

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [filteredLogs, autoScroll])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const atBottom = scrollHeight - scrollTop - clientHeight < 30
    setAutoScroll(atBottom)
  }

  return (
    <div className="flex flex-col h-full bg-black rounded-lg border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 bg-gray-950">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Connection Log
          </h3>
          <span className="text-[10px] text-gray-600 font-mono">({filteredLogs.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-0.5 text-[10px] rounded font-mono transition-colors ${
              autoScroll
                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
            }`}
          >
            {autoScroll ? 'SCROLLING' : 'PAUSED'}
          </button>
          <button
            onClick={onClear}
            className="px-2 py-0.5 text-[10px] rounded font-mono bg-gray-800 text-gray-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
          >
            CLEAR
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-900 bg-gray-950/50">
        {FILTER_OPTIONS.map((opt) => {
          const isActive = filter === opt
          const cfg = opt !== 'All' ? TYPE_CONFIG[opt.toLowerCase()] : null
          return (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`px-2 py-0.5 text-[10px] rounded font-mono transition-colors ${
                isActive
                  ? opt === 'All'
                    ? 'bg-gray-700 text-gray-200'
                    : `${cfg?.bg} ${cfg?.color}`
                  : 'text-gray-600 hover:text-gray-400 hover:bg-gray-800/50'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 max-h-96 scrollbar-thin"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-700 text-xs font-mono italic">
            Waiting for activity...
          </div>
        ) : (
          filteredLogs.map((entry, i) => (
            <LogLine key={`${entry.time}-${i}`} entry={entry} index={i} />
          ))
        )}
      </div>

      <style jsx>{`
        @keyframes logEntry {
          from {
            opacity: 0;
            transform: translateX(-4px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-logEntry {
          animation: logEntry 0.2s ease-out forwards;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #000;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #222;
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #333;
        }
      `}</style>
    </div>
  )
}
