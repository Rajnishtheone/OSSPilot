"""
All the data shapes used across the app.
- SkillExtraction: what we force the LLM to return
- AnalyzeRequest / AnalyzeResponse: what the frontend sends/receives from /api/analyze
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Literal


class SkillExtraction(BaseModel):
    skills: List[str] = Field(description="Technical skills mentioned, e.g. react, python, docker")
    interests: List[str] = Field(description="Type of work they want, e.g. frontend, bug fixing, docs")
    confidence: float = Field(description="How confident you are in this extraction, from 0.0 to 1.0")


class AnalyzeRequest(BaseModel):
    message: str
    experience_level: Literal["beginner", "intermediate", "advanced"]
    search_mode: Literal["skill", "label"]
    search_label: Optional[str] = None  # required if search_mode == "label"


class MatchedIssue(BaseModel):
    title: str
    url: str
    repo: str
    labels: List[str]
    score: int


class AnalyzeResponse(BaseModel):
    status: Literal["needs_clarification", "complete"]
    skills: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    confidence: float = 0.0
    clarify_question: Optional[str] = None
    matched_issues: List[MatchedIssue] = Field(default_factory=list)
    searched_repos: List[str] = Field(default_factory=list)
    contributing_guide: Optional[str] = None