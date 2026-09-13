import json
from groq import Groq
from config import Config


class FactChecker:
    def __init__(self):
        self.client = Groq(api_key=Config.GROQ_API_KEY)
        self.model = Config.GROQ_MODEL

    def verify_claim(self, claim: str, search_results: list[dict]) -> dict:
        """
        Search evidence ke mutabiq claim ki accuracy check karta hai.
        """
        # Extract evidence safely with fallback text
        evidence_lines = [
            f"- Source ({res['url']}): {res.get('snippet', '')}"
            for res in search_results
            if res.get("url")
        ]
        context = "\n".join(evidence_lines) if evidence_lines else "No online search evidence found."

        system_instruction = (
            "You are a strict Fact-Checking Auditor. Verify claims using ONLY the provided search evidence. "
            "Return valid JSON strictly following the requested structure without any surrounding markdown."
        )

        user_prompt = f"""
Claim to Audit: "{claim}"

Search Evidence:
{context}

Return a JSON object with these exact keys:
- "verdict": "TRUE" | "FALSE" | "MIXED" | "UNVERIFIED"
- "confidence": float between 0.0 and 1.0
- "explanation": a concise 2-sentence explanation of why the claim holds that verdict.
- "sources": list of URLs from the evidence used for verification.
"""

        try:
            # Native Groq API call with JSON mode enabled
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.1,  # Low temperature for deterministic output
            )

            raw_content = response.choices[0].message.content.strip()
            return json.loads(raw_content)

        except Exception as e:
            return {
                "verdict": "UNVERIFIED",
                "confidence": 0.0,
                "explanation": f"Failed to perform verification check: {str(e)}",
                "sources": [],
            }