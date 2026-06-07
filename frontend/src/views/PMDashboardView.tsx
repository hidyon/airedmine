import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { fetchBurndown } from '../api/client'
import type { BurndownResponse } from '../api/client'

const DAY_OPTIONS = [14, 30, 60] as const
type Days = typeof DAY_OPTIONS[number]

export default function PMDashboardView() {
  const [days, setDays] = useState<Days>(14)
  const [data, setData] = useState<BurndownResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchBurndown(days)
      .then(setData)
      .catch(e => setError(String(e.message ?? e)))
      .finally(() => setLoading(false))
  }, [days])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 m-0">バーンダウンチャート</h2>
          {data && (
            <p className="text-xs text-slate-500 mt-1 m-0">
              起点 issue 数: {data.baseline} 件
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {DAY_OPTIONS.map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                days === d
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
              }`}
            >
              {d}日
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64 text-sm text-slate-400">
          読み込み中…
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center h-64 text-sm text-red-500">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={data.series} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={d => d.slice(5)}
              />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                formatter={(value: number, name: string) => [
                  `${value} 件`,
                  name === 'open' ? '実績 (open)' : '理想線',
                ]}
                labelFormatter={l => `${l}`}
              />
              <Legend
                formatter={(value) => value === 'open' ? '実績 (open)' : '理想線'}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="ideal"
                stroke="#cbd5e1"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="open"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>

          <p className="text-[11px] text-slate-400 text-center mt-3 m-0">
            実績線が理想線を上回っている場合、消化ペースが計画より遅れています。
            close 日は Redmine の最終更新日を使用しています。
          </p>
        </div>
      )}
    </div>
  )
}
