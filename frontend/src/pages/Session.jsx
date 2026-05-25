import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../components/layout/Sidebar";
import AudioRecorder from "../components/ui/AudioRecorder";
import ScoreRing from "../components/ui/ScoreRing";
import { fetchSessionThunk, evaluateAudioThunk, nextQuestion, prevQuestion, setCurrentIndex } from "../store/slices/interviewSlice";

export default function Session() {
  const { sessionId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { questions, currentIndex, answers, loading, evaluating, error } = useSelector((s) => s.interview);

  useEffect(() => { dispatch(fetchSessionThunk(sessionId)); }, [sessionId]);

  const current = questions[currentIndex];
  const answer = current
    ? answers[current.id] || (current.user_answer ? { score: current.score, feedback: current.ai_feedback, transcription: current.user_answer } : null)
    : null;

  const isLast = currentIndex === questions.length - 1;
  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] || q.user_answer);
  const progress = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;

  if (loading) return (
    <div className="flex min-h-screen bg-bg items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        <p className="text-white/40 text-sm">Loading session...</p>
      </div>
    </div>
  );

  if (!questions.length) return (
    <div className="flex min-h-screen bg-bg"><Sidebar />
      <main className="ml-0 md:ml-[220px] flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-white/40 mb-4">Session not found.</p>
          <button onClick={() => navigate("/interview")} className="px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold">New Interview</button>
        </div>
      </main>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="ml-0 md:ml-[220px] flex-1 p-4 md:p-8 pt-16 md:pt-8 overflow-x-hidden">
        <div className="fixed top-0 right-0 w-[350px] h-[350px] bg-accent/4 rounded-full blur-[100px] pointer-events-none" />

        {/* Progress */}
        <div className="flex items-center gap-4 mb-7 animate-fade-up">
          <div className="flex-1 h-1 bg-bg-4 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-white/30 font-mono whitespace-nowrap">{currentIndex + 1}/{questions.length}</span>
          <div className="flex gap-1">
            {questions.map((q, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                i === currentIndex ? "bg-accent scale-125" :
                (answers[q.id] || q.user_answer) ? "bg-green-400" : "bg-white/10"
              }`} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-5 items-start">
          {/* Main */}
          <div className="flex flex-col gap-4">
            {/* Question */}
            <div className="glass rounded-2xl p-6 gradient-border animate-fade-up">
              <span className="text-[11px] font-semibold text-accent-light uppercase tracking-widest block mb-3">Question {currentIndex + 1}</span>
              <p className="text-white text-lg font-medium leading-relaxed">{current?.question_text}</p>
            </div>

            {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">{error}</div>}

            {!answer ? (
              <AudioRecorder onSubmit={(blob) => dispatch(evaluateAudioThunk({ sessionId, questionId: current.id, audioBlob: blob }))} loading={evaluating} />
            ) : (
              <div className="glass rounded-2xl p-6 flex flex-col gap-5 animate-fade-up">
                {/* Score header */}
                <div className="flex items-center gap-5">
                  <ScoreRing score={answer.score} size={88} />
                  <div>
                    <p className="text-[11px] text-white/30 uppercase tracking-widest font-semibold mb-1">Score</p>
                    <p className="text-4xl font-black text-white">{answer.score}<span className="text-xl text-white/30 font-normal">/10</span></p>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div>
                  <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-2">Transcription</p>
                  <p className="text-sm text-white/60 bg-bg-4/50 rounded-xl p-3.5 leading-relaxed font-mono">{answer.transcription}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-2">AI Feedback</p>
                  <p className="text-sm text-white/80 leading-relaxed">{answer.feedback}</p>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  {currentIndex > 0 && (
                    <button onClick={() => dispatch(prevQuestion())}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-border-2 text-white/50 text-sm font-medium hover:bg-white/8 hover:text-white/80 transition-all">
                      ← Prev
                    </button>
                  )}
                  {!isLast ? (
                    <button onClick={() => dispatch(nextQuestion())}
                      className="btn-shine px-5 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-all shadow-glow-sm">
                      Next Question →
                    </button>
                  ) : allAnswered ? (
                    <button onClick={() => navigate("/history")}
                      className="btn-shine px-5 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-semibold hover:bg-green-500/30 transition-all">
                      View Results →
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* Question list */}
          <div className="glass rounded-2xl p-4 sticky top-6 animate-fade-up stagger-2">
            <p className="text-[11px] font-semibold text-white/25 uppercase tracking-widest mb-3">Questions</p>
            <div className="flex flex-col gap-1.5">
              {questions.map((q, i) => {
                const done = !!(answers[q.id] || q.user_answer);
                const active = i === currentIndex;
                return (
                  <button key={q.id} onClick={() => dispatch(setCurrentIndex(i))}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left w-full transition-all duration-200 ${
                      active ? "bg-accent/15 border border-accent/25" :
                      done ? "bg-white/3 border border-border" : "hover:bg-white/4 border border-transparent"
                    }`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      active ? "bg-accent text-white" :
                      done ? "bg-green-500/20 text-green-400" : "bg-white/8 text-white/30"
                    }`}>{done && !active ? "✓" : i + 1}</span>
                    <span className="text-[11px] text-white/40 truncate leading-tight">{q.question_text?.slice(0, 45)}…</span>
                  </button>
                );
              })}
            </div>
            {allAnswered && (
              <button onClick={() => navigate("/history")}
                className="mt-3 w-full py-2.5 rounded-xl bg-accent text-white text-sm font-semibold text-center hover:bg-accent/90 transition-all">
                Finish →
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
