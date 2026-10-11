from groq import Groq
import json
import os
from dotenv import load_dotenv
load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def get_ai_feedback(question_text:str,user_answer:str):
    system_prompt = """
    You are a Senior Technical Recruiter. You are evaluating a candidate's SPOKEN answer 
    transcribed from audio.
    
    EVALUATION CRITERIA:
    1. Technical Accuracy: Did they explain the concepts (MERN, Python, etc.) correctly?
    2. Depth: Did they provide a "Senior" level explanation or just a "Junior" one-liner?
    3. Communication: Since this was spoken, is the answer structured? Did they wander off-topic?
    
    SCORING RUBRIC (1-10):
    - 1-3: Factually wrong or too brief (e.g., "I used React for frontend").
    - 4-6: Correct but lacks depth or "Why" (e.g., "I used Redux for state management").
    - 7-10: Excellent. Explains implementation, challenges, and results.

    RETURN ONLY a JSON object:
    {
        "score": (Integer),
        "feedback": "2 sentences of specific technical critique",
        "model_answer": "How a Top-Tier candidate would say this answer"
    }
    """

    user_content=f"Question:{question_text}\nCandidate Answer:{user_answer}"

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        response_format={"type": "json_object"}
    )
    
    return json.loads(response.choices[0].message.content)



def match_resume_jd(resume_text: str, job_description: str):
    system_prompt = """
You are an ATS system. Compare the resume to the job description.

RULES:
- matched_skills and missing_skills must be TECHNICAL SKILLS only (e.g. React, Docker, AWS)
- Do NOT include years of experience or soft skills in missing_skills
- missing_skills should only be tools, technologies, or frameworks

RETURN ONLY a JSON object:
{
    "match_score": (Integer 1-100),
    "matched_skills": ["skill1", "skill2"],
    "missing_skills": ["skill1", "skill2"],
    "suggestions": "2-3 sentences on how to improve the resume"
}
"""
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Resume:\n{resume_text}\n\nJob Description:\n{job_description}"}
        ],
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)




def generate_cover_letter(resume_text: str, job_description: str):
    system_prompt = """
    You are an expert career coach and professional writer.
    Write a compelling, personalized cover letter based on the resume and job description.
    
    RULES:
    - Keep it to 3 paragraphs max
    - Opening: Show enthusiasm and mention the role
    - Middle: Match top 3 skills from resume to JD requirements  
    - Closing: Call to action
    - Tone: Professional but human, not robotic
    - Do NOT use placeholder text like [Your Name] or [Company Name]
    - Write it as a ready-to-send letter
    
    RETURN ONLY a JSON object:
    {
        "cover_letter": "full cover letter text here",
        "key_points_highlighted": ["point1", "point2", "point3"]
    }
    """
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Resume:\n{resume_text}\n\nJob Description:\n{job_description}"}
        ],
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)



def generate_linkedin_bio(resume_text: str):
    system_prompt = """
    You are an expert LinkedIn profile writer.
    Generate a compelling LinkedIn summary/bio based on the resume.
    
    RULES:
    - Keep it between 3-5 sentences
    - Start with a strong opening hook, not "I am a developer"
    - Highlight top 3 technical skills naturally in the text
    - Mention key achievements or projects if present
    - End with what kind of opportunities you are open to
    - Tone: Professional, confident, first person
    
    RETURN ONLY a JSON object:
    {
        "bio": "full linkedin bio here",
        "headline": "a short 10 word linkedin headline",
        "top_skills": ["skill1", "skill2", "skill3"]
    }
    """
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Resume:\n{resume_text}"}
        ],
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)