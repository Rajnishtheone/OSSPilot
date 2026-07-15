export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type SearchMode = "skill" | "label";

export interface MatchedIssue {
  title: string;
  url: string;
  repo: string;
  labels: string[];
  score: number;
}

export interface AnalyzeResponse {
  status: "needs_clarification" | "complete";
  skills: string[];
  interests: string[];
  confidence: number;
  clarify_question?: string;
  matched_issues: MatchedIssue[];
  searched_repos: string[];
  contributing_guide?: string;
}

export interface AnalyzeRequest {
  message: string;
  experience_level: ExperienceLevel;
  search_mode: SearchMode;
  search_label?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function analyzeMessage(
  payload: AnalyzeRequest
): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || "Request failed");
  }

  return res.json();
}
