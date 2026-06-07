import { useState, useRef, useEffect } from 'react'
import { postChat } from '../api/client'
import type { ChatResponse, ChatReference } from '../api/types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  content: ChatResponse | null
}

const EXAMPLES = [
  '今日まず何からやればいい？',
  '停滞している issue は？',
  '#1208 の背景を教えて',
]

export default function DeveloperChatView() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', text: q, content: null }])
    setLoading(true)
    try {
      const res = await postChat(q)
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
            <p className="text-xl font-bold text-slate-800 mb-2">AIRedmine Chat</p>
            <p className="text-sm text-slate-500 mb-6">
              issue の状況、今日の優先度、リスクなど自由に聞いてください。
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {EXAMPLES.map(ex => (
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
            <AssistantBubble key={msg.id} msg={msg} />
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
            <span className="text-sm text-slate-400 italic">考えています…</span>
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

function AssistantBubble({ msg }: { msg: Message }) {
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
              <li key={i} className="text-xs text-blue-700">
                {h}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap m-0">{res.answer}</p>
        </div>
      )}

      {res.proposal && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1 m-0">
            {res.proposal.title}
          </p>
          <p className="text-xs text-emerald-700 mb-2 m-0">{res.proposal.change_summary}</p>
          <pre className="text-xs text-slate-700 bg-white/60 rounded-lg px-3 py-2 whitespace-pre-wrap break-words font-sans m-0">
            {res.proposal.draft}
          </pre>
        </div>
      )}

      {res.references.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {res.references.map((ref: ChatReference, i: number) => (
            <span
              key={i}
              className="text-[11.5px] px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded"
            >
              {ref.type === 'issue' ? `#${ref.id} ${ref.title}` : ref.title}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
