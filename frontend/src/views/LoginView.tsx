import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { postLogin } from '../api/client'
import { saveSession } from '../auth'

export default function LoginView() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password) return
    setError('')
    setLoading(true)
    try {
      const res = await postLogin(username.trim(), password)
      saveSession(res.token, res.user)
      const dest = res.user.role === 'pm' ? '/pm' : '/developer/chat'
      navigate(dest, { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ログインに失敗しました'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 px-8 py-10">
        <p className="text-xl font-bold text-slate-800 mb-1 text-center">AIRedmine</p>
        <p className="text-sm text-slate-500 mb-8 text-center">ログイン</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600">ユーザー名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="tanaka"
              autoFocus
              disabled={loading}
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 disabled:bg-slate-50 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="共通パスワードを入力"
              disabled={loading}
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 disabled:bg-slate-50 transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!username.trim() || !password || loading}
            className="mt-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-200 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? 'ログイン中…' : 'ログイン'}
          </button>
        </form>

        <p className="text-[11px] text-slate-400 text-center mt-6">
          ユーザー: tanaka / sato / ito / yamada（開発者）、nakamura（PM）
        </p>
      </div>
    </div>
  )
}
