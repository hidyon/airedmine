import { listMockIssues } from "./mockRedmine.js";

export class RedmineApiError extends Error {
  constructor(message, { status, body, contentType }) {
    super(message);
    this.name = "RedmineApiError";
    this.status = status;
    this.body = body;
    this.contentType = contentType;
  }
}

export function createRedmineConnector({ baseUrl, apiKey }) {
  const redmineBaseUrl = trimTrailingSlash(baseUrl || "");
  const redmineApiKey = apiKey || "";

  return {
    getConfig() {
      return {
        connected: Boolean(redmineBaseUrl && redmineApiKey),
        mode: redmineBaseUrl && redmineApiKey ? "redmine" : "mock",
        baseUrl: redmineBaseUrl || null,
        missing: getMissingConfig(redmineBaseUrl, redmineApiKey)
      };
    },

    async listIssues(query) {
      const params = normalizeIssueQuery(query);

      if (!redmineBaseUrl || !redmineApiKey) {
        return listMockIssues(params);
      }

      const redmineUrl = `${redmineBaseUrl}/issues.json?${toRedmineSearchParams(params).toString()}`;
      const response = await fetch(redmineUrl, {
        headers: {
          "Accept": "application/json",
          "X-Redmine-API-Key": redmineApiKey
        }
      });

      if (!response.ok) {
        throw new RedmineApiError(`Redmine API error: ${response.status}`, {
          status: response.status,
          body: await response.text(),
          contentType: response.headers.get("content-type") || "text/plain; charset=utf-8"
        });
      }

      const data = await response.json();
      return {
        issues: (data.issues || []).map(normalizeIssue),
        total_count: data.total_count || 0,
        offset: data.offset || 0,
        limit: data.limit || params.limit
      };
    },

    async addIssueComment(issueId, notes) {
      if (!redmineBaseUrl || !redmineApiKey) {
        return {
          mode: "mock",
          issueId,
          notes,
          updated: true
        };
      }

      const redmineUrl = `${redmineBaseUrl}/issues/${issueId}.json`;
      let response;

      try {
        response = await fetch(redmineUrl, {
          method: "PUT",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-Redmine-API-Key": redmineApiKey
          },
          body: JSON.stringify({
            issue: {
              notes
            }
          })
        });
      } catch (error) {
        throw new RedmineApiError("Redmine connection error", {
          status: 503,
          body: error.message || "Failed to fetch Redmine",
          contentType: "text/plain; charset=utf-8"
        });
      }

      if (!response.ok) {
        throw new RedmineApiError(`Redmine API error: ${response.status}`, {
          status: response.status,
          body: await response.text(),
          contentType: response.headers.get("content-type") || "text/plain; charset=utf-8"
        });
      }

      return {
        mode: "redmine",
        issueId,
        updated: true
      };
    }
  };
}

function normalizeIssueQuery(query) {
  return {
    assignedToId: query.get("assigned_to_id") || "me",
    statusId: query.get("status_id") || "open",
    limit: Number(query.get("limit") || 100),
    sort: query.get("sort") || "updated_on:desc"
  };
}

function toRedmineSearchParams(params) {
  return new URLSearchParams({
    assigned_to_id: params.assignedToId,
    status_id: params.statusId,
    limit: String(params.limit),
    sort: params.sort
  });
}

function normalizeIssue(issue) {
  return {
    id: issue.id,
    subject: issue.subject || "",
    project: issue.project || null,
    tracker: issue.tracker || null,
    status: issue.status || null,
    priority: issue.priority || null,
    assigned_to: issue.assigned_to || null,
    updated_on: issue.updated_on || null
  };
}

function getMissingConfig(baseUrl, apiKey) {
  return [
    ["REDMINE_BASE_URL", baseUrl],
    ["REDMINE_API_KEY", apiKey]
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}
