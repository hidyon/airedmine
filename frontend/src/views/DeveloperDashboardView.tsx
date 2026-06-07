import { useEffect, useState } from 'react'
import { fetchIssues } from '../api/client'
import type { Issue } from '../api/types'
import IssueDetailPanel from '../components/IssueDetailPanel'
import { getUser } from '../auth'

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000

function isStalled(issue: Issue): boolean {
  if (!issue.updated_on) return false
  return Date.now() - new Date(issue.updated_on).getTime() >= FIVE_DAYS_MS
}

function isHighPriority(issue: Issue): boolean {
  const name = (issue.priority?.name ?? '').toLowerCase()
  return name.includes('high') || name.includes('urgent')
}

export default function DeveloperDashboardView() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const user = getUser()

  useEffect(() => {
    if (!user?.redmine_user_id) {
      setLoading(false)
      return
    }
    fetchIssues({
      assigned_to_id: String(user.redmine_user_id),
      status_id: 'open',
      limit: 100,
      sort: 'updated_on:asc',
    })
      .then(res => setIssues(res.issues))
      .catch(e => setError(String(e.message ?? e)))
      .finally(() => setLoading(false))
  }, [])

  const blockers = issues.filter(isStalled)
  const highPriority = issues.filter(i => !isStalled(i) && isHighPriority(i))
  const others = issues.filter(i => !isStalled(i) && !isHighPriority(i))

  function selectIssue(id: number) {
    setSelectedId(prev => (prev === id ? null : id))
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 min-w-0">
        <h2 className="text-lg font-bold text-slate-800 mb-5 m-0">担当 Issue</h2>

        {loading && <p className="text-sm text-slate-400">読み込み中…</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!loading && !error && !user?.redmine_user_id && (
          <p className="text-sm text-slate-400">ユーザー情報が取得できませんでした。</p>
        )}

        {!loading && !error && user?.redmine_user_id && (
          <div className="flex flex-col gap-6 max-w-3xl">
            <Section
              title="ブロッカー"
              subtitle="5 日以上更新なし"
              issues={blockers}
              selectedId={selectedId}
              onSelect={selectIssue}
              dotColor="bg-red-400"
            />
            <Section
              title="優先度 High 以上"
              subtitle="Urgent または High"
              issues={highPriority}
              selectedId={selectedId}
              onSelect={selectIssue}
              dotColor="bg-orange-400"
            />
            <Section
              title="その他"
              issues={others}
              selectedId={selectedId}
              onSelect={selectIssue}
              dotColor="bg-slate-300"
            />
          </div>
        )}
      </div>

      <IssueDetailPanel issueId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

function Section({
  title,
  subtitle,
  issues,
  selectedId,
  onSelect,
  dotColor,
}: {
  title: string
  subtitle?: string
  issues: Issue[]
  selectedId: number | null
  onSelect: (id: number) => void
  dotColor: string
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${dotColor}`} />
        <span className="text-[13.5px] font-semibold text-slate-700">{title}</span>
        {subtitle && <span className="text-[11px] text-slate-400">— {subtitle}</span>}
        <span className="ml-auto text-xs font-semibold text-slate-500">{issues.length} 件</span>
      </div>

      {issues.length === 0 ? (
        <p className="text-sm text-slate-400 pl-4 py-1">なし</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {issues.map(issue => (
            <IssueRow
              key={issue.id}
              issue={issue}
              selected={issue.id === selectedId}
              onClick={() => onSelect(issue.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function priorityClass(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('urgent')) return 'bg-red-50 text-red-600 border-red-200'
  if (n.includes('high')) return 'bg-orange-50 text-orange-600 border-orange-200'
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
      style={{ gridTemplateColumns: '52px 1fr 72px 96px 120px' }}
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
