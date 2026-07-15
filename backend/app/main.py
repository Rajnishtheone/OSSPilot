"""
The web server. One real endpoint: POST /api/analyze
Run locally with:  uvicorn app.main:app --reload
"""

from dotenv import load_dotenv
load_dotenv()  # reads backend/.env locally; Render/production sets real env vars directly

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models import AnalyzeRequest, AnalyzeResponse, MatchedIssue
from app.graph import graph

app = FastAPI(title="OSSPilot API")

# Allow your deployed frontend (and localhost while developing) to call this API.
# In production, replace "*" with your actual Vercel URL for tighter security.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest):
    if request.search_mode == "label" and not request.search_label:
        raise HTTPException(status_code=400, detail="search_label is required when search_mode is 'label'")

    try:
        result = graph.invoke({
            "user_message": request.message,
            "experience_level": request.experience_level,
            "search_mode": request.search_mode,
            "search_label": request.search_label,
            "skills": [],
            "interests": [],
            "confidence": 0.0,
            "matched_issues": [],
            "searched_repos": [],
            "contributing_guide": None,
        })
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Agent error: {str(e)}")

    if result["confidence"] < 0.6:
        return AnalyzeResponse(
            status="needs_clarification",
            skills=result["skills"],
            interests=result["interests"],
            confidence=result["confidence"],
            clarify_question="Could you tell me more specifically which technologies you know and what kind of work interests you?",
        )

    return AnalyzeResponse(
        status="complete",
        skills=result["skills"],
        interests=result["interests"],
        confidence=result["confidence"],
        matched_issues=[
            MatchedIssue(
                title=i["title"], url=i["url"], repo=i["repo"],
                labels=i["labels"], score=i["score"],
            )
            for i in result["matched_issues"]
        ],
        searched_repos=result["searched_repos"],
        contributing_guide=result["contributing_guide"],
    )
