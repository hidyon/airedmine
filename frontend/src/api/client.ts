import type {
  ConfigResponse,
  IssueListResponse,
  IssueDetail,
  ChatResponse,
  ChatSessionDetailResponse,
  ChatSessionsResponse,
  ExperienceNotesResponse,
  ExperienceNoteCreate,
  ProposalLogsResponse,
} from './types'

const BASE = '/api'

export interface ApiErrorBody {
  error?: string
  message?: string
  category?: string
  retryable?: boolean
  status?: number
  detail?: string
  log?: unknown
}

export interface ApiError extends Error {
  status?: number
  body?: ApiErrorBody
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    const detail = body.detail && typeof body.detail === 'object' ? body.detail : body
    const message = detail.message ?? detail.error ?? res.statusText
    throw Object.assign(new Error(message), { status: res.status, body: detail })
  }
  return res.json() as Promise<T>
}

export interface LoginResponse {
  token: string
  user: {
    id: number
    username: string
    display_name: string
    role: 'developer' | 'pm'
    redmine_user_id: number | null
  }
}

export function postLogin(username: string, password: string): Promise<LoginResponse> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
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
  redmineUserId?: number | null,
  displayName?: string,
): Promise<ChatResponse> {
  return request('/chat', {
    method: 'POST',
    body: JSON.stringify({
      question,
      session_id: sessionId,
      role,
      messages,
      redmine_user_id: redmineUserId ?? null,
      display_name: displayName ?? '',
    }),
  })
}

export function fetchChatSessions(): Promise<ChatSessionsResponse> {
  return request('/chat/sessions')
}

export function fetchChatSession(sessionId: string): Promise<ChatSessionDetailResponse> {
  return request(`/chat/sessions/${encodeURIComponent(sessionId)}`)
}

export interface BurndownPoint {
  date: string
  open: number
  ideal: number
}

export interface BurndownResponse {
  days: number
  baseline: number
  series: BurndownPoint[]
}

export function fetchBurndown(days: number): Promise<BurndownResponse> {
  return request(`/pm/burndown?days=${days}`)
}

export interface StallItem { id: number; subject: string; updated_on: string; assignee: string | null }
export interface AssigneeLoad { name: string; count: number }
export interface PrioritySummaryItem { name: string; count: number }
export interface OverdueItem { id: number; subject: string; due_date: string; assignee: string | null }
export interface PmStatsResponse {
  stalled: StallItem[]
  assignee_load: AssigneeLoad[]
  priority_summary: PrioritySummaryItem[]
  closed_this_week: number
  overdue: OverdueItem[]
}

export function fetchPmStats(): Promise<PmStatsResponse> {
  return request('/pm/stats')
}

export function postUpdateProposal(
  issueId: number,
  action: 'status_change' | 'assignee_change' | 'due_date' | 'priority' | 'done_ratio' | 'version',
  opts: {
    newStatusId?: number
    newStatusName?: string
    newAssignedToId?: number
    newAssignedToName?: string
    newDueDate?: string
    newPriorityId?: number
    newPriorityName?: string
    newDoneRatio?: number
    newVersionId?: number
    newVersionName?: string
    reason?: string
  },
): Promise<unknown> {
  return request('/proposals/update', {
    method: 'POST',
    body: JSON.stringify({
      issue_id: issueId,
      action,
      new_status_id: opts.newStatusId,
      new_status_name: opts.newStatusName,
      new_assigned_to_id: opts.newAssignedToId,
      new_assigned_to_name: opts.newAssignedToName,
      new_due_date: opts.newDueDate,
      new_priority_id: opts.newPriorityId,
      new_priority_name: opts.newPriorityName,
      new_done_ratio: opts.newDoneRatio,
      new_version_id: opts.newVersionId,
      new_version_name: opts.newVersionName,
      reason: opts.reason,
    }),
  })
}

export function postAddRelationProposal(
  issueId: number,
  relatedIssueId: number,
  relationType: string,
  reason?: string,
): Promise<unknown> {
  return request('/proposals/add_relation', {
    method: 'POST',
    body: JSON.stringify({
      issue_id: issueId,
      related_issue_id: relatedIssueId,
      relation_type: relationType,
      reason,
    }),
  })
}

export function postCreateIssueProposal(opts: {
  projectId: string
  subject: string
  description?: string
  assignedToId?: number
  priorityId?: number
  dueDate?: string
}): Promise<unknown> {
  return request('/proposals/create_issue', {
    method: 'POST',
    body: JSON.stringify({
      project_id: opts.projectId,
      subject: opts.subject,
      description: opts.description,
      assigned_to_id: opts.assignedToId,
      priority_id: opts.priorityId,
      due_date: opts.dueDate,
    }),
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
