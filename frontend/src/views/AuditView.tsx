import { useEffect, useState } from 'react'
import { fetchProposalLogs } from '../api/client'
import type { UpdateLog } from '../api/types'

const ACTION_LABELS: Record<string, string> = {
  comment: 'コメント',
  create_issue: 'issue 作成',
  status_change: 'ステータス変更',
  assignee_change: '担当者変更',
  due_date: '期日変更',
  priority: '優先度変更',
  done_ratio: '進捗率更新',
  version: 'バージョン割当',
  add_relation: '関連付け',
}

export default function AuditView() {
  const [logs, setLogs] = useState<UpdateLog[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')
  const [resultFilter, setResultFilter] = useState('')
  const [issueFilter, setIssueFilter] = useState('')

  useEffect(() => {
    fetchProposalLogs()
      .then(res => setLogs(res.logs))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  const actions = Array.from(new Set(logs.map(log => log.action))).sort()
  const normalizedIssueFilter = issueFilter.trim().replace(/^#/, '')
  const filteredLogs = logs.filter(log => {
    if (actionFilter && log.action !== actionFilter) return false
    if (resultFilter && log.result !== resultFilter) return false
    if (normalizedIssueFilter && String(log.issue_id) !== normalizedIssueFilter) return false
    return true
  })
  const hasFilters = !!actionFilter || !!resultFilter || !!normalizedIssueFilter

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-lg font-bold text-slate-800 mb-1 m-0">更新ログ</h2>
      <p className="text-[13px] text-slate-500 mb-6 m-0">Redmine への更新提案の実行履歴（直近 20 件）</p>

      {loading && <p className="text-sm text-slate-400">読み込み中…</p>}

      {!loading && logs.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(160px,1fr)_minmax(140px,0.8fr)_minmax(120px,0.7fr)_auto] gap-3 items-end">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-500">操作種別</span>
              <select
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                className="h-9 border border-slate-200 rounded-md px-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="">すべて</option>
                {actions.map(action => (
                  <option key={action} value={action}>{ACTION_LABELS[action] ?? action}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-500">結果</span>
              <select
                value={resultFilter}
                onChange={e => setResultFilter(e.target.value)}
                className="h-9 border border-slate-200 rounded-md px-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="">すべて</option>
                <option value="success">成功</option>
                <option value="failure">失敗</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-500">issue_id</span>
              <input
                value={issueFilter}
                onChange={e => setIssueFilter(e.target.value)}
                inputMode="numeric"
                placeholder="#1208"
                className="h-9 border border-slate-200 rounded-md px-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </label>
            <button
              onClick={() => {
                setActionFilter('')
                setResultFilter('')
                setIssueFilter('')
              }}
              disabled={!hasFilters}
              className="h-9 px-3 text-xs font-semibold border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 disabled:text-slate-300 disabled:bg-slate-50 disabled:cursor-not-allowed cursor-pointer"
            >
              クリア
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 mb-0">
            {filteredLogs.length} / {logs.length} 件を表示
          </p>
        </div>
      )}

      {!loading && logs.length === 0 && (
        <p className="text-sm text-slate-400">
          まだ更新ログがありません。Chat から更新提案を実行すると記録されます。
        </p>
      )}

      {!loading && logs.length > 0 && filteredLogs.length === 0 && (
        <p className="text-sm text-slate-400">
          条件に一致する更新ログはありません。
        </p>
      )}

      {!loading && filteredLogs.length > 0 && (
        <div className="flex flex-col gap-3">
          {filteredLogs.map(log => (
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
        <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          {ACTION_LABELS[log.action] ?? log.action}
        </span>
        <span className="text-xs text-slate-400">{ts}</span>
        <span className="text-xs text-slate-500">{log.actor}</span>
        {log.issue_id > 0 && <span className="text-xs text-slate-400">#{log.issue_id}</span>}
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
      {!ok && (log.category || log.retryable != null) && (
        <div className="flex flex-wrap gap-2 mt-2">
          {log.category && (
            <span className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-full px-2 py-0.5">
              {log.category}
            </span>
          )}
          {log.retryable != null && (
            <span className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5">
              {log.retryable ? '再試行可' : '再試行不可'}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
