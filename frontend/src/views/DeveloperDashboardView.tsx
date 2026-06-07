import { useEffect, useState } from 'react'
import { fetchIssues } from '../api/client'
import type { Issue } from '../api/types'
import IssueDetailPanel from '../components/IssueDetailPanel'

export default function DeveloperDashboardView() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    fetchIssues({ assigned_to_id: 'me', status_id: 'open', limit: 100, sort: 'updated_on:desc' })
      .then(res => { setIssues(res.issues); setTotal(res.total_count) })
      .catch(e => setError(String(e.message ?? e)))
      .finally(() => setLoading(false))
  }, [])

  function selectIssue(id: number) {
    setSelectedId(prev => (prev === id ? null : id))
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Issue list */}
      <div className="flex-1 overflow-y-auto p-6 min-w-0">
        <div className="flex items-baseline gap-3 mb-5">
          <h2 className="text-lg font-bold text-slate-800 m-0">担当 Issue 一覧</h2>
          {!loading && <span className="text-sm text-slate-500">{total} 件</span>}
        </div>

        {loading && <p className="text-sm text-slate-400">読み込み中…</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="flex flex-col gap-2">
            {issues.map(issue => (
              <IssueRow
                key={issue.id}
                issue={issue}
                selected={issue.id === selectedId}
                onClick={() => selectIssue(issue.id)}
              />
            ))}
            {issues.length === 0 && (
              <p className="text-sm text-slate-400 py-6">該当する issue がありません。</p>
            )}
          </div>
        )}
      </div>

      {/* Detail panel */}
      <IssueDetailPanel issueId={selectedId} onClose={() => setSelectedId(null)} />
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

function IssueRow({
  issue,
  selected,
  onClick,
}: {
  issue: Issue
  selected: boolean
  onClick: () => void
}) {
  const priority = issue.priority?.name ?? '—'
  return (
    <button
      onClick={onClick}
      className={`w-full text-left grid items-center gap-3 border rounded-lg px-4 py-3 text-[13.5px] transition-colors cursor-pointer ${
        selected
          ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200'
          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
      }`}
      style={{ gridTemplateColumns: '64px 1fr 88px 108px 128px' }}
    >
      <span className="text-blue-500 font-semibold">#{issue.id}</span>
      <span className="text-slate-800 truncate">{issue.subject}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border text-center ${priorityClass(priority)}`}>
        {priority}
      </span>
      <span className="text-slate-500 text-[13px]">{issue.status?.name ?? '—'}</span>
      <span className="text-slate-400 text-[13px] truncate">{issue.assigned_to?.name ?? '未割り当て'}</span>
    </button>
  )
}
