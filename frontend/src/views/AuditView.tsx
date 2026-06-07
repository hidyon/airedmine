import { useEffect, useState } from 'react'
import { fetchProposalLogs } from '../api/client'
import type { UpdateLog } from '../api/types'

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
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-lg font-bold text-slate-800 mb-1 m-0">更新ログ</h2>
      <p className="text-[13px] text-slate-500 mb-6 m-0">Redmine への更新提案の実行履歴（直近 20 件）</p>

      {loading && <p className="text-sm text-slate-400">読み込み中…</p>}

      {!loading && logs.length === 0 && (
        <p className="text-sm text-slate-400">
          まだ更新ログがありません。Chat から更新提案を実行すると記録されます。
        </p>
      )}

      {!loading && logs.length > 0 && (
        <div className="flex flex-col gap-3">
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
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  const ok = log.result === 'success'

  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg px-4 py-3 border-l-4 ${
        ok ? 'border-l-emerald-500' : 'border-l-red-400'
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {ok ? '成功' : '失敗'}
        </span>
        <span className="text-xs text-slate-400">{ts}</span>
        <span className="text-xs text-slate-500">{log.actor}</span>
      </div>
      <div className="flex flex-wrap gap-2 items-baseline">
        <span className="text-[13.5px] font-semibold text-slate-800">{log.target_title}</span>
        <span className="text-[13px] text-slate-500">{log.message}</span>
      </div>
      {log.draft && (
        <pre className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-md px-3 py-2 whitespace-pre-wrap break-words font-sans m-0">
          {log.draft}
        </pre>
      )}
    </div>
  )
}
