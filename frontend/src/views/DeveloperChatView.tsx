import { useState, useRef, useEffect } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { postChat, postCommentProposal } from '../api/client'
import type { ChatHistoryMessage } from '../api/client'
import type { ChatResponse, ChatReference, UpdateProposal } from '../api/types'
import IssueDetailPanel from '../components/IssueDetailPanel'

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
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<Role>('developer')
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null)
  const sessionIdRef = useRef<string>(generateSessionId())
  const historyRef = useRef<ChatHistoryMessage[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function switchRole(next: Role) {
    setRole(next)
    setMessages([])
    historyRef.current = []
    sessionIdRef.current = generateSessionId()
  }

  async function send() {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', text: q, content: null }])
    setLoading(true)
    try {
      const res = await postChat(q, sessionIdRef.current, role, historyRef.current)
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
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Role selector */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <span className="text-xs text-slate-500">ロール:</span>
          {(['developer', 'pm'] as Role[]).map(r => (
            <button
              key={r}
              onClick={() => switchRole(r)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                role === r
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-blue-300'
              }`}
            >
              {r === 'developer' ? '開発者' : 'PM'}
            </button>
          ))}
          {messages.length > 0 && (
            <button
              onClick={() => { setMessages([]); historyRef.current = []; sessionIdRef.current = generateSessionId() }}
              className="ml-auto text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              会話をリセット
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
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

function ProposalCard({ proposal }: { proposal: UpdateProposal }) {
  const [sendState, setSendState] = useState<SendState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const canExecute = proposal.action === 'comment' && proposal.target_issue != null

  async function execute() {
    if (!proposal.target_issue) return
    setSendState('loading')
    try {
      await postCommentProposal(
        proposal.target_issue.id,
        proposal.draft,
        { id: proposal.target_issue.id, title: proposal.target_issue.title },
      )
      setSendState('done')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '送信に失敗しました')
      setSendState('error')
    }
  }

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
      <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1 m-0">
        {proposal.title}
      </p>
      <p className="text-xs text-emerald-700 mb-2 m-0">{proposal.change_summary}</p>
      <pre className="text-xs text-slate-700 bg-white/60 rounded-lg px-3 py-2 whitespace-pre-wrap break-words font-sans m-0">
        {proposal.draft}
      </pre>
      <div className="mt-3">
        {canExecute ? (
          sendState === 'done' ? (
            <span className="text-xs text-emerald-700 font-medium">✓ Redmine に送信済み</span>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={execute}
                disabled={sendState === 'loading'}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {sendState === 'loading' ? '送信中…' : 'Redmine に送信'}
              </button>
              {sendState === 'error' && (
                <span className="text-xs text-red-600">{errorMsg} — 再試行できます</span>
              )}
            </div>
          )
        ) : (
          <p className="text-xs text-emerald-600 italic m-0">
            この操作は Audit ビューで確認してください。
          </p>
        )}
      </div>
    </div>
  )
}

function ToolCallBadges({ toolCalls }: { toolCalls: string[] }) {
  const labels: Record<string, string> = {
    list_issues: 'issue 一覧',
    get_issue: 'issue 詳細',
    search_issues: 'issue 検索',
    add_comment: 'コメント作成',
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
