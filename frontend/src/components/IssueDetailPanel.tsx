import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchIssueDetail } from '../api/client'
import type { IssueDetail } from '../api/types'

interface Props {
  issueId: number | null
  onClose: () => void
}

export default function IssueDetailPanel({ issueId, onClose }: Props) {
  const [detail, setDetail] = useState<IssueDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (issueId == null) { setDetail(null); return }
    setLoading(true)
    setError(null)
    fetchIssueDetail(issueId)
      .then(setDetail)
      .catch(e => setError(String(e.message ?? e)))
      .finally(() => setLoading(false))
  }, [issueId])

  if (issueId == null) return null

  function openChat() {
    if (issueId == null) return
    const subject = detail?.subject ? ` ${detail.subject}` : ''
    const draft = `#${issueId}${subject}について、背景と次アクションを教えて`
    const params = new URLSearchParams({ issue_id: String(issueId), draft })
    navigate(`/developer/chat?${params.toString()}`)
  }

  return (
    <div className="w-96 flex-shrink-0 border-l border-slate-200 bg-white flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 flex-shrink-0">
        <span className="text-sm font-semibold text-slate-700">
          {detail ? `#${detail.id} 詳細` : `#${issueId} 読み込み中…`}
        </span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none cursor-pointer"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
        <button
          type="button"
          onClick={openChat}
          className="w-full px-3 py-2 text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
        >
          Chat で相談
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="px-4 py-6 text-sm text-slate-400">読み込み中…</div>
        )}
        {error && (
          <div className="px-4 py-6 text-sm text-red-500">{error}</div>
        )}
        {!loading && !error && detail && <DetailContent detail={detail} />}
      </div>
    </div>
  )
}

function DetailContent({ detail }: { detail: IssueDetail }) {
  const journals = detail.journals.filter(j => j.notes.trim())

  return (
    <div className="flex flex-col">
      {/* Header info */}
      <div className="px-4 py-4 border-b border-slate-100">
        <p className="text-[13.5px] font-semibold text-slate-800 leading-snug mb-3">
          {detail.subject}
        </p>
        <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-[12px]">
          <MetaRow label="トラッカー" value={detail.tracker?.name} />
          <MetaRow label="ステータス" value={detail.status?.name} />
          <MetaRow label="優先度" value={detail.priority?.name} color={priorityColor(detail.priority?.name)} />
          <MetaRow label="担当者" value={detail.assigned_to?.name ?? '未割り当て'} />
          <MetaRow label="プロジェクト" value={detail.project?.name} />
          <MetaRow label="バージョン" value={detail.fixed_version?.name} />
          {detail.due_date && <MetaRow label="期日" value={detail.due_date} />}
          {detail.updated_on && <MetaRow label="更新日時" value={formatDate(detail.updated_on)} />}
        </div>
      </div>

      {/* Description */}
      {detail.description && (
        <div className="px-4 py-4 border-b border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">説明</p>
          <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
            {detail.description}
          </p>
        </div>
      )}

      {/* Journals */}
      <div className="px-4 py-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          コメント履歴 ({journals.length})
        </p>
        {journals.length === 0 && (
          <p className="text-[12px] text-slate-400">コメントはありません。</p>
        )}
        <div className="flex flex-col gap-3">
          {journals.map(j => (
            <div key={j.id} className="border border-slate-100 rounded-lg px-3 py-2.5">
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-[12px] font-semibold text-slate-600">
                  {j.user?.name ?? '不明'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {j.created_on ? formatDate(j.created_on) : ''}
                </span>
              </div>
              <p className="text-[12.5px] text-slate-700 leading-relaxed whitespace-pre-wrap break-words m-0">
                {j.notes}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MetaRow({ label, value, color }: { label: string; value?: string | null; color?: string }) {
  return (
    <>
      <span className="text-slate-400">{label}</span>
      <span className={`font-medium ${color ?? 'text-slate-700'}`}>{value ?? '—'}</span>
    </>
  )
}

function priorityColor(name?: string | null): string {
  const n = (name ?? '').toLowerCase()
  if (n.includes('high') || n.includes('urgent')) return 'text-red-600'
  if (n.includes('low')) return 'text-green-600'
  return 'text-slate-700'
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ja-JP', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}
