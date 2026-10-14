from app.db.database import Base
from sqlalchemy import Column,Integer,ForeignKey,Text,DateTime,String,Float,Boolean
from sqlalchemy.sql import func
from uuid import uuid4
from sqlalchemy.orm import relationship
from datetime import datetime
class InterViewQuestion(Base):
    __tablename__ = "interview_question"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    resume_id  = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), index=True)
    session_id = Column(String,  ForeignKey("interview_sessions.id", ondelete="CASCADE"), index=True)

    parent_id       = Column(Integer, ForeignKey("interview_question.id", ondelete="CASCADE"), nullable=True)
    is_follow_up    = Column(Boolean, default=False)
    follow_up_depth = Column(Integer, default=0)

    question_text = Column(Text,    nullable=False)
    user_answer   = Column(Text,    nullable=True)
    ai_feedback   = Column(Text,    nullable=True)
    score         = Column(Float,   nullable=True)
    topic         = Column(String,  nullable=True)
    created_at    = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="questions")



class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    topic = Column(String) 
    created_at = Column(DateTime, server_default=func.now())
    
    questions = relationship("InterViewQuestion", back_populates="session")

