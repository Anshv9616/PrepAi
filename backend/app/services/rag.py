

from groq import Groq
import json
import os
from dotenv import load_dotenv
load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


 # your client

def generate_answer(query: str, chunks: list[str]):
    context = "\n\n---\n\n".join([f"[SECTION {i+1}] {c.strip()}" for i, c in enumerate(chunks)])

    system_prompt = """You are Ansh Verma's personal Resume Interview Coach (very helpful & honest).

Rules:
- For factual questions → Answer directly from resume. If not explicit → say "Not explicitly mentioned" and mention closest evidence.
- For "generate", "rate", "suggest", "improve" questions → Be creative but grounded in resume. Always give score/reason + 2-3 bullet points.
- ALWAYS return valid JSON only.

JSON format:
{
  "answer": "Full clear answer here (include score/explanation if needed)",
  "sources": ["short relevant snippet 1", "short relevant snippet 2"],
  "confidence": 92,
  "confidence_label": "HIGH"          // only use HIGH / MEDIUM / LOW
}
"""

    try:
        chat = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Resume Context:\n{context}\n\nUser Question: {query}"}
            ],
            model="openai/gpt-oss-120b",
            temperature=0.2,
            max_tokens=500,
            response_format={"type": "json_object"}
        )

        return json.loads(chat.choices[0].message.content)

    except:
        return {
            "answer": "Error generating response",
            "sources": [],
            "confidence": 0,
            "confidence_label": "LOW"
        }