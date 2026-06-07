from __future__ import annotations
from typing import Any, Literal, Optional
from pydantic import BaseModel


class Project(BaseModel):
    id: int
    name: str


class Tracker(BaseModel):
    id: int
    name: str


class IssueStatus(BaseModel):
    id: int
    name: str


class Priority(BaseModel):
    id: int
    name: str


class User(BaseModel):
    id: int
    name: str


class Issue(BaseModel):
    id: int
    subject: str
    project: Optional[Project] = None
    tracker: Optional[Tracker] = None
    status: Optional[IssueStatus] = None
    priority: Optional[Priority] = None
    assigned_to: Optional[User] = None
    updated_on: Optional[str] = None


class Journal(BaseModel):
    id: int
    user: Optional[User] = None
    notes: str
    created_on: Optional[str] = None


class IssueDetail(BaseModel):
    id: int
    subject: str
    description: str = ""
    project: Optional[Project] = None
    tracker: Optional[Tracker] = None
    status: Optional[IssueStatus] = None
    priority: Optional[Priority] = None
    assigned_to: Optional[User] = None
    updated_on: Optional[str] = None
    due_date: Optional[str] = None
    journals: list[Journal] = []


class IssueListResponse(BaseModel):
    issues: list[Issue]
    total_count: int
    offset: int
    limit: int


class ConnectionDiagnostics(BaseModel):
    category: str
    message: str
    next_actions: list[str] = []


class ConfigResponse(BaseModel):
    connected: bool
    mode: str
    base_url: Optional[str] = None
    missing: list[str] = []
    diagnostics: ConnectionDiagnostics
    setup: list[str]


class ClarificationResponse(BaseModel):
    type: Literal["clarification_required"] = "clarification_required"
    message: str
    hints: list[str] = []


class IssueReference(BaseModel):
    type: Literal["issue"] = "issue"
    id: int
    title: str
    status: str
    priority: str
    project: str
    assignee: str
    updated: Optional[str] = None
    updated_label: str = ""
    reason: str = ""
    journal_count: Optional[int] = None


class DocReference(BaseModel):
    type: Literal["doc"] = "doc"
    id: str
    title: str
    source: str
    heading: str
    excerpt: str
    score: int


class UpdateProposal(BaseModel):
    status: Literal["confirmation_required"] = "confirmation_required"
    title: str
    action: str
    target_issue: Optional[IssueReference] = None
    change_summary: str
    draft: str
    reason: str
    checklist: list[str] = []
    next_step: str = ""


class ChatResponse(BaseModel):
    answer: Optional[str] = None
    clarification: Optional[ClarificationResponse] = None
    references: list[Any] = []
    proposal: Optional[UpdateProposal] = None


class ChatRequest(BaseModel):
    question: str


class CommentProposalRequest(BaseModel):
    issue_id: Optional[int] = None
    notes: Optional[str] = None
    draft: Optional[str] = None
    target_issue: Optional[dict[str, Any]] = None


class UpdateLog(BaseModel):
    id: str
    created_at: str
    actor: str
    issue_id: int
    target_title: str
    action: str
    draft: str
    result: str
    message: str
    category: Optional[str] = None
    retryable: Optional[bool] = None


# Role concept: developer | pm  (auth enforcement is future work)
Role = Literal["developer", "pm", "observer"]


class ExperienceNoteCreate(BaseModel):
    role: str = "developer"
    moment: str = "triage"
    signal: str = "clearer"
    note: str
    next_action: str = ""


class ExperienceNote(BaseModel):
    id: str
    created_at: str
    role: str
    moment: str
    signal: str
    note: str
    next_action: str
