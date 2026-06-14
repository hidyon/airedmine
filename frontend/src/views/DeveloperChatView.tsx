import { useState, useRef, useEffect } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  fetchChatSession,
  fetchChatSessions,
  postChat,
  postCommentProposal,
  postUpdateProposal,
  postCreateIssueProposal,
  postAddRelationProposal,
} from '../api/client'
import type { ApiError, ChatHistoryMessage } from '../api/client'
import type { ChatResponse, ChatReference, ChatSession, UpdateProposal } from '../api/types'
import IssueDetailPanel from '../components/IssueDetailPanel'
import { getUser } from '../auth'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  content: ChatResponse | null
}

type Role = 'developer' | 'pm'

const EXAMPLES: Record<Role, string[]> = {
  developer: [
    '今日の作業ダッシュボードを見せて',
    '今日まず何からやればいい？',
    '停滞している issue は？',
    '#1208 の背景を教えて',
  ],
  pm: [
    'プロジェクト全体のリスクは？',
    '今週リリースに影響するブロッカーは？',
    '担当者の負荷バランスを教えて',
  ],
}

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function DeveloperChatView() {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState(generateSessionId())
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const role: Role = getUser()?.role ?? 'developer'
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null)
  const historyRef = useRef<ChatHistoryMessage[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    refreshSessions()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function resetConversation() {
    const nextSessionId = generateSessionId()
    setMessages([])
    historyRef.current = []
    setCurrentSessionId(nextSessionId)
    setSelectedIssueId(null)
  }

  async function refreshSessions() {
    setSessionsLoading(true)
    try {
      const res = await fetchChatSessions()
      setSessions(res.sessions)
    } catch {
      setSessions([])
    } finally {
      setSessionsLoading(false)
    }
  }

  async function selectSession(sessionId: string) {
    if (loading || sessionLoading) return
    setSessionLoading(true)
    try {
      const res = await fetchChatSession(sessionId)
      const loadedMessages = res.messages.map(m => ({
        id: `loaded-${m.id}`,
        role: m.role,
        text: m.content,
        content: null,
      }))
      setCurrentSessionId(sessionId)
      setMessages(loadedMessages)
      historyRef.current = res.messages.map(m => ({ role: m.role, content: m.content }))
      setSelectedIssueId(null)
    } catch {
      setMessages(prev => [
        ...prev,
        { id: `e-${Date.now()}`, role: 'assistant', text: 'セッション履歴を読み込めませんでした。', content: null },
      ])
    } finally {
      setSessionLoading(false)
    }
  }

  async function send() {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', text: q, content: null }])
    setLoading(true)
    try {
      const currentUser = getUser()
      const res = await postChat(
        q,
        currentSessionId,
        role,
        historyRef.current,
        currentUser?.redmine_user_id,
        currentUser?.display_name,
      )
      if (res.session_id && res.session_id !== currentSessionId) {
        setCurrentSessionId(res.session_id)
      }
      // 会話履歴を更新
      historyRef.current = [
        ...historyRef.current,
        { role: 'user', content: q },
        { role: 'assistant', content: res.answer ?? '' },
      ]
      setMessages(prev => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', text: res.answer ?? '', content: res },
      ])
      refreshSessions()
    } catch {
      setMessages(prev => [
        ...prev,
        { id: `e-${Date.now()}`, role: 'assistant', text: 'エラーが発生しました。バックエンドの状態を確認してください。', content: null },
      ])
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function toggleIssue(id: number) {
    setSelectedIssueId(prev => (prev === id ? null : id))
  }

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      <aside className="md:w-72 md:min-w-72 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50 flex flex-col max-h-52 md:max-h-none">
        <div className="px-3 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 m-0">Sessions</p>
            <p className="text-xs text-slate-500 m-0 truncate">{sessions.length} sessions</p>
          </div>
          <button
            onClick={resetConversation}
            disabled={loading || sessionLoading}
            className="px-2.5 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 rounded-lg transition-colors disabled:text-slate-300 disabled:border-slate-200 disabled:cursor-not-allowed cursor-pointer"
          >
            新規
          </button>
        </div>
        <div className="overflow-y-auto p-2 flex flex-col gap-1">
          {sessionsLoading && (
            <p className="text-xs text-slate-400 px-2 py-2 m-0">読み込み中…</p>
          )}
          {!sessionsLoading && sessions.length === 0 && (
            <p className="text-xs text-slate-400 px-2 py-2 m-0">まだセッションはありません。</p>
          )}
          {sessions.map(session => (
            <button
              key={session.session_id}
              onClick={() => selectSession(session.session_id)}
              disabled={loading || sessionLoading}
              className={`text-left px-3 py-2 rounded-lg border transition-colors cursor-pointer disabled:cursor-not-allowed ${
                session.session_id === currentSessionId
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : 'bg-white border-transparent hover:border-slate-200 text-slate-700'
              }`}
            >
              <span className="block text-xs font-semibold truncate">{session.title}</span>
              <span className="block text-[11px] text-slate-500 mt-0.5">
                {session.role} / {session.message_count} messages
              </span>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {messages.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50 flex-shrink-0">
            <p className="text-xs text-slate-500 m-0 truncate">session: {currentSessionId}</p>
            <button
              onClick={resetConversation}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              新規セッション
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
          {sessionLoading && (
            <p className="text-sm text-slate-400 text-center m-0">セッションを読み込み中…</p>
          )}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
              <p className="text-xl font-bold text-slate-800 mb-2">AIRedmine Chat</p>
              <p className="text-sm text-slate-500 mb-6">
                {role === 'developer'
                  ? '今日の優先 issue・ブロッカー・技術的な質問を聞いてください。'
                  : 'プロジェクトのリスク・進捗・PM 判断が必要な事項を聞いてください。'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {EXAMPLES[role].map(ex => (
                  <button
                    key={ex}
                    onClick={() => setInput(ex)}
                    className="px-4 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full transition-colors cursor-pointer"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg =>
            msg.role === 'user' ? (
              <UserBubble key={msg.id} text={msg.text} />
            ) : (
              <AssistantBubble
                key={msg.id}
                msg={msg}
                selectedIssueId={selectedIssueId}
                onSelectIssue={toggleIssue}
              />
            ),
          )}

          {loading && (
            <div className="flex items-center gap-2 px-1">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-sm text-slate-400 italic">Redmine を確認しています…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-3 flex gap-3 items-end flex-shrink-0">
          <textarea
            rows={2}
            placeholder="issue の状況や更新依頼を入力… (Enter で送信 / Shift+Enter で改行)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
            className="flex-1 resize-none border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400 transition-colors"
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-200 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
          >
            送信
          </button>
        </div>
      </div>

      <IssueDetailPanel issueId={selectedIssueId} onClose={() => setSelectedIssueId(null)} />
    </div>
  )
}

type SendState = 'idle' | 'loading' | 'done' | 'error'

interface ProposalError {
  message: string
  category?: string
  retryable?: boolean
  status?: number
  detail?: string
}

interface HazardInfo {
  required: boolean
  reason: string
}

interface ProposalDetail {
  label: string
  value: string
}

function proposalTarget(proposal: UpdateProposal): string {
  if (proposal.action === 'comment' && proposal.target_issue) {
    return `#${proposal.target_issue.id} ${proposal.target_issue.title}`
  }
  if (proposal.action === 'create_issue') {
    return proposal.project_id ? `新規 issue / ${proposal.project_id}` : '新規 issue'
  }
  if (proposal.action === 'add_relation' && proposal.issue_id != null) {
    return `#${proposal.issue_id} -> #${proposal.related_issue_id ?? '?'}`
  }
  return proposal.issue_id != null ? `#${proposal.issue_id}` : '対象未指定'
}

function proposalDetails(proposal: UpdateProposal): ProposalDetail[] {
  const rows: ProposalDetail[] = [{ label: '対象', value: proposalTarget(proposal) }]
  const reason = proposal.reason || proposal.draft

  switch (proposal.action) {
    case 'comment':
      rows.push({ label: '変更内容', value: 'コメント追加' })
      if (proposal.notes || proposal.draft) rows.push({ label: '本文', value: proposal.notes ?? proposal.draft ?? '' })
      break
    case 'status_change':
      rows.push({ label: '変更内容', value: 'ステータス変更' })
      rows.push({ label: '変更後', value: proposal.new_status_name ?? String(proposal.new_status_id ?? '') })
      break
    case 'assignee_change':
      rows.push({ label: '変更内容', value: '担当者変更' })
      rows.push({ label: '変更後', value: proposal.new_assigned_to_name ?? String(proposal.new_assigned_to_id ?? '') })
      break
    case 'due_date':
      rows.push({ label: '変更内容', value: '期日変更' })
      rows.push({ label: '変更後', value: proposal.new_due_date ?? '' })
      break
    case 'priority':
      rows.push({ label: '変更内容', value: '優先度変更' })
      rows.push({ label: '変更後', value: proposal.new_priority_name ?? String(proposal.new_priority_id ?? '') })
      break
    case 'done_ratio':
      rows.push({ label: '変更内容', value: '進捗率更新' })
      rows.push({ label: '変更後', value: proposal.new_done_ratio != null ? `${proposal.new_done_ratio}%` : '' })
      break
    case 'version':
      rows.push({ label: '変更内容', value: 'バージョン割当' })
      rows.push({ label: '変更後', value: proposal.new_version_name ?? String(proposal.new_version_id ?? '') })
      break
    case 'add_relation':
      rows.push({ label: '変更内容', value: 'issue 関連付け' })
      rows.push({ label: '関連タイプ', value: proposal.relation_type ?? 'relates' })
      rows.push({ label: '関連先', value: proposal.related_issue_id != null ? `#${proposal.related_issue_id}` : '' })
      break
    case 'create_issue':
      rows.push({ label: '変更内容', value: 'issue 作成' })
      rows.push({ label: '件名', value: proposal.subject ?? '' })
      if (proposal.description) rows.push({ label: '説明', value: proposal.description })
      if (proposal.assigned_to_id != null) rows.push({ label: '担当者 ID', value: String(proposal.assigned_to_id) })
      if (proposal.priority_id != null) rows.push({ label: '優先度 ID', value: String(proposal.priority_id) })
      if (proposal.due_date) rows.push({ label: '期日', value: proposal.due_date })
      break
    default:
      rows.push({ label: '変更内容', value: proposal.change_summary ?? proposal.action })
  }

  if (reason) rows.push({ label: '理由', value: reason })
  return rows.filter(row => row.value.trim())
}

function proposalHazard(proposal: UpdateProposal): HazardInfo {
  if (proposal.action === 'status_change') {
    const status = (proposal.new_status_name ?? '').toLowerCase()
    if (status === 'closed' || status === 'クローズ' || proposal.new_status_id === 5) {
      return { required: true, reason: 'issue を Closed に変更します' }
    }
  }
  if (proposal.action === 'priority') {
    const priority = (proposal.new_priority_name ?? '').toLowerCase()
    if (priority === 'urgent' || priority === '緊急' || proposal.new_priority_id === 4) {
      return { required: true, reason: '優先度を Urgent に変更します' }
    }
  }
  if (proposal.action === 'due_date' && proposal.new_due_date) {
    const due = new Date(`${proposal.new_due_date}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (!Number.isNaN(due.getTime()) && due < today) {
      return { required: true, reason: '期日を過去日に設定します' }
    }
  }
  return { required: false, reason: '' }
}

function ProposalCard({ proposal }: { proposal: UpdateProposal }) {
  const [sendState, setSendState] = useState<SendState>('idle')
  const [errorInfo, setErrorInfo] = useState<ProposalError | null>(null)
  const [confirmArmed, setConfirmArmed] = useState(false)
  const details = proposalDetails(proposal)
  const hazard = proposalHazard(proposal)

  const isComment = proposal.action === 'comment' && proposal.target_issue != null
  const isStatusChange = proposal.action === 'status_change' && proposal.issue_id != null && proposal.new_status_id != null
  const isAssigneeChange = proposal.action === 'assignee_change' && proposal.issue_id != null && proposal.new_assigned_to_id != null
  const isDueDate = proposal.action === 'due_date' && proposal.issue_id != null && !!proposal.new_due_date
  const isPriority = proposal.action === 'priority' && proposal.issue_id != null && proposal.new_priority_id != null
  const isDoneRatio = proposal.action === 'done_ratio' && proposal.issue_id != null && proposal.new_done_ratio != null
  const isVersion = proposal.action === 'version' && proposal.issue_id != null && proposal.new_version_id != null
  const isRelation = proposal.action === 'add_relation' && proposal.issue_id != null && proposal.related_issue_id != null
  const isCreateIssue = proposal.action === 'create_issue' && !!proposal.project_id && !!proposal.subject
  const canExecute =
    isComment || isStatusChange || isAssigneeChange ||
    isDueDate || isPriority || isDoneRatio || isVersion || isRelation || isCreateIssue

  async function execute() {
    if (hazard.required && !confirmArmed) {
      setConfirmArmed(true)
      setErrorInfo(null)
      return
    }
    setSendState('loading')
    setErrorInfo(null)
    try {
      if (isComment && proposal.target_issue) {
        await postCommentProposal(
          proposal.target_issue.id,
          proposal.draft ?? '',
          { id: proposal.target_issue.id, title: proposal.target_issue.title },
        )
      } else if (isStatusChange && proposal.issue_id != null) {
        await postUpdateProposal(proposal.issue_id, 'status_change', {
          newStatusId: proposal.new_status_id,
          newStatusName: proposal.new_status_name,
          reason: proposal.reason,
        })
      } else if (isAssigneeChange && proposal.issue_id != null) {
        await postUpdateProposal(proposal.issue_id, 'assignee_change', {
          newAssignedToId: proposal.new_assigned_to_id,
          newAssignedToName: proposal.new_assigned_to_name,
          reason: proposal.reason,
        })
      } else if (isDueDate && proposal.issue_id != null) {
        await postUpdateProposal(proposal.issue_id, 'due_date', {
          newDueDate: proposal.new_due_date,
          reason: proposal.reason,
        })
      } else if (isPriority && proposal.issue_id != null) {
        await postUpdateProposal(proposal.issue_id, 'priority', {
          newPriorityId: proposal.new_priority_id,
          newPriorityName: proposal.new_priority_name,
          reason: proposal.reason,
        })
      } else if (isDoneRatio && proposal.issue_id != null) {
        await postUpdateProposal(proposal.issue_id, 'done_ratio', {
          newDoneRatio: proposal.new_done_ratio,
          reason: proposal.reason,
        })
      } else if (isVersion && proposal.issue_id != null) {
        await postUpdateProposal(proposal.issue_id, 'version', {
          newVersionId: proposal.new_version_id,
          newVersionName: proposal.new_version_name,
          reason: proposal.reason,
        })
      } else if (isRelation && proposal.issue_id != null && proposal.related_issue_id != null) {
        await postAddRelationProposal(
          proposal.issue_id,
          proposal.related_issue_id,
          proposal.relation_type ?? 'relates',
          proposal.reason,
        )
      } else if (isCreateIssue && proposal.project_id && proposal.subject) {
        await postCreateIssueProposal({
          projectId: proposal.project_id,
          subject: proposal.subject,
          description: proposal.description,
          assignedToId: proposal.assigned_to_id,
          priorityId: proposal.priority_id,
          dueDate: proposal.due_date,
        })
      }
      setSendState('done')
    } catch (e) {
      setErrorInfo(proposalError(e))
      setSendState('error')
    }
  }

  const buttonLabel = isComment ? 'Redmine に送信' : isCreateIssue ? '作成' : '実行'
  const executeLabel = hazard.required && !confirmArmed ? '確認する' : buttonLabel
  const doneLabel = isComment
    ? '✓ Redmine に送信済み'
    : isCreateIssue
      ? '✓ Redmine に issue を作成しました'
      : '✓ Redmine を更新しました'

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
      <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1 m-0">
        {proposal.title ?? proposal.action}
      </p>
      <p className="text-xs text-emerald-700 mb-2 m-0">{proposal.change_summary}</p>
      {details.length > 0 && (
        <dl className="grid grid-cols-[72px_1fr] gap-x-3 gap-y-1.5 text-xs bg-white/70 border border-emerald-100 rounded-lg px-3 py-2 m-0">
          {details.map((row, i) => (
            <div key={`${row.label}-${i}`} className="contents">
              <dt className="text-emerald-700 font-semibold">{row.label}</dt>
              <dd className="text-slate-700 whitespace-pre-wrap break-words m-0">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {hazard.required && (
        <div className="mt-3 border border-amber-200 bg-amber-50 rounded-lg px-3 py-2">
          <p className="text-xs font-semibold text-amber-800 m-0">{hazard.reason}</p>
          <p className="text-xs text-amber-700 mt-1 mb-0">
            {confirmArmed
              ? '内容を再確認しました。もう一度実行すると Redmine に反映します。'
              : 'この操作は影響が大きいため、実行前に追加確認が必要です。'}
          </p>
        </div>
      )}
      <div className="mt-3">
        {canExecute ? (
          sendState === 'done' ? (
            <span className="text-xs text-emerald-700 font-medium">{doneLabel}</span>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={execute}
                disabled={sendState === 'loading'}
                className={`px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed ${
                  hazard.required && confirmArmed
                    ? 'bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300'
                }`}
              >
                {sendState === 'loading' ? '処理中…' : executeLabel}
              </button>
              {hazard.required && confirmArmed && (
                <button
                  onClick={() => setConfirmArmed(false)}
                  disabled={sendState === 'loading'}
                  className="px-3 py-1.5 text-xs font-semibold border border-amber-200 text-amber-700 bg-white/70 hover:bg-white rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  戻る
                </button>
              )}
            </div>
          )
        ) : (
          <p className="text-xs text-emerald-600 italic m-0">
            この操作は Audit ビューで確認してください。
          </p>
        )}
      </div>
      {sendState === 'error' && errorInfo && (
        <ProposalErrorMessage error={errorInfo} />
      )}
    </div>
  )
}

function proposalError(error: unknown): ProposalError {
  const apiError = error as ApiError
  const body = apiError.body
  return {
    message: body?.message ?? (error instanceof Error ? error.message : '送信に失敗しました'),
    category: body?.category,
    retryable: body?.retryable,
    status: body?.status ?? apiError.status,
    detail: body?.detail,
  }
}

function ProposalErrorMessage({ error }: { error: ProposalError }) {
  const nextAction = error.retryable
    ? 'Redmine またはネットワークの状態を確認して再試行できます。'
    : '入力内容、対象 issue、権限、Redmine 設定を確認してください。'

  return (
    <div className="mt-3 border border-red-200 bg-red-50 rounded-lg px-3 py-2">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className="text-xs font-semibold text-red-700">{error.message}</span>
        {error.status != null && (
          <span className="text-[11px] text-red-600 bg-white/70 border border-red-100 rounded-full px-2 py-0.5">
            HTTP {error.status}
          </span>
        )}
        {error.category && (
          <span className="text-[11px] text-red-600 bg-white/70 border border-red-100 rounded-full px-2 py-0.5">
            {error.category}
          </span>
        )}
        {error.retryable != null && (
          <span className="text-[11px] text-slate-600 bg-white/70 border border-red-100 rounded-full px-2 py-0.5">
            {error.retryable ? '再試行可' : '再試行不可'}
          </span>
        )}
      </div>
      <p className="text-xs text-red-700 m-0">{nextAction}</p>
      {error.detail && (
        <pre className="mt-2 text-[11px] text-red-700 bg-white/70 border border-red-100 rounded-md px-2 py-1.5 whitespace-pre-wrap break-words font-mono m-0">
          {error.detail}
        </pre>
      )}
    </div>
  )
}

function ToolCallBadges({ toolCalls }: { toolCalls: string[] }) {
  const labels: Record<string, string> = {
    list_issues: 'issue 一覧',
    get_issue: 'issue 詳細',
    search_issues: 'issue 検索',
    add_comment: 'コメント作成',
    create_issue: 'issue 作成',
    update_due_date: '期日変更',
    update_priority: '優先度変更',
    update_done_ratio: '進捗率更新',
    list_versions: 'バージョン一覧',
    assign_version: 'バージョン割当',
    add_relation: '関連付け',
    search_knowledge: 'ドキュメント検索',
  }
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {toolCalls.map((name, i) => (
        <span
          key={i}
          className="text-[10px] px-2 py-0.5 bg-violet-50 text-violet-600 border border-violet-200 rounded-full"
        >
          {labels[name] ?? name}
        </span>
      ))}
    </div>
  )
}

function linkifyIssues(text: string): string {
  // #NNN を [#NNN](#issue-NNN) に変換。既存リンク内 ([#NNN]) は除外する
  return text.replace(/(?<!\[)#(\d+)/g, '[#$1](#issue-$1)')
}

function MarkdownContent({
  children,
  onSelectIssue,
}: {
  children: string
  onSelectIssue?: (id: number) => void
}) {
  const processed = onSelectIssue ? linkifyIssues(children) : children
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="text-sm text-slate-800 leading-relaxed my-1 first:mt-0 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-4 my-1 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 my-1 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="text-sm text-slate-800 leading-relaxed">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
        em: ({ children }) => <em className="italic text-slate-700">{children}</em>,
        h1: ({ children }) => <h1 className="text-base font-bold text-slate-900 mt-2 mb-1 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-bold text-slate-900 mt-2 mb-1 first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold text-slate-900 mt-1 mb-0.5">{children}</h3>,
        code: ({ className, children }) =>
          className?.startsWith('language-') ? (
            <code className="text-xs font-mono text-slate-700">{children}</code>
          ) : (
            <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono text-slate-700">{children}</code>
          ),
        pre: ({ children }) => (
          <pre className="bg-slate-100 rounded-lg px-3 py-2 overflow-x-auto my-2 text-xs">{children}</pre>
        ),
        hr: () => <hr className="border-slate-200 my-2" />,
        a: ({ href, children }) => {
          const m = href?.match(/^#issue-(\d+)$/)
          if (m && onSelectIssue) {
            const id = parseInt(m[1])
            return (
              <button
                onClick={() => onSelectIssue(id)}
                className="text-blue-600 hover:text-blue-800 underline cursor-pointer font-medium"
              >
                {children}
              </button>
            )
          }
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {children}
            </a>
          )
        },
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="text-xs border-collapse w-full">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-slate-100">{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr className="border-b border-slate-200">{children}</tr>,
        th: ({ children }) => <th className="px-3 py-1.5 text-left font-semibold text-slate-700 border border-slate-200">{children}</th>,
        td: ({ children }) => <td className="px-3 py-1.5 text-slate-700 border border-slate-200">{children}</td>,
      }}
    >
      {processed}
    </Markdown>
  )
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <span className="max-w-[68%] bg-blue-500 text-white px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed whitespace-pre-wrap break-words">
        {text}
      </span>
    </div>
  )
}

function AssistantBubble({
  msg,
  selectedIssueId,
  onSelectIssue,
}: {
  msg: Message
  selectedIssueId: number | null
  onSelectIssue: (id: number) => void
}) {
  const res = msg.content
  if (!res) {
    return (
      <div className="max-w-[80%]">
        <p className="text-sm text-slate-700 leading-relaxed m-0">{msg.text}</p>
      </div>
    )
  }

  return (
    <div className="max-w-[80%] flex flex-col gap-3">
      {res.clarification ? (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl rounded-tl-sm px-4 py-3">
          <p className="text-sm font-medium text-blue-900 mb-2 m-0">{res.clarification.message}</p>
          <ul className="space-y-1 pl-4 list-disc m-0">
            {res.clarification.hints.map((h, i) => (
              <li key={i} className="text-xs text-blue-700">{h}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <MarkdownContent onSelectIssue={onSelectIssue}>{res.answer ?? ''}</MarkdownContent>
          {res.tool_calls && res.tool_calls.length > 0 && (
            <ToolCallBadges toolCalls={res.tool_calls} />
          )}
        </div>
      )}

      {res.proposal && <ProposalCard proposal={res.proposal} />}

      {res.references && res.references.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {res.references.map((ref: ChatReference, i: number) =>
            ref.type === 'issue' ? (
              <button
                key={i}
                onClick={() => onSelectIssue(ref.id)}
                className={`text-[11.5px] px-2 py-0.5 border rounded transition-colors cursor-pointer ${
                  selectedIssueId === ref.id
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
                }`}
              >
                #{ref.id} {ref.title}
              </button>
            ) : (
              <span
                key={i}
                className="text-[11.5px] px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded"
              >
                {ref.title}
              </span>
            ),
          )}
        </div>
      )}
    </div>
  )
}
