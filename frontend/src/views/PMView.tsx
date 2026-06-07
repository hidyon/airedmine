import { useEffect, useState } from 'react'
import { fetchIssues } from '../api/client'
import type { Issue } from '../api/types'
import styles from './PMView.module.css'

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
    <div className={styles.root}>
      <h2 className={styles.heading}>PM Overview</h2>

      {loading && <p className={styles.state}>読み込み中…</p>}

      {!loading && (
        <div className={styles.grid}>
          <SummaryCard title="PM 判断待ち" count={pmIssues.length} issues={pmIssues.slice(0, 5)} color="blue" />
          <SummaryCard title="停滞 (5日超)" count={stale.length} issues={stale.slice(0, 5)} color="amber" />
          <SummaryCard title="高優先度" count={high.length} issues={high.slice(0, 5)} color="red" />
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  title,
  count,
  issues,
  color,
}: {
  title: string
  count: number
  issues: Issue[]
  color: 'blue' | 'amber' | 'red'
}) {
  return (
    <div className={`${styles.card} ${styles['card_' + color]}`}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>{title}</span>
        <span className={styles.cardCount}>{count}</span>
      </div>
      <ul className={styles.cardList}>
        {issues.map(i => (
          <li key={i.id} className={styles.cardItem}>
            <span className={styles.cardId}>#{i.id}</span>
            <span className={styles.cardSubject}>{i.subject}</span>
          </li>
        ))}
        {issues.length === 0 && <li className={styles.cardEmpty}>なし</li>}
      </ul>
    </div>
  )
}

function daysAgo(value: string | null): number {
  if (!value) return 0
  try {
    const dt = new Date(value)
    return Math.max(0, Math.floor((Date.now() - dt.getTime()) / 86_400_000))
  } catch {
    return 0
  }
}
