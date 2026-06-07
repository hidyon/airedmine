import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { fetchBurndown, fetchPmStats } from '../api/client'
import type { BurndownResponse, PmStatsResponse, StallItem, OverdueItem } from '../api/client'
import IssueDetailPanel from '../components/IssueDetailPanel'

const DAY_OPTIONS = [14, 30, 60] as const
type Days = typeof DAY_OPTIONS[number]

const PRIORITY_COLOR: Record<string, string> = {
  Urgent: 'bg-red-100 text-red-700 border-red-200',
  High: 'bg-orange-100 text-orange-700 border-orange-200',
  Normal: 'bg-blue-100 text-blue-700 border-blue-200',
  Low: 'bg-green-100 text-green-700 border-green-200',
}

export default function PMDashboardView() {
  const [days, setDays] = useState<Days>(14)
  const [burndown, setBurndown] = useState<BurndownResponse | null>(null)
  const [burndownLoading, setBurndownLoading] = useState(true)
  const [burndownError, setBurndownError] = useState<string | null>(null)

  const [stats, setStats] = useState<PmStatsResponse | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    setBurndownLoading(true)
    setBurndownError(null)
    fetchBurndown(days)
      .then(setBurndown)
      .catch(e => setBurndownError(String(e.message ?? e)))
      .finally(() => setBurndownLoading(false))
  }, [days])

  useEffect(() => {
    setStatsLoading(true)
    setStatsError(null)
    fetchPmStats()
      .then(setStats)
      .catch(e => setStatsError(String(e.message ?? e)))
      .finally(() => setStatsLoading(false))
  }, [])

  function selectIssue(id: number) {
    setSelectedId(prev => (prev === id ? null : id))
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 min-w-0">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">

          {/* Burndown chart */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold text-slate-800 m-0">バーンダウンチャート</h2>
                {burndown && (
                  <p className="text-xs text-slate-500 mt-0.5 m-0">起点 issue 数: {burndown.baseline} 件</p>
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

            {burndownLoading && (
              <div className="flex items-center justify-center h-48 text-sm text-slate-400">読み込み中…</div>
            )}
            {burndownError && (
              <div className="flex items-center justify-center h-48 text-sm text-red-500">{burndownError}</div>
            )}
            {!burndownLoading && !burndownError && burndown && (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={burndown.series} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
                    />
                    <Legend
                      formatter={v => v === 'open' ? '実績 (open)' : '理想線'}
                      wrapperStyle={{ fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="ideal" stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                    <Line type="monotone" dataKey="open" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-[11px] text-slate-400 text-center mt-2 m-0">
                  実績線が理想線を上回ると消化ペースが遅れています。close 日は最終更新日で代用しています。
                </p>
              </>
            )}
          </section>

          {/* Stats panels */}
          {statsLoading && (
            <div className="text-sm text-slate-400 text-center py-4">統計データ読み込み中…</div>
          )}
          {statsError && (
            <div className="text-sm text-red-500 text-center py-4">{statsError}</div>
          )}
          {!statsLoading && !statsError && stats && (
            <>
              {/* Row 1: 停滞 + 期限切れ */}
              <div className="grid grid-cols-2 gap-4">
                <IssueListPanel
                  title="停滞 Issue 一覧"
                  subtitle="7 日以上更新なし"
                  items={stats.stalled.map(i => ({
                    id: i.id,
                    subject: i.subject,
                    meta: `最終更新: ${i.updated_on}`,
                    assignee: i.assignee,
                  }))}
                  emptyText="停滞 issue はありません"
                  selectedId={selectedId}
                  onSelect={selectIssue}
                  accentColor="amber"
                />
                <IssueListPanel
                  title="期限切れ Issue"
                  subtitle="due_date が過去"
                  items={stats.overdue.map(i => ({
                    id: i.id,
                    subject: i.subject,
                    meta: `期日: ${i.due_date}`,
                    assignee: i.assignee,
                  }))}
                  emptyText="期限切れ issue はありません"
                  selectedId={selectedId}
                  onSelect={selectIssue}
                  accentColor="red"
                />
              </div>

              {/* Row 2: 担当者別負荷 + (優先度 + 今週) */}
              <div className="grid grid-cols-5 gap-4">
                {/* 担当者別負荷 (col-span-3) */}
                <section className="col-span-3 bg-white border border-slate-200 rounded-2xl p-5">
                  <h3 className="text-[13.5px] font-semibold text-slate-700 mb-4 m-0">担当者別 Open Issue 数</h3>
                  {stats.assignee_load.length === 0 ? (
                    <p className="text-sm text-slate-400">データなし</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={Math.max(120, stats.assignee_load.length * 40)}>
                      <BarChart layout="vertical" data={stats.assignee_load} margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12, fill: '#475569' }} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                          formatter={(v: number) => [`${v} 件`, '件数']}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </section>

                {/* 右列: 優先度 + 今週クローズ */}
                <div className="col-span-2 flex flex-col gap-4">
                  {/* 優先度サマリー */}
                  <section className="bg-white border border-slate-200 rounded-2xl p-5 flex-1">
                    <h3 className="text-[13.5px] font-semibold text-slate-700 mb-3 m-0">優先度サマリー</h3>
                    {stats.priority_summary.length === 0 ? (
                      <p className="text-sm text-slate-400">データなし</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {stats.priority_summary.map(p => (
                          <div key={p.name} className="flex items-center justify-between">
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${PRIORITY_COLOR[p.name] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {p.name}
                            </span>
                            <span className="text-sm font-bold text-slate-700">{p.count} 件</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* 今週のクローズ数 */}
                  <section className="bg-white border border-slate-200 rounded-2xl p-5">
                    <h3 className="text-[13.5px] font-semibold text-slate-700 mb-1 m-0">今週のクローズ数</h3>
                    <p className="text-[11px] text-slate-400 mb-3 m-0">直近 7 日間（更新日で代用）</p>
                    <p className="text-4xl font-bold text-blue-500 m-0 leading-none">
                      {stats.closed_this_week}
                      <span className="text-sm font-normal text-slate-400 ml-1">件</span>
                    </p>
                  </section>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <IssueDetailPanel issueId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

interface ListItem {
  id: number
  subject: string
  meta: string
  assignee: string | null
}

function IssueListPanel({
  title,
  subtitle,
  items,
  emptyText,
  selectedId,
  onSelect,
  accentColor,
}: {
  title: string
  subtitle: string
  items: ListItem[]
  emptyText: string
  selectedId: number | null
  onSelect: (id: number) => void
  accentColor: 'amber' | 'red'
}) {
  const dot = accentColor === 'amber' ? 'bg-amber-400' : 'bg-red-400'
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-baseline gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${dot}`} />
        <div>
          <h3 className="text-[13.5px] font-semibold text-slate-700 m-0">{title}</h3>
          <p className="text-[11px] text-slate-400 m-0">{subtitle}</p>
        </div>
        <span className="ml-auto text-xs font-semibold text-slate-500">{items.length} 件</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400 py-2">{emptyText}</p>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`w-full text-left rounded-lg px-3 py-2 transition-colors cursor-pointer ${
                selectedId === item.id
                  ? 'bg-blue-50 border border-blue-300'
                  : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <div className="flex items-baseline gap-1.5">
                <span className="text-blue-500 text-xs font-semibold flex-shrink-0">#{item.id}</span>
                <span className="text-[12.5px] text-slate-700 truncate">{item.subject}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-slate-400">{item.meta}</span>
                {item.assignee && (
                  <span className="text-[11px] text-slate-400">· {item.assignee}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
