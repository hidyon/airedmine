import { useEffect, useState } from 'react'
import { fetchIssues } from '../api/client'
import type { Issue } from '../api/types'

export default function PMView() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIssues({ status_id: 'open', limit: 100, sort: 'updated_on:desc' })
      .then(res => setIssues(res.issues))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  const pmIssues = issues.filter(i =>
    ['pm判断', '判断待ち', '確認待ち', '承認'].some(kw => i.subject.includes(kw)),
  )
  const stale = issues.filter(i => daysAgo(i.updated_on) >= 5)
  const high = issues.filter(i => {
    const p = (i.priority?.name ?? '').toLowerCase()
    return p.includes('high') || p.includes('urgent')
  })

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-lg font-bold text-slate-800 mb-6 m-0">PM Overview</h2>

      {loading && <p className="text-sm text-slate-400">読み込み中…</p>}

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            title="PM 判断待ち"
            count={pmIssues.length}
            issues={pmIssues.slice(0, 5)}
            headerClass="bg-blue-50 border-blue-100"
            countClass="text-blue-500"
          />
          <SummaryCard
            title="停滞 (5日超)"
            count={stale.length}
            issues={stale.slice(0, 5)}
            headerClass="bg-amber-50 border-amber-100"
            countClass="text-amber-600"
          />
          <SummaryCard
            title="高優先度"
            count={high.length}
            issues={high.slice(0, 5)}
            headerClass="bg-red-50 border-red-100"
            countClass="text-red-500"
          />
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  title,
  count,
  issues,
  headerClass,
  countClass,
}: {
  title: string
  count: number
  issues: Issue[]
  headerClass: string
  countClass: string
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className={`flex justify-between items-center px-4 py-3 border-b ${headerClass}`}>
        <span className="text-[13px] font-semibold text-slate-700">{title}</span>
        <span className={`text-2xl font-bold ${countClass}`}>{count}</span>
      </div>
      <ul className="py-2 m-0 list-none p-0">
        {issues.map(i => (
          <li key={i.id} className="flex items-baseline gap-2 px-4 py-1.5">
            <span className="text-xs font-semibold text-blue-500 shrink-0">#{i.id}</span>
            <span className="text-[13px] text-slate-700 truncate">{i.subject}</span>
          </li>
        ))}
        {issues.length === 0 && (
          <li className="px-4 py-2 text-[13px] text-slate-400">なし</li>
        )}
      </ul>
    </div>
  )
}

function daysAgo(value: string | null): number {
  if (!value) return 0
  try {
    return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000))
  } catch {
    return 0
  }
}
