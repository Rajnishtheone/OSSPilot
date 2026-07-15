"""
Curated repository map, used when the user picks "match by skill" mode.
Each skill maps to a few well-maintained, contribution-friendly repos.
If nothing matches, we fall back to a safe default list.
"""

REPO_MAP = {
    "javascript": [("expressjs", "express"), ("axios", "axios")],
    "js": [("expressjs", "express"), ("axios", "axios")],
    "typescript": [("microsoft", "TypeScript"), ("calcom", "cal.com")],
    "ts": [("microsoft", "TypeScript"), ("calcom", "cal.com")],
    "node": [("nodejs", "node"), ("nestjs", "nest")],
    "node js": [("nodejs", "node"), ("nestjs", "nest")],
    "express": [("expressjs", "express")],
    "react": [("facebook", "react")],
    "python": [("pallets", "flask"), ("fastapi", "fastapi")],
    "django": [("django", "django")],
    "flask": [("pallets", "flask")],
    "docker": [("docker", "compose")],
    "mongodb": [("mongodb", "mongo")],
    "vue": [("vuejs", "core")],
    "backend": [("supabase", "supabase")],
    "html": [("h5bp", "html5-boilerplate")],
    "css": [("h5bp", "html5-boilerplate")],
}

DEFAULT_REPOS = [("freeCodeCamp", "freeCodeCamp")]


def get_target_repos(skills: list[str], limit: int = 2) -> list[tuple[str, str]]:
    """
    Given a list of user skills, return the first matching repo set.
    We check skills in the order the user/LLM gave them, so the
    first clearly-matched skill "wins" and picks the repo set.
    """
    for skill in skills:
        key = skill.lower().strip()
        if key in REPO_MAP:
            return REPO_MAP[key][:limit]
    return DEFAULT_REPOS[:limit]
