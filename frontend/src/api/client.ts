import type {
  ConfigResponse,
  IssueListResponse,
  IssueDetail,
  ChatResponse,
  ExperienceNotesResponse,
  ExperienceNoteCreate,
  ProposalLogsResponse,
} from './types'

const BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw Object.assign(new Error(body.error ?? res.statusText), { status: res.status, body })
  }
  return res.json() as Promise<T>
}

export function fetchConfig(): Promise<ConfigResponse> {
  return request('/config')
}

export interface IssueParams {
  assigned_to_id?: string
  status_id?: string
  limit?: number
  sort?: string
}

export function fetchIssues(params: IssueParams = {}): Promise<IssueListResponse> {
  const qs = new URLSearchParams()
  if (params.assigned_to_id) qs.set('assigned_to_id', params.assigned_to_id)
  if (params.status_id) qs.set('status_id', params.status_id)
  if (params.limit != null) qs.set('limit', String(params.limit))
  if (params.sort) qs.set('sort', params.sort)
  const query = qs.toString() ? `?${qs}` : ''
  return request(`/issues${query}`)
}

export function fetchIssueDetail(issueId: number): Promise<IssueDetail> {
  return request(`/issues/${issueId}`)
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export function postChat(
  question: string,
  sessionId: string,
  role: string,
  messages: ChatHistoryMessage[],
): Promise<ChatResponse> {
  return request('/chat', {
    method: 'POST',
    body: JSON.stringify({ question, session_id: sessionId, role, messages }),
  })
}

export function postCommentProposal(
  issueId: number,
  notes: string,
  targetIssue?: { id: number; title: string },
): Promise<unknown> {
  return request('/proposals/comment', {
    method: 'POST',
    body: JSON.stringify({ issue_id: issueId, notes, target_issue: targetIssue }),
  })
}

export function fetchProposalLogs(): Promise<ProposalLogsResponse> {
  return request('/proposals/logs')
}

export function fetchExperienceNotes(): Promise<ExperienceNotesResponse> {
  return request('/experience/notes')
}

export function postExperienceNote(
  note: ExperienceNoteCreate,
): Promise<{ note: import('./types').ExperienceNote; summary: ExperienceNotesResponse['summary'] }> {
  return request('/experience/notes', { method: 'POST', body: JSON.stringify(note) })
}
