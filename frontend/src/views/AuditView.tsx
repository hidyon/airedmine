import { useEffect, useState } from 'react'
import { fetchProposalLogs } from '../api/client'
import type { UpdateLog } from '../api/types'
import styles from './AuditView.module.css'

export default function AuditView() {
  const [logs, setLogs] = useState<UpdateLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProposalLogs()
      .then(res => setLogs(res.logs))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={styles.root}>
      <h2 className={styles.heading}>更新ログ</h2>
      <p className={styles.desc}>Redmine への更新提案の実行履歴（直近 20 件）</p>

      {loading && <p className={styles.state}>読み込み中…</p>}

      {!loading && logs.length === 0 && (
        <p className={styles.state}>まだ更新ログがありません。Chat から更新提案を実行すると記録されます。</p>
      )}

      {!loading && logs.length > 0 && (
        <div className={styles.list}>
          {logs.map(log => (
            <LogRow key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  )
}

function LogRow({ log }: { log: UpdateLog }) {
  const ts = new Date(log.created_at).toLocaleString('ja-JP', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className={`${styles.row} ${log.result === 'success' ? styles.rowSuccess : styles.rowFailure}`}>
      <div className={styles.rowMeta}>
        <span className={`${styles.badge} ${log.result === 'success' ? styles.badgeOk : styles.badgeErr}`}>
          {log.result === 'success' ? '成功' : '失敗'}
        </span>
        <span className={styles.ts}>{ts}</span>
        <span className={styles.actor}>{log.actor}</span>
      </div>
      <div className={styles.rowBody}>
        <span className={styles.target}>{log.target_title}</span>
        <span className={styles.message}>{log.message}</span>
      </div>
      {log.draft && <pre className={styles.draft}>{log.draft}</pre>}
    </div>
  )
}
