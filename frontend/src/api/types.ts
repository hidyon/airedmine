// Shared field types
export interface NamedRef {
  id: number
  name: string
}

// Issue
export interface Issue {
  id: number
  subject: string
  project: NamedRef | null
  tracker: NamedRef | null
  status: NamedRef | null
  priority: NamedRef | null
  assigned_to: NamedRef | null
  updated_on: string | null
}

export interface Journal {
  id: number
  user: NamedRef | null
  notes: string
  created_on: string | null
}

export interface IssueDetail extends Issue {
  description: string
  due_date: string | null
  journals: Journal[]
}

export interface IssueListResponse {
  issues: Issue[]
  total_count: number
  offset: number
  limit: number
}

// Config
export interface Diagnostics {
  category: string
  message: string
  next_actions: string[]
}

export interface ConfigResponse {
  connected: boolean
  mode: 'mock' | 'redmine'
  base_url: string | null
  missing: string[]
  diagnostics: Diagnostics
  setup: string[]
}

// Chat
export interface IssueReference {
  type: 'issue'
  id: number
  title: string
  status: string
  priority: string
  project: string
  assignee: string
  updated: string | null
  updated_label: string
  reason: string
  journal_count: number | null
}

export interface DocReference {
  type: 'doc'
  id: string
  title: string
  excerpt: string
  updated: string | null
  updated_label: string
  score: number
}

export type ChatReference = IssueReference | DocReference

export interface Clarification {
  type: 'clarification_required'
  message: string
  hints: string[]
}

export interface UpdateProposal {
  status: 'confirmation_required'
  action: 'comment' | 'close_candidate' | 'status_change' | 'assignee_change'
  // comment
  target_issue?: IssueReference | null
  notes?: string
  // status_change / assignee_change
  issue_id?: number
  new_status_id?: number
  new_status_name?: string
  new_assigned_to_id?: number
  new_assigned_to_name?: string
  // display
  title?: string
  change_summary?: string
  draft?: string
  reason?: string
  checklist?: string[]
  next_step?: string
}

export interface ChatResponse {
  answer: string | null
  clarification: Clarification | null
  references: ChatReference[]
  proposal: UpdateProposal | null
  tool_calls?: string[]
}

// Experience notes
export interface ExperienceNote {
  id: string
  created_at: string
  role: string
  moment: string
  signal: string
  note: string
  next_action: string
}

export interface ExperienceNotesResponse {
  notes: ExperienceNote[]
  total: number
  summary: {
    by_role: Record<string, number>
    by_moment: Record<string, number>
    by_signal: Record<string, number>
    improvement_candidates: Array<{
      id: string
      created_at: string
      signal: string
      next_action: string
      source_note: string
    }>
  }
  prompts: string[]
}

export interface ExperienceNoteCreate {
  role: string
  moment: string
  signal: string
  note: string
  next_action?: string
}

// Proposal logs
export interface UpdateLog {
  id: string
  created_at: string
  actor: string
  issue_id: number
  target_title: string
  action: string
  draft: string
  result: 'success' | 'failure'
  message: string
}

export interface ProposalLogsResponse {
  logs: UpdateLog[]
}
