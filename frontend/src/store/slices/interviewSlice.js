import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { interviewService } from "../../services/interviewService";
import toast from "react-hot-toast";

export const generateQuestionsThunk = createAsyncThunk(
  "interview/generate",
  async (topic, { rejectWithValue }) => {
    const toastId = toast.loading("Generating questions from your resume...");
    try {
      const data = await interviewService.generateQuestions(topic);
      toast.success(`10 questions ready!`, { id: toastId });
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to generate";
      toast.error(msg, { id: toastId });
      return rejectWithValue(msg);
    }
  }
);

export const fetchSessionThunk = createAsyncThunk(
  "interview/fetchSession",
  async (sessionId, { rejectWithValue }) => {
    try {
      return await interviewService.getSessionReport(sessionId);
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Session not found");
    }
  }
);

export const evaluateAudioThunk = createAsyncThunk(
  "interview/evaluateAudio",
  async ({ sessionId, questionId, audioBlob }, { rejectWithValue }) => {
    try {
      const result = await interviewService.evaluateAudio(sessionId, questionId, audioBlob);
      if (result.status === "follow_up") {
        toast("Interviewer follow-up incoming!", { icon: "🎯" });
      } else {
        toast.success(`Completed topic: ${result.score}/10`);
      }
      return { questionId, result };
    } catch (err) {
      const msg = err.response?.data?.detail || "Evaluation failed";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);
export const fetchHistoryThunk = createAsyncThunk(
  "interview/fetchHistory",
  async (_, { rejectWithValue }) => {
    try {
      return await interviewService.getHistory();
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to load history");
    }
  }
);

export const fetchStatsThunk = createAsyncThunk(
  "interview/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      return await interviewService.getStats();
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to load stats");
    }
  }
);

const interviewSlice = createSlice({
  name: "interview",
  initialState: {
    sessionId: null,
    questions: [],
    currentIndex: 0,
    answers: {},
    history: [],
    stats: [],
    loading: false,
    evaluating: false,
    error: null,
  },
  reducers: {
    setCurrentIndex: (state, action) => { state.currentIndex = action.payload; },
    nextQuestion: (state) => {
      state.currentIndex = Math.min(state.currentIndex + 1, state.questions.length - 1);
    },
    prevQuestion: (state) => {
      state.currentIndex = Math.max(state.currentIndex - 1, 0);
    },
    clearSession: (state) => {
      state.sessionId = null;
      state.questions = [];
      state.currentIndex = 0;
      state.answers = {};
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // Generate
      .addCase(generateQuestionsThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(generateQuestionsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.sessionId = action.payload.session_id;
        state.questions = action.payload.questions.questions;
        state.currentIndex = 0;
        state.answers = {};
      })
      .addCase(generateQuestionsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch session
      .addCase(fetchSessionThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSessionThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.sessionId = action.payload.session_id;
        state.questions = action.payload.details || [];
        state.currentIndex = 0;
        state.answers = {};
        if (Array.isArray(action.payload.details)) {
          action.payload.details.forEach((q) => {
            if (q.user_answer) {
              const followUp = q.follow_ups && q.follow_ups.length > 0 ? q.follow_ups[0] : null;
              const hasUnansweredFollowUp = followUp && !followUp.user_answer;
              state.answers[q.id] = {
                score: q.score,
                feedback: q.ai_feedback,
                transcription: q.user_answer,
                status: hasUnansweredFollowUp ? "follow_up" : "complete",
                isFollowUpPending: hasUnansweredFollowUp,
                activeFollowUp: hasUnansweredFollowUp ? followUp : null,
                followUpAnswer: followUp && followUp.user_answer ? {
                  question_text: followUp.question_text,
                  transcription: followUp.user_answer,
                  score: followUp.score,
                  feedback: followUp.ai_feedback
                } : null
              };
            }
          });
        }
      })
      .addCase(fetchSessionThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Evaluate audio
      .addCase(evaluateAudioThunk.pending, (state) => { state.evaluating = true; state.error = null; })
      .addCase(evaluateAudioThunk.fulfilled, (state, action) => {
        state.evaluating = false;
        const { questionId, result } = action.payload;

        if (result.status === "follow_up") {
          // Store follow-up on the parent question in state.answers
          state.answers[questionId] = {
            ...result,
            isFollowUpPending: true,
            activeFollowUp: result.follow_up
          };
          // Also attach follow-up to the corresponding question in state.questions
          const q = state.questions.find((item) => item.id === questionId);
          if (q) {
            if (!q.follow_ups) q.follow_ups = [];
            q.follow_ups.push(result.follow_up);
          }
        } else {
          // Status is complete
          if (result.parent_id) {
            const parentId = result.parent_id;
            const parentAns = state.answers[parentId] || {};
            state.answers[parentId] = {
              ...parentAns,
              score: result.score,
              feedback: result.feedback,
              model_answer: result.model_answer,
              isFollowUpPending: false,
              activeFollowUp: null,
              followUpAnswer: {
                transcription: result.transcription,
                score: result.score,
                feedback: result.feedback
              }
            };
            const q = state.questions.find((item) => item.id === parentId);
            if (q) {
              q.score = result.score;
              q.ai_feedback = result.feedback;
              if (q.follow_ups && q.follow_ups.length > 0) {
                const f = q.follow_ups.find((item) => item.id === questionId);
                if (f) {
                  f.user_answer = result.transcription;
                  f.score = result.score;
                  f.ai_feedback = result.feedback;
                }
              }
            }
          } else {
            // Direct complete on root question
            state.answers[questionId] = {
              ...result,
              isFollowUpPending: false,
              activeFollowUp: null
            };
            const q = state.questions.find((item) => item.id === questionId);
            if (q) {
              q.score = result.score;
              q.ai_feedback = result.feedback;
              q.user_answer = result.transcription;
            }
          }
        }
      })
      .addCase(evaluateAudioThunk.rejected, (state, action) => {
        state.evaluating = false;
        state.error = action.payload;
      })
      // History
      .addCase(fetchHistoryThunk.fulfilled, (state, action) => { state.history = action.payload; })
      // Stats
      .addCase(fetchStatsThunk.fulfilled, (state, action) => { state.stats = action.payload; });
  },
});

export const { setCurrentIndex, nextQuestion, prevQuestion, clearSession, clearError } =
  interviewSlice.actions;
export default interviewSlice.reducer;
