from groq import Groq
import json
import os
from dotenv import load_dotenv
load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_interview(chunks: list[str],topic:str):
   
    context = "\n\n---\n\n".join([f"[SECTION {i+1}] {c.strip()}" for i, c in enumerate(chunks)])
    print("context",context)
    
    system_prompt = f"""
You are a Senior Technical Interviewer. Your goal is to conduct a deep-dive interview focused SPECIFICALLY on the following topic: {topic}.

INSTRUCTIONS:
1. Use the provided resume context to generate 10 high-quality technical questions.
2. If the topic is 'Projects', focus on system architecture, database choices, and trade-offs.
3. If the topic is 'Core Subjects', focus on theoretical foundations like DBMS, Operating Systems, or Networking.
4. If the topic is 'Internship', focus on professional contributions, codebase navigation, and team collaboration.
5. If the resume context for '{topic}' is thin, ask foundational industry-standard questions related to that field.

Return ONLY a valid JSON object with this exact structure:
{{
    "questions": [
        "Question 1 here?",
        "Question 2 here?",
        "..."
    ]
}}
Do not add any extra text, markdown, or explanations.
"""
    
    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Candidate Context:\n{context}"}
            ],
            model="openai/gpt-oss-120b",
            temperature=0.7,
            max_tokens=1200,
            response_format={"type": "json_object"}
        )

       
        content = response.choices[0].message.content.strip()
        
        result = json.loads(content)
        
        
        if not isinstance(result.get("questions"), list):
            raise ValueError("JSON does not contain 'questions' as a list")
            
        return result

    except json.JSONDecodeError as e:
        return {
            "error": f"Failed to parse JSON from model: {str(e)}",
            "raw_response": content if 'content' in locals() else None,
            "questions": [],
            "status": "failure"
        }
    except Exception as e:
        return {
            "error": str(e),
            "questions": [],
            "status": "failure"
        }