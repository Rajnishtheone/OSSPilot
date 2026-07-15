"""
All calls to GitHub's public API live here. No auth token required for
public read access, but you're limited to 60 requests/hour unsigned.
For real usage, add a GITHUB_TOKEN env var and pass it as a header
(bumps the limit to 5000/hour) - see fetch_contributing_guide for an
example of how headers get added.
"""

import os
import base64
import requests

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")  # optional, raises rate limit if set


def _headers():
    headers = {"Accept": "application/vnd.github+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    return headers


def fetch_open_issues(owner: str, repo: str, limit: int = 15) -> list[dict]:
    """Fetch open issues from ONE specific repo."""
    url = f"https://api.github.com/repos/{owner}/{repo}/issues"
    params = {"state": "open", "per_page": limit}

    response = requests.get(url, params=params, headers=_headers(), timeout=10)
    response.raise_for_status()
    issues = response.json()

    cleaned = []
    for issue in issues:
        if "pull_request" in issue:
            continue
        cleaned.append({
            "title": issue["title"],
            "body": (issue["body"] or "")[:300],
            "labels": [label["name"] for label in issue["labels"]],
            "url": issue["html_url"],
            "repo": f"{owner}/{repo}",
            "assignees": len(issue.get("assignees") or []),
        })
    return cleaned


def fetch_issues_by_label(label: str, limit: int = 15) -> list[dict]:
    """Search issues GLOBALLY across GitHub by label (e.g. gssoc25, hacktoberfest)."""
    label = label.strip()
    url = "https://api.github.com/search/issues"
    query = f'label:"{label}" state:open type:issue'
    params = {"q": query, "per_page": limit}

    response = requests.get(url, params=params, headers=_headers(), timeout=10)
    response.raise_for_status()
    results = response.json()

    cleaned = []
    for issue in results.get("items", []):
        cleaned.append({
            "title": issue["title"],
            "body": (issue["body"] or "")[:300],
            "labels": [l["name"] for l in issue["labels"]],
            "url": issue["html_url"],
            "repo": issue["repository_url"].split("/repos/")[-1],
            "assignees": len(issue.get("assignees") or []),
        })
    return cleaned


def fetch_contributing_guide(owner: str, repo: str) -> str | None:
    """
    Fetch a repo's CONTRIBUTING.md (if it exists) so we can show it in the UI.
    GitHub's contents API returns the file base64-encoded, so we decode it.
    Returns None if the repo has no CONTRIBUTING.md at the root.
    """
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/CONTRIBUTING.md"
    response = requests.get(url, headers=_headers(), timeout=10)

    if response.status_code != 200:
        return None

    data = response.json()
    content_b64 = data.get("content", "")
    try:
        decoded = base64.b64decode(content_b64).decode("utf-8")
        return decoded[:3000]  # trim so we don't ship huge payloads to the frontend
    except Exception:
        return None