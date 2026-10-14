
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.models import user, resume, chunks
from sqlalchemy import text
from app.routers import auth, resume, interview
from app.core.deps import get_current_user
from fastapi import  Request
from fastapi.responses import JSONResponse

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://ai-prep-murex.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str, request: Request):
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS, PUT, PATCH",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(interview.router)
with engine.connect() as connection:
    connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
    connection.execute(text("ALTER TABLE interview_question ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES interview_question(id) ON DELETE CASCADE;"))
    connection.execute(text("ALTER TABLE interview_question ADD COLUMN IF NOT EXISTS is_follow_up BOOLEAN DEFAULT FALSE;"))
    connection.execute(text("ALTER TABLE interview_question ADD COLUMN IF NOT EXISTS follow_up_depth INTEGER DEFAULT 0;"))
    connection.commit()
Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"status": "ok"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/protected")
def protected(user: str = Depends(get_current_user)):
    return {"message": f"Hello {user}"}