"""
The LangGraph agent itself. This runs ONCE per API request (stateless).

Flow: extraction -> route -> [recommend_issues | end_needs_clarification]

Note: unlike the Colab version, there's no interactive `clarify` node here
that calls input() - a web backend can't pause and wait like that. Instead,
if confidence is low we end the graph early and the API layer tells the
frontend "ask the user this question." The frontend then sends a NEW
request with the combined message, which re-enters this same graph fresh.
Same loop-back behavior for the user, cleaner architecture for the server.
"""

import os
from typing import TypedDict, List, Optional

from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from app.models import SkillExtraction
from app.config import get_target_repos
from app.github_client import fetch_open_issues, fetch_issues_by_label, fetch_contributing_guide


class AgentState(TypedDict):
    user_message: str
    experience_level: str
    search_mode: str
    search_label: Optional[str]
    skills: List[str]
    interests: List[str]
    confidence: float
    matched_issues: List[dict]
    searched_repos: List[str]
    contributing_guide: Optional[str]


llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)
extractor_llm = llm.with_structured_output(SkillExtraction)

EXTRACTION_PROMPT = """You are analyzing a message from someone who wants to contribute to open source.
Extract their technical skills, their interests (type of work they want to do),
and how confident you are in this extraction (0.0 to 1.0).

If the message is vague or doesn't mention specific skills, give a LOW confidence score (below 0.5).
If the message clearly states specific technologies and what they want to work on, give a HIGH confidence score (above 0.7)."""


def extraction_node(state: AgentState) -> AgentState:
    result = extractor_llm.invoke([
        SystemMessage(content=EXTRACTION_PROMPT),
        HumanMessage(content=state["user_message"]),
    ])
    return {
        **state,
        "skills": result.skills,
        "interests": result.interests,
        "confidence": result.confidence,
    }


def route_after_extraction(state: AgentState) -> str:
    if state["confidence"] < 0.6:
        return "needs_clarification"
    return "proceed"


def recommend_issues_node(state: AgentState) -> AgentState:
    searched_repos = []

    if state["search_mode"] == "label" and state["search_label"]:
        all_issues = fetch_issues_by_label(state["search_label"], limit=20)
    else:
        repos = get_target_repos(state["skills"], limit=2)
        searched_repos = [f"{o}/{r}" for o, r in repos]
        all_issues = []
        for owner, repo in repos:
            try:
                all_issues.extend(fetch_open_issues(owner, repo, limit=10))
            except Exception:
                continue  # skip a repo if GitHub errors/rate-limits on it

    user_skills = [s.lower() for s in state["skills"]]
    matched = []

    for issue in all_issues:
        if issue.get("assignees", 0) > 0:
            continue  # skip issues someone has already claimed

        issue_text = (
            issue["title"] + " " + issue["body"] + " " + " ".join(issue["labels"])
        ).lower()

        score = 0
        for skill in user_skills:
            if skill in issue_text:
                score += 1

        if state["experience_level"] == "beginner" and "good first issue" in issue_text:
            score += 2
        elif "good first issue" in issue_text:
            score += 1

        if score > 0:
            matched.append({"score": score, **issue})

    matched.sort(key=lambda x: x["score"], reverse=True)

    if not matched:
        unassigned = [i for i in all_issues if i.get("assignees", 0) == 0]
        matched = [{"score": 0, **i} for i in unassigned[:5]]

    top_matches = matched[:8]

    # Fetch a contributing guide for the top match's repo, as a "wow" extra
    contributing_guide = None
    if top_matches:
        owner_repo = top_matches[0]["repo"].split("/")
        if len(owner_repo) == 2:
            contributing_guide = fetch_contributing_guide(owner_repo[0], owner_repo[1])

    return {
        **state,
        "matched_issues": top_matches,
        "searched_repos": searched_repos,
        "contributing_guide": contributing_guide,
    }


def build_graph():
    builder = StateGraph(AgentState)

    builder.add_node("extraction", extraction_node)
    builder.add_node("recommend_issues", recommend_issues_node)

    builder.set_entry_point("extraction")

    builder.add_conditional_edges(
        "extraction",
        route_after_extraction,
        {
            "needs_clarification": END,
            "proceed": "recommend_issues",
        },
    )
    builder.add_edge("recommend_issues", END)

    return builder.compile()


graph = build_graph()