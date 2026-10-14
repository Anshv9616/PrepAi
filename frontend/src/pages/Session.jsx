import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../components/layout/Sidebar";
import AudioRecorder from "../components/ui/AudioRecorder";
import ScoreRing from "../components/ui/ScoreRing";
import {
  fetchSessionThunk,
  evaluateAudioThunk,
  nextQuestion,
  prevQuestion,
  setCurrentIndex,
} from "../store/slices/interviewSlice";

export default function Session() {
  const { sessionId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { questions, currentIndex, answers, loading, evaluating, error } =
    useSelector((s) => s.interview);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [speakingKey, setSpeakingKey] = useState(null);

  useEffect(() => {
    dispatch(fetchSessionThunk(sessionId));
  }, [sessionId, dispatch]);

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Cancel speech when switching questions
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingKey(null);
  }, [currentIndex]);

  const toggleSpeech = (key, text) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    // If currently dictating this item, cancel and stop
    if (speakingKey === key) {
      window.speechSynthesis.cancel();
      setSpeakingKey(null);
      return;
    }

    // Cancel any previous speech before starting
    window.speechSynthesis.cancel();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setSpeakingKey((prev) => (prev === key ? null : prev));
    };

    utterance.onerror = () => {
      setSpeakingKey((prev) => (prev === key ? null : prev));
    };

    window.speechSynthesis.speak(utterance);
    setSpeakingKey(key);
  };

  const handleAudioSubmit = (targetQuestionId, blob) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingKey(null);
    dispatch(
      evaluateAudioThunk({
        sessionId,
        questionId: targetQuestionId,
        audioBlob: blob,
      })
    );
  };

  const current = questions[currentIndex];
  const answer = current
    ? answers[current.id] ||
      (current.user_answer
        ? {
            score: current.score,
            feedback: current.ai_feedback,
            transcription: current.user_answer,
            status: "complete",
            isFollowUpPending: false,
            follow_ups: current.follow_ups,
          }
        : null)
    : null;

  const isLast = currentIndex === questions.length - 1;
  const allAnswered =
    questions.length > 0 &&
    questions.every((q) => {
      const ans = answers[q.id];
      return (ans && !ans.isFollowUpPending) || q.user_answer;
    });

  const progress = questions.length
    ? ((currentIndex + 1) / questions.length) * 100
    : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-bg items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="flex min-h-screen bg-bg">
        <Sidebar />
        <main className="ml-0 md:ml-[220px] flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-white/40 mb-4">Session not found.</p>
            <button
              onClick={() => navigate("/interview")}
              className="px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold"
            >
              New Interview
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="ml-0 md:ml-[220px] flex-1 p-4 md:p-8 pt-16 md:pt-8 overflow-x-hidden">
        <div className="fixed top-0 right-0 w-[350px] h-[350px] bg-accent/4 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Progress Bar */}
        <div className="flex items-center gap-4 mb-7 animate-fade-up">
          <div className="flex-1 h-1 bg-bg-4 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-white/30 font-mono whitespace-nowrap">
            {currentIndex + 1}/{questions.length}
          </span>
          <div className="flex gap-1">
            {questions.map((q, i) => {
              const ans = answers[q.id];
              const isDone = (ans && !ans.isFollowUpPending) || q.user_answer;
              const hasFollowUp =
                ans?.isFollowUpPending ||
                (q.follow_ups && q.follow_ups.length > 0);

              return (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    i === currentIndex
                      ? "bg-accent scale-125"
                      : isDone
                      ? "bg-green-400"
                      : hasFollowUp
                      ? "bg-amber-400"
                      : "bg-white/10"
                  }`}
                />
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 items-start">
          {/* Main Interview Area */}
          <div className="flex flex-col gap-4">
            {/* Main Question Card */}
            <div className="glass rounded-2xl p-6 gradient-border animate-fade-up">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-accent-light uppercase tracking-widest block">
                  Question {currentIndex + 1}
                </span>
                <button
                  onClick={() => toggleSpeech("question", current?.question_text)}
                  title={speakingKey === "question" ? "Stop dictation" : "Listen to Question"}
                  className={`text-xs flex items-center gap-1.5 transition-all px-2.5 py-1 rounded-lg font-medium ${
                    speakingKey === "question"
                      ? "text-red-400 bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 animate-pulse"
                      : "text-white/50 hover:text-accent-light bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {speakingKey === "question" ? "⏹ Stop" : "🔊 Listen"}
                </button>
              </div>
              <p className="text-white text-lg font-medium leading-relaxed">
                {current?.question_text}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
                {error}
              </div>
            )}

            {/* Turn 1: Initial Answer Not Submitted Yet */}
            {!answer && (
              <div className="animate-fade-up">
                <AudioRecorder
                  onSubmit={(blob) => handleAudioSubmit(current.id, blob)}
                  loading={evaluating}
                />
              </div>
            )}

            {/* Turn 2: Follow-Up Triggered by Adaptive Agent */}
            {answer?.isFollowUpPending && answer?.activeFollowUp && (
              <div className="flex flex-col gap-4 animate-fade-up">
                {/* Candidate's First Response Bubble */}
                {answer.transcription && (
                  <div className="glass rounded-xl p-4 border border-white/5 bg-white/2">
                    <span className="text-[11px] font-semibold text-white/40 uppercase tracking-widest block mb-1">
                      Your Initial Response
                    </span>
                    <p className="text-sm text-white/80 leading-relaxed font-mono">
                      "{answer.transcription}"
                    </p>
                  </div>
                )}

                {/* Adaptive Interviewer Follow-Up Card */}
                <div className="glass rounded-2xl p-6 border border-accent/40 bg-accent/5 relative overflow-hidden shadow-glow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
                      </span>
                      <span className="text-xs font-bold text-accent-light uppercase tracking-wider">
                        Interviewer Follow-Up (Adaptive Agent)
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        toggleSpeech("followup", answer.activeFollowUp.question_text)
                      }
                      title={speakingKey === "followup" ? "Stop dictation" : "Listen to Follow-up"}
                      className={`text-xs flex items-center gap-1.5 transition-all px-2.5 py-1 rounded-lg font-medium ${
                        speakingKey === "followup"
                          ? "text-red-300 bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 animate-pulse"
                          : "text-accent-light hover:text-white bg-accent/20 hover:bg-accent/30"
                      }`}
                    >
                      {speakingKey === "followup" ? "⏹ Stop" : "🔊 Listen"}
                    </button>
                  </div>

                  <p className="text-white text-base font-semibold leading-relaxed mb-2">
                    {answer.activeFollowUp.question_text}
                  </p>
                  <p className="text-xs text-white/50 mb-5">
                    💡 The agent detected a surface-level response or key trade-off. Drill down into specific mechanisms, architecture, or edge cases.
                  </p>

                  {/* Audio Recorder for the follow-up */}
                  <AudioRecorder
                    onSubmit={(blob) =>
                      handleAudioSubmit(answer.activeFollowUp.id, blob)
                    }
                    loading={evaluating}
                  />
                </div>
              </div>
            )}

            {/* Turn 3: Question Completed (Final Score & Full Thread) */}
            {answer && !answer.isFollowUpPending && (
              <div className="glass rounded-2xl p-6 flex flex-col gap-5 animate-fade-up">
                {/* Score Header */}
                <div className="flex items-center gap-5">
                  <ScoreRing score={answer.score} size={88} />
                  <div>
                    <p className="text-[11px] text-white/30 uppercase tracking-widest font-semibold mb-1">
                      Final Topic Score
                    </p>
                    <p className="text-4xl font-black text-white">
                      {answer.score}
                      <span className="text-xl text-white/30 font-normal">
                        /10
                      </span>
                    </p>
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Candidate Transcription */}
                <div>
                  <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-2">
                    Transcription
                  </p>
                  <p className="text-sm text-white/70 bg-bg-4/50 rounded-xl p-3.5 leading-relaxed font-mono">
                    {answer.transcription}
                  </p>
                </div>

                {/* If there was a follow-up answer */}
                {answer.followUpAnswer && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-accent-light uppercase px-2 py-0.5 rounded bg-accent/15">
                        Probe Answer
                      </span>
                      <span className="text-[11px] text-white/40 font-semibold uppercase tracking-widest">
                        Follow-Up Response
                      </span>
                    </div>
                    <p className="text-sm text-white/70 bg-bg-4/50 rounded-xl p-3.5 leading-relaxed font-mono">
                      {answer.followUpAnswer.transcription}
                    </p>
                  </div>
                )}

                {/* AI Critique & Feedback */}
                <div>
                  <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-2">
                    Interviewer Feedback & Critique
                  </p>
                  <p className="text-sm text-white/90 leading-relaxed bg-white/3 rounded-xl p-4 border border-white/5 whitespace-pre-line">
                    {answer.feedback}
                  </p>
                </div>

                {/* Model Answer Toggle */}
                {answer.model_answer && (
                  <div className="border border-white/5 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setShowModelAnswer(!showModelAnswer)}
                      className="w-full px-4 py-2.5 bg-white/2 hover:bg-white/4 flex items-center justify-between text-xs font-semibold text-white/60 transition-colors"
                    >
                      <span>🌟 Top-Tier Candidate Model Answer</span>
                      <span>{showModelAnswer ? "▲ Hide" : "▼ Show"}</span>
                    </button>
                    {showModelAnswer && (
                      <div className="p-4 bg-bg-4/40 text-xs text-white/80 leading-relaxed font-mono border-t border-white/5">
                        {answer.model_answer}
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-3 justify-end pt-2">
                  {currentIndex > 0 && (
                    <button
                      onClick={() => {
                        setShowModelAnswer(false);
                        dispatch(prevQuestion());
                      }}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-border-2 text-white/50 text-sm font-medium hover:bg-white/8 hover:text-white/80 transition-all"
                    >
                      ← Prev
                    </button>
                  )}
                  {!isLast ? (
                    <button
                      onClick={() => {
                        setShowModelAnswer(false);
                        dispatch(nextQuestion());
                      }}
                      className="btn-shine px-5 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-all shadow-glow-sm"
                    >
                      Next Question →
                    </button>
                  ) : allAnswered ? (
                    <button
                      onClick={() => navigate("/history")}
                      className="btn-shine px-5 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-semibold hover:bg-green-500/30 transition-all"
                    >
                      View Results →
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* Right Question Sidebar */}
          <div className="glass rounded-2xl p-4 sticky top-6 animate-fade-up stagger-2">
            <p className="text-[11px] font-semibold text-white/25 uppercase tracking-widest mb-3">
              Questions
            </p>
            <div className="flex flex-col gap-1.5">
              {questions.map((q, i) => {
                const ans = answers[q.id];
                const done = (ans && !ans.isFollowUpPending) || q.user_answer;
                const isPendingFollowUp = ans?.isFollowUpPending;
                const active = i === currentIndex;
                const hadFollowUp =
                  (q.follow_ups && q.follow_ups.length > 0) ||
                  ans?.followUpAnswer;

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setShowModelAnswer(false);
                      dispatch(setCurrentIndex(i));
                    }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left w-full transition-all duration-200 ${
                      active
                        ? "bg-accent/15 border border-accent/25"
                        : done
                        ? "bg-white/3 border border-border"
                        : isPendingFollowUp
                        ? "bg-amber-500/10 border border-amber-500/30"
                        : "hover:bg-white/4 border border-transparent"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        active
                          ? "bg-accent text-white"
                          : done
                          ? "bg-green-500/20 text-green-400"
                          : isPendingFollowUp
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-white/8 text-white/30"
                      }`}
                    >
                      {done && !active ? "✓" : i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] text-white/60 truncate block leading-tight">
                        {q.question_text?.slice(0, 38)}…
                      </span>
                      {hadFollowUp && (
                        <span className="text-[9px] text-accent-light font-medium block mt-0.5">
                          ✦ Adaptive Probe
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {allAnswered && (
              <button
                onClick={() => navigate("/history")}
                className="mt-4 w-full py-2.5 rounded-xl bg-accent text-white text-sm font-semibold text-center hover:bg-accent/90 transition-all shadow-glow-sm"
              >
                Finish & View Summary →
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
