import { useState, useRef, useEffect } from 'react'
import { postChat } from '../api/client'
import type { ChatResponse, ChatReference } from '../api/types'
import styles from './DeveloperChatView.module.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: ChatResponse | null
  text: string
}

export default function DeveloperChatView() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const q = input.trim()
    if (!q || loading) return
    setInput('')

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: q, content: null }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await postChat(q)
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: res.answer ?? '',
        content: res,
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      const errMsg: Message = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        text: 'エラーが発生しました。バックエンドの状態を確認してください。',
        content: null,
      }
      setMessages(prev => [...prev, errMsg])
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
    <div className={styles.root}>
      <div className={styles.thread}>
        {messages.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>AIRedmine Chat</p>
            <p className={styles.emptyHint}>issue の状況、今日の優先度、リスクなど自由に聞いてください。</p>
            <div className={styles.examples}>
              {['今日まず何からやればいい？', '停滞している issue は？', '#1208 の背景を教えて'].map(ex => (
                <button key={ex} className={styles.example} onClick={() => setInput(ex)}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map(msg =>
          msg.role === 'user' ? (
            <div key={msg.id} className={styles.bubbleUser}>
              <span className={styles.bubbleUserText}>{msg.text}</span>
            </div>
          ) : (
            <AssistantBubble key={msg.id} msg={msg} />
          ),
        )}
        {loading && (
          <div className={styles.bubbleAssistant}>
            <span className={styles.thinking}>考えています…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputArea}>
        <textarea
          className={styles.textarea}
          rows={2}
          placeholder="issue の状況や更新依頼を入力… (Enter で送信 / Shift+Enter で改行)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={loading}
        />
        <button className={styles.sendBtn} onClick={send} disabled={!input.trim() || loading}>
          送信
        </button>
      </div>
    </div>
  )
}

function AssistantBubble({ msg }: { msg: Message }) {
  const res = msg.content
  if (!res) return <div className={styles.bubbleAssistant}><p>{msg.text}</p></div>

  return (
    <div className={styles.bubbleAssistant}>
      {res.clarification ? (
        <div className={styles.clarification}>
          <p className={styles.clarificationMsg}>{res.clarification.message}</p>
          <ul className={styles.hintList}>
            {res.clarification.hints.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </div>
      ) : (
        <p className={styles.answerText}>{res.answer}</p>
      )}

      {res.proposal && (
        <div className={styles.proposal}>
          <p className={styles.proposalTitle}>{res.proposal.title}</p>
          <p className={styles.proposalSummary}>{res.proposal.change_summary}</p>
          <pre className={styles.proposalDraft}>{res.proposal.draft}</pre>
        </div>
      )}

      {res.references.length > 0 && (
        <div className={styles.refs}>
          {res.references.map((ref: ChatReference, i: number) => (
            <span key={i} className={styles.ref}>
              {ref.type === 'issue' ? `#${ref.id} ${ref.title}` : ref.title}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
