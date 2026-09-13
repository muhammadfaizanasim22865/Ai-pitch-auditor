import json
from groq import Groq
from config import Config


class CrossExaminer:
    """
    NOTE: This service did not exist in the original Streamlit project.
    The original codebase only had STT -> claim extraction -> search ->
    verdict. "Cross-examiner questions" were part of the pipeline the API
    was asked to expose, so this is a small, additive service that reuses
    the same Groq client/pattern as fact_checker.py to generate follow-up
    questions an investor could ask about a claim. It does NOT change any
    existing verification logic.
    """

    def __init__(self):
        self.client = Groq(api_key=Config.GROQ_API_KEY)
        self.model = Config.GROQ_MODEL

    def generate_questions(self, claim: str, verdict: str, explanation: str) -> list[str]:
        system_instruction = (
            "You are a skeptical investor cross-examining a startup founder. "
            "Given a claim, its fact-check verdict, and the explanation, write "
            "sharp, specific follow-up questions the founder should be ready to "
            "answer. Return valid JSON only."
        )

        user_prompt = f"""
Claim: "{claim}"
Verdict: {verdict}
Explanation: {explanation}

Return a JSON object with this exact structure:
{{
    "questions": ["question 1", "question 2"]
}}

Write 1 to 3 concise, pointed questions. If the verdict is UNVERIFIED, ask
questions that would help verify the claim. If FALSE or MIXED, ask questions
that probe the discrepancy. If TRUE, ask questions that test durability of
the claim (e.g. how it was measured, over what period).
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
            )
            raw_content = response.choices[0].message.content.strip()
            data = json.loads(raw_content)
            questions = data.get("questions", [])
            if not isinstance(questions, list):
                return []
            return [str(q).strip() for q in questions if str(q).strip()][:3]
        except Exception:
            # Cross-exam questions are a nice-to-have enhancement, not core
            # verification logic — a failure here must never break the rest
            # of the pipeline or the analyze response.
            return []
