from fastapi import APIRouter,UploadFile,File,Depends,HTTPException
from app.services.chunker import chunk_text
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
import shutil
from datetime import datetime
from PyPDF2 import PdfReader
from app.db.database import SessionLocal
from app.models.resume import Resume
from app.core.deps import get_current_user
from app.services.embedding import get_embedding
from app.models.chunks import Chunk
from app.services.search import search_chunks
from app.services.generate_interview import generate_interview
from app.models.interview import InterViewQuestion
from app.services.rag import generate_answer
from app.models.interview import InterViewQuestion,InterviewSession
from app.services.evaluate import get_ai_feedback
from app.models.user import User
from app.services.adaptive_agent import run_adaptive_evaluation
from app.services.cache import get_question_cached, get_ai_feedback_cached
from groq import Groq
import asyncio
import uuid
import os
import redis
from dotenv import load_dotenv

load_dotenv()

try:
    redis_client = redis.from_url(
        os.getenv("REDIS_URL", "redis://localhost:6379"),
        decode_responses=True
    )
except Exception:
    redis_client = None

router = APIRouter(prefix="/interview", tags=["interview"])





def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()





@router.get("/generate")
def generate(topic: str = "general", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    search_query = f"{topic} and technical implementation"
    res = search_chunks(search_query, db, user_id=current_user.id)
    session_id = str(uuid.uuid4())

    if not res:
        raise HTTPException(status_code=404, detail="No resume chunks found. Please upload a resume first.")

    chunks = [r.content for r in res]
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    questions_data = generate_interview(chunks, topic=topic)

   
    new_session = InterviewSession(
        id=session_id,
        user_id=current_user.id,
        topic=topic,
        created_at=datetime.utcnow()
    )
    db.add(new_session)
    db.flush() 

    for q_text in questions_data["questions"]:
        new_q = InterViewQuestion(
            user_id=current_user.id,
            resume_id=resume.id,
            topic=topic,
            session_id=session_id,
            question_text=q_text,
            is_follow_up=False,
            follow_up_depth=0,
            parent_id=None,
            created_at=datetime.utcnow()
        )
        db.add(new_q)

    db.commit()

    return {
        "user_id": current_user.id,
        "session_id": session_id,
        "questions": questions_data
    }

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@router.post("/evaluate-audio/{session_id}/{question_id}")
async def evaluate_and_save_audio_answer(
    question_id: int,
    session_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db_question = db.query(InterViewQuestion).filter(
        InterViewQuestion.id == question_id,
        InterViewQuestion.session_id == session_id,
        InterViewQuestion.user_id == user.id
    ).first()

    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found in this session")

    temp_path = f"temp_{user.id}_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        loop = asyncio.get_event_loop()
        transcription_result = await loop.run_in_executor(
            None,
            lambda: client.audio.transcriptions.create(
                file=(temp_path, open(temp_path, "rb").read()),
                model="whisper-large-v3-turbo",
                response_format="text"
            )
        )
        user_text_answer = str(transcription_result).strip()

        # Reconstruct thread history if this is answering a follow-up
        conversation_history = []
        if db_question.parent_id:
            parent_q = db.query(InterViewQuestion).filter(InterViewQuestion.id == db_question.parent_id).first()
            if parent_q and parent_q.user_answer:
                conversation_history.append({
                    "question": parent_q.question_text,
                    "answer": parent_q.user_answer
                })

        # Run the Adaptive Agent evaluation and autonomous decision loop
        agent_outcome = run_adaptive_evaluation(
            question_text=db_question.question_text,
            user_answer=user_text_answer,
            conversation_history=conversation_history,
            current_depth=db_question.follow_up_depth or 0,
            max_depth=1
        )

        db_question.user_answer = user_text_answer
        db_question.ai_feedback = agent_outcome.get("feedback")
        db_question.score = agent_outcome.get("score")
        db_question.created_at = func.now()

        # Invalidate cache if redis is running
        if redis_client:
            try:
                cache_key = f"question:{user.id}:{session_id}:{question_id}"
                redis_client.delete(cache_key)
            except Exception:
                pass

        # Case 1: Agent decides to drill down with a targeted Follow-Up
        if agent_outcome.get("decision") == "FOLLOW_UP" and agent_outcome.get("follow_up_question"):
            follow_up_q = InterViewQuestion(
                user_id=user.id,
                resume_id=db_question.resume_id,
                session_id=session_id,
                topic=db_question.topic,
                question_text=agent_outcome["follow_up_question"],
                parent_id=db_question.id,
                is_follow_up=True,
                follow_up_depth=(db_question.follow_up_depth or 0) + 1,
                created_at=datetime.utcnow()
            )
            db.add(follow_up_q)
            db.commit()
            db.refresh(follow_up_q)
            db.refresh(db_question)

            return {
                "message": "Follow-up question generated by Interviewer Agent",
                "status": "follow_up",
                "decision": "FOLLOW_UP",
                "transcription": user_text_answer,
                "score": db_question.score,
                "feedback": db_question.ai_feedback,
                "model_answer": agent_outcome.get("model_answer"),
                "follow_up": {
                    "id": follow_up_q.id,
                    "parent_id": db_question.id,
                    "question_text": follow_up_q.question_text,
                    "follow_up_depth": follow_up_q.follow_up_depth
                }
            }

        # Case 2: Conversation thread is complete
        # If this was answering a follow-up, synthesize final score onto parent question
        if db_question.parent_id:
            parent_q = db.query(InterViewQuestion).filter(InterViewQuestion.id == db_question.parent_id).first()
            if parent_q:
                parent_q.score = db_question.score
                if agent_outcome.get("feedback"):
                    parent_q.ai_feedback = f"{parent_q.ai_feedback or ''} \n\n[Follow-up Assessment]: {agent_outcome.get('feedback')}"

        db.commit()
        db.refresh(db_question)

        return {
            "message": "Audio processed and evaluation completed",
            "status": "complete",
            "decision": "COMPLETE",
            "transcription": user_text_answer,
            "score": db_question.score,
            "feedback": db_question.ai_feedback,
            "model_answer": agent_outcome.get("model_answer"),
            "parent_id": db_question.parent_id
        }

    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

@router.get("/stats")
def get_user_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    stats = db.query(
        InterViewQuestion.topic,
        func.avg(InterViewQuestion.score).label("average_score"),
        func.count(InterViewQuestion.id).label("total_questions")
    ).filter(
        InterViewQuestion.user_id == user.id,
        (InterViewQuestion.is_follow_up == False) | (InterViewQuestion.is_follow_up == None)
    ).group_by(InterViewQuestion.topic).all()

    return [
        {
            "topic": row.topic,
            "average_score": round(float(row.average_score), 2) if row.average_score else 0,
            "total_questions": row.total_questions
        }
        for row in stats
    ]

@router.get("/session-report/{session_id}")
def get_session_report(
    session_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    all_questions = db.query(InterViewQuestion).filter(
        InterViewQuestion.session_id == session_id,
        InterViewQuestion.user_id == current_user.id
    ).order_by(InterViewQuestion.id.asc()).all()

    if not all_questions:
        raise HTTPException(status_code=404, detail="Session not found")

    topic = all_questions[0].topic if all_questions else "Unknown"

    root_questions = [q for q in all_questions if not q.is_follow_up and q.parent_id is None]
    if not root_questions:
        root_questions = all_questions

    # Group follow-ups by parent_id
    follow_up_map = {}
    for q in all_questions:
        if q.parent_id:
            follow_up_map.setdefault(q.parent_id, []).append({
                "id": q.id,
                "session_id": q.session_id,
                "topic": q.topic,
                "question_text": q.question_text,
                "user_answer": q.user_answer,
                "ai_feedback": q.ai_feedback,
                "score": q.score,
                "created_at": q.created_at.isoformat() if q.created_at else None,
                "is_follow_up": True,
                "follow_up_depth": q.follow_up_depth or 1
            })

    formatted_details = []
    for q in root_questions:
        formatted_details.append({
            "id": q.id,
            "session_id": q.session_id,
            "topic": q.topic,
            "question_text": q.question_text,
            "user_answer": q.user_answer,
            "ai_feedback": q.ai_feedback,
            "score": q.score,
            "created_at": q.created_at.isoformat() if q.created_at else None,
            "is_follow_up": False,
            "follow_up_depth": 0,
            "follow_ups": follow_up_map.get(q.id, [])
        })

    total_questions = len(root_questions)
    answered_count = len([q for q in root_questions if q.user_answer is not None])
    status = "Completed" if answered_count == total_questions else "In Progress"

    scores = [q.score for q in root_questions if q.score is not None]
    avg_score = sum(scores) / len(scores) if scores else 0

    return {
        "session_id": session_id,
        "topic": topic,
        "status": status, 
        "progress": f"{answered_count}/{total_questions}", 
        "average_score": round(avg_score, 2),
        "total_questions": total_questions,
        "answered_questions": answered_count,
        "details": formatted_details 
    }

@router.get("/history")
def get_interview_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    history = db.query(
        InterViewQuestion.session_id,
        InterViewQuestion.topic,
        func.max(InterViewQuestion.created_at).label("date"),
        func.avg(InterViewQuestion.score).label("avg_score"),
        func.count(InterViewQuestion.id).label("total_q"),
        func.count(InterViewQuestion.user_answer).label("answered_q")
    ).filter(
        InterViewQuestion.user_id == current_user.id,
        (InterViewQuestion.is_follow_up == False) | (InterViewQuestion.is_follow_up == None)
    ).group_by(InterViewQuestion.session_id, InterViewQuestion.topic)\
     .order_by(func.max(InterViewQuestion.created_at).desc()).all()

    return [
        {
            "session_id": row.session_id,
            "topic": row.topic,
            "date": row.date,
            "avg_score": round(float(row.avg_score), 2) if row.avg_score else 0,
            "is_completed": row.total_q == row.answered_q,
            "progress": f"{row.answered_q}/{row.total_q}"
        } for row in history
    ]