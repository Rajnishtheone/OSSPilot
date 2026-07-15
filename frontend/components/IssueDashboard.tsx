"use client";

import { useEffect, useState } from "react";
import { AnalyzeResponse, MatchedIssue } from "@/lib/api";
import ScanningAnimation from "@/components/ScanningAnimation";

const BOOKMARK_KEY = "osspilot_bookmarks";

function loadBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BOOKMARK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBookmarks(urls: string[]) {
  window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(urls));
}

function IssueCard({
  issue,
  bookmarked,
  onToggleBookmark,
}: {
  issue: MatchedIssue;
  bookmarked: boolean;
  onToggleBookmark: () => void;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 flex flex-col gap-2 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-neutral-500 font-mono">{issue.repo}</span>
        <button
          onClick={onToggleBookmark}
          className={`text-xs ${bookmarked ? "text-yellow-500" : "text-neutral-400 dark:text-neutral-600"} hover:text-yellow-500`}
          title="Bookmark"
        >
          {bookmarked ? "★" : "☆"}
        </button>
      </div>

      <a
        href={issue.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-neutral-900 dark:text-neutral-100 font-medium hover:text-emerald-500 leading-snug"
      >
        {issue.title}
      </a>

      <div className="flex flex-wrap gap-1 mt-1">
        {issue.labels.slice(0, 4).map((label) => (
          <span
            key={label}
            className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-2 flex items-center justify-between">
        <span className="text-[10px] text-neutral-400 dark:text-neutral-600">Match score: {issue.score}</span>
        <a
          href={issue.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-sky-500 hover:underline"
        >
          Open issue →
        </a>
      </div>
    </div>
  );
}

export default function IssueDashboard({
  result,
  isSearching,
}: {
  result: AnalyzeResponse | null;
  isSearching?: boolean;
}) {
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    setBookmarks(loadBookmarks());
  }, []);

  function toggleBookmark(url: string) {
    setBookmarks((prev) => {
      const next = prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url];
      saveBookmarks(next);
      return next;
    });
  }

  if (isSearching) {
    return <ScanningAnimation />;
  }

  if (!result) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500 dark:text-neutral-600 text-sm font-mono p-8 text-center">
        Matched issues will appear here once the agent finishes analyzing your message.
      </div>
    );
  }

  const hasNoMatches = result.status === "complete" && result.matched_issues.length === 0;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div>
        <h2 className="text-neutral-800 dark:text-neutral-200 text-sm font-semibold mb-2">Extracted profile</h2>
        <div className="flex flex-wrap gap-2">
          {result.skills.map((s) => (
            <span key={s} className="text-xs px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
              {s}
            </span>
          ))}
          {result.interests.map((i) => (
            <span key={i} className="text-xs px-2 py-1 rounded bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-900">
              {i}
            </span>
          ))}
        </div>
      </div>

      {result.searched_repos.length > 0 && (
        <div className="text-xs text-neutral-500 font-mono">
          Searched: {result.searched_repos.join(", ")}
        </div>
      )}

      {hasNoMatches ? (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-6 text-center">
          <p className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">
            No matching issues found right now.
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Try broadening your skills, switching search mode, or checking back later —
            GitHub&apos;s open issue pool changes constantly.
          </p>
        </div>
      ) : (
        <div>
          <h2 className="text-neutral-800 dark:text-neutral-200 text-sm font-semibold mb-3">
            Matched issues ({result.matched_issues.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.matched_issues.map((issue) => (
              <IssueCard
                key={issue.url}
                issue={issue}
                bookmarked={bookmarks.includes(issue.url)}
                onToggleBookmark={() => toggleBookmark(issue.url)}
              />
            ))}
          </div>
        </div>
      )}

      {result.contributing_guide && (
        <div>
          <h2 className="text-neutral-800 dark:text-neutral-200 text-sm font-semibold mb-2">
            Contributing guide (top match&apos;s repo)
          </h2>
          <pre className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 whitespace-pre-wrap max-h-64 overflow-y-auto">
            {result.contributing_guide}
          </pre>
        </div>
      )}
    </div>
  );
}