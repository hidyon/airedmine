import { useEffect, useState } from 'react'
import { fetchIssues } from '../api/client'
import type { Issue } from '../api/types'
import styles from './DeveloperDashboardView.module.css'

export default function DeveloperDashboardView() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchIssues({ assigned_to_id: 'me', status_id: 'open', limit: 100, sort: 'updated_on:desc' })
      .then(res => { setIssues(res.issues); setTotal(res.total_count) })
      .catch(e => setError(String(e.message ?? e)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.heading}>担当 Issue 一覧</h2>
        {!loading && <span className={styles.count}>{total} 件</span>}
      </div>

      {loading && <p className={styles.state}>読み込み中…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && (
        <div className={styles.list}>
          {issues.map(issue => (
            <IssueRow key={issue.id} issue={issue} />
          ))}
          {issues.length === 0 && <p className={styles.state}>該当する issue がありません。</p>}
        </div>
      )}
    </div>
  )
}

function IssueRow({ issue }: { issue: Issue }) {
  const status = issue.status?.name ?? '—'
  const priority = issue.priority?.name ?? '—'
  const assignee = issue.assigned_to?.name ?? '未割り当て'

  return (
    <div className={styles.row}>
      <span className={styles.issueId}>#{issue.id}</span>
      <span className={styles.subject}>{issue.subject}</span>
      <span className={`${styles.badge} ${priorityClass(priority)}`}>{priority}</span>
      <span className={styles.status}>{status}</span>
      <span className={styles.assignee}>{assignee}</span>
    </div>
  )
}

function priorityClass(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('high') || n.includes('urgent') || n.includes('immediate')) return styles.badgeHigh
  if (n.includes('low')) return styles.badgeLow
  return styles.badgeNormal
}
