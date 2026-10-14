import json
import os
from pathlib import Path
from groq import Groq
from dotenv import load_dotenv

# Resolve .env from backend directory reliably
backend_env = Path(__file__).resolve().parent.parent.parent / ".env"
if backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
else:
    load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Using the high-capacity model available in Groq environment
GROQ_MODEL = "openai/gpt-oss-120b"

def run_adaptive_evaluation(
    question_text: str,
    user_answer: str,
    conversation_history: list[dict] = None,
    current_depth: int = 0,
    max_depth: int = 1
) -> dict:
    """
    Adaptive Agent Decision Node (without LangGraph):
    Inspects spoken answer transcript, evaluates technical depth,
    and autonomously decides whether to branch into a follow-up probe or conclude the question.
    """
    if conversation_history is None:
        conversation_history = []

    can_follow_up = current_depth < max_depth

    system_prompt = f"""
You are a Principal Technical Interviewer at a top-tier tech company conducting a voice-based technical interview.
You listen to the candidate's transcribed spoken answer and critically evaluate their technical depth.

INTERVIEW STATE:
- Follow-up questions asked so far for this topic: {current_depth}
- Maximum allowed follow-ups: {max_depth}
- Can trigger follow-up: {can_follow_up}

EVALUATION CRITERIA:
1. Technical Depth: Did the candidate explain the underlying mechanisms, 'why' choices were made, or just mention buzzwords?
2. Architectural Trade-offs: Did they mention edge cases, performance implications, or failure scenarios?
3. Communication & Structure: Did they stay focused and structured?

AGENT DECISION POLICY:
- If 'Can trigger follow-up' is TRUE AND:
    (a) The candidate gave a surface-level, brief, or incomplete explanation (e.g., "I used Redis for caching" without explaining invalidation/TTL), OR
    (b) The candidate made a strong claim that warrants a deeper architectural challenge:
  --> Set "decision": "FOLLOW_UP"
  --> Generate a targeted, conversational "follow_up_question" directly challenging or probing the concept they brought up.
  --> Provide "interim_feedback" with a 1-sentence critique.
  --> Provide an "interim_score" (1-10).

- If 'Can trigger follow-up' is FALSE OR the candidate's answer was comprehensive, clear, and demonstrated senior mastery:
  --> Set "decision": "COMPLETE"
  --> Set "follow_up_question": null
  --> Provide the final "score" (Integer 1-10) using this rubric:
      * 1-3: Factually wrong, completely missed the question, or too brief (<10 words).
      * 4-6: Factually correct on surface, but junior level, lacking 'how/why' or trade-offs.
      * 7-10: Senior level, clear architecture, explains trade-offs, challenges, and implementation details.
  --> Provide "feedback" (2-3 sentences of clear technical evaluation).
  --> Provide "model_answer" (How a top-tier candidate would explain this).

YOU MUST RESPOND ONLY WITH A VALID JSON OBJECT WITH THIS EXACT STRUCTURE:
{{
    "internal_reflection": "Short critique of candidate answer",
    "decision": "FOLLOW_UP" or "COMPLETE",
    "follow_up_question": "Your probing follow-up question string here, or null",
    "score": 7,
    "feedback": "Specific technical critique here",
    "model_answer": "Top-tier reference answer here"
}}
Do NOT output markdown backticks, explanations, or any extra text outside the JSON.
"""

    messages = [{"role": "system", "content": system_prompt}]

    # Reconstruct prior dialogue turns in this thread if any
    for turn in conversation_history:
        messages.append({"role": "assistant", "content": f"Interviewer: {turn.get('question', '')}"})
        messages.append({"role": "user", "content": f"Candidate: {turn.get('answer', '')}"})

    # Current turn
    messages.append({
        "role": "user",
        "content": f"Question: {question_text}\nCandidate Answer: {user_answer}"
    })

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.3,
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content.strip()
        data = json.loads(content)

        # Enforce consistency: if can_follow_up is False, decision MUST be COMPLETE
        if not can_follow_up:
            data["decision"] = "COMPLETE"
            data["follow_up_question"] = None

        return data

    except Exception as e:
        # Fallback to complete if any LLM or JSON decoding issue arises
        return {
            "internal_reflection": f"Evaluation fallback triggered: {str(e)}",
            "decision": "COMPLETE",
            "follow_up_question": None,
            "score": 6,
            "feedback": "Your response was recorded. Focus on articulating system trade-offs and concrete implementation details.",
            "model_answer": "Top candidates clearly define the problem statement, justify technical choices with trade-offs, and describe edge-case handling."
        }
