import { useEffect, useState } from 'react'
import { fetchIssues } from '../api/client'
import type { Issue } from '../api/types'

export default function DeveloperDashboardView() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchIssues({ assigned_to_id: 'me', status_id: 'open', limit: 100, sort: 'updated_on:desc' })
      .then(res => {
        setIssues(res.issues)
        setTotal(res.total_count)
      })
      .catch(e => setError(String(e.message ?? e)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-baseline gap-3 mb-5">
        <h2 className="text-lg font-bold text-slate-800 m-0">担当 Issue 一覧</h2>
        {!loading && <span className="text-sm text-slate-500">{total} 件</span>}
      </div>

      {loading && <p className="text-sm text-slate-400">読み込み中…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="flex flex-col gap-2">
          {issues.map(issue => (
            <IssueRow key={issue.id} issue={issue} />
          ))}
          {issues.length === 0 && (
            <p className="text-sm text-slate-400 py-6">該当する issue がありません。</p>
          )}
        </div>
      )}
    </div>
  )
}

function priorityClass(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('high') || n.includes('urgent') || n.includes('immediate')) {
    return 'bg-red-50 text-red-600 border-red-200'
  }
  if (n.includes('low')) return 'bg-green-50 text-green-600 border-green-200'
  return 'bg-slate-100 text-slate-500 border-slate-200'
}

function IssueRow({ issue }: { issue: Issue }) {
  const priority = issue.priority?.name ?? '—'
  return (
    <div className="grid items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-3 text-[13.5px]"
      style={{ gridTemplateColumns: '64px 1fr 88px 108px 128px' }}>
      <span className="text-blue-500 font-semibold">#{issue.id}</span>
      <span className="text-slate-800 truncate">{issue.subject}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border text-center ${priorityClass(priority)}`}>
        {priority}
      </span>
      <span className="text-slate-500 text-[13px]">{issue.status?.name ?? '—'}</span>
      <span className="text-slate-400 text-[13px] truncate">{issue.assigned_to?.name ?? '未割り当て'}</span>
    </div>
  )
}
