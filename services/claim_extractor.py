import json
from typing import Any

from groq import Groq
from config import Config


class ClaimExtractor:
    """
    Extracts factual, externally verifiable claims from startup pitches.

    Pipeline:
        Transcript
            ↓
        Groq LLM
            ↓
        Structured JSON
            ↓
        Validation / Cleaning
            ↓
        List of claims
    """

    ALLOWED_CATEGORIES = {
        "Financial",
        "Market Size",
        "Traction",
        "Growth",
        "Funding",
        "Industry Fact",
        "Performance",
        "General Fact",
    }

    MAX_CLAIM_LENGTH = 500

    def __init__(self):
        if not Config.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not configured.")

        if not Config.GROQ_MODEL:
            raise ValueError("GROQ_MODEL is not configured.")

        self.client = Groq(api_key=Config.GROQ_API_KEY)
        self.model = Config.GROQ_MODEL

    def extract_claims(self, transcript: str) -> list[dict]:
        """
        Extract factual claims from a pitch transcript.

        Args:
            transcript: Text produced by STT or entered directly by the user.

        Returns:
            A list of validated claim dictionaries.

        Raises:
            ValueError: If transcript is empty or invalid.
            RuntimeError: If the LLM/API/JSON processing fails.
        """

        # ---------------------------------------------------------
        # 1. Validate transcript
        # ---------------------------------------------------------

        if transcript is None:
            raise ValueError("Transcript is None.")

        transcript = str(transcript).strip()

        if not transcript:
            raise ValueError("Transcript is empty.")

        # Prevent accidentally sending an enormous transcript.
        transcript = transcript[:20000]

        # ---------------------------------------------------------
        # 2. Build extraction prompt
        # ---------------------------------------------------------

        prompt = f"""
You are the claim extraction engine for an AI Pitch Auditor.

Your job is to extract factual statements from a startup pitch that
could potentially be verified using external evidence.

IMPORTANT:
Extract claims based on what the speaker actually says.
Do not invent, infer, estimate, or rewrite facts that are not present.

A claim does NOT need to contain a number to be verifiable.

==================================================
CLAIMS TO EXTRACT
==================================================

TRACTION
- Number of users
- Number of customers
- Number of active users
- Number of clinics/companies using the product
- Customer relationships
- Partnerships that already exist

FINANCIAL
- Revenue
- ARR / MRR
- Sales
- Profit
- Pricing
- Contract value
- Financial performance

GROWTH
- Growth percentages
- User growth
- Revenue growth
- Customer growth
- Month-over-month or year-over-year growth

MARKET SIZE
- TAM
- SAM
- SOM
- Market size
- Market share
- Market growth

FUNDING
- Funding raised
- Investment amount
- Investors
- Valuation
- Funding round

PERFORMANCE
- Accuracy
- Speed
- Processing volume
- Cost reduction
- Time reduction
- Conversion rate
- Retention
- Other measurable product results

INDUSTRY FACT
- Industry statistics
- Research-based claims
- Claims attributed to organizations such as WHO, World Bank,
  Gartner, McKinsey, etc.

GENERAL FACT
- Other specific factual statements that could reasonably be
  checked against external evidence.

==================================================
DO NOT EXTRACT
==================================================

Do NOT extract:

- Opinions
- Personal beliefs
- Questions
- Generic marketing language
- Empty superlatives
- "We believe..."
- "We think..."
- "We want to..."
- "We plan to..."
- "We will..."
- Future goals that have not happened
- Hypothetical examples
- Predictions presented only as future plans
- Purely subjective statements

However, if a future statement contains a factual reference that can
be independently verified, extract only the factual part.

==================================================
EXAMPLES
==================================================

Input:
"We currently have 4,500 users."

Extract:
{{
    "claim": "The company currently has 4,500 users.",
    "category": "Traction"
}}

Input:
"Our customers save 40% of their administrative time."

Extract:
{{
    "claim": "Customers save 40% of their administrative time.",
    "category": "Performance"
}}

Input:
"We raised $500,000 in seed funding."

Extract:
{{
    "claim": "The company raised $500,000 in seed funding.",
    "category": "Funding"
}}

Input:
"We plan to reach 100,000 users next year."

Do NOT extract this because it is a future goal.

Input:
"We are the best AI platform in the market."

Do NOT extract this because it is subjective marketing language.

==================================================
OUTPUT FORMAT
==================================================

Return ONLY valid JSON.

The JSON MUST have exactly this structure:

{{
    "claims": [
        {{
            "id": 1,
            "claim": "Concise factual claim",
            "category": "Traction"
        }}
    ]
}}

Allowed categories:

- Financial
- Market Size
- Traction
- Growth
- Funding
- Industry Fact
- Performance
- General Fact

If there are no factual claims:

{{
    "claims": []
}}

Do not include explanations outside the JSON.

==================================================
PITCH TRANSCRIPT
==================================================

{transcript}
"""

        # ---------------------------------------------------------
        # 3. Call Groq
        # ---------------------------------------------------------

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a strict factual claim extraction "
                            "engine for a startup pitch auditing system. "
                            "Return only valid JSON."
                        ),
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                temperature=0,
                response_format={"type": "json_object"},
            )

        except Exception as e:
            # Do NOT silently convert API failures into [].
            raise RuntimeError(
                f"Groq claim extraction request failed: {e}"
            ) from e

        # ---------------------------------------------------------
        # 4. Get model response
        # ---------------------------------------------------------

        try:
            content = response.choices[0].message.content
        except (AttributeError, IndexError, TypeError) as e:
            raise RuntimeError(
                "Groq returned an unexpected response structure."
            ) from e

        if not content:
            raise RuntimeError(
                "Groq returned an empty response for claim extraction."
            )

        # Useful during development/deployment debugging.
        print("\n========== CLAIM EXTRACTOR ==========")
        print(f"Model: {self.model}")
        print(f"Transcript length: {len(transcript)}")
        print("Raw model response:")
        print(content)
        print("=====================================\n")

        # ---------------------------------------------------------
        # 5. Parse JSON
        # ---------------------------------------------------------

        try:
            data = json.loads(content)

        except json.JSONDecodeError as e:
            raise RuntimeError(
                f"Groq returned invalid JSON: {e}. "
                f"Raw response: {content}"
            ) from e

        # ---------------------------------------------------------
        # 6. Validate top-level response
        # ---------------------------------------------------------

        if not isinstance(data, dict):
            raise RuntimeError(
                "Claim extractor response must be a JSON object."
            )

        claims = data.get("claims")

        if claims is None:
            raise RuntimeError(
                "Claim extractor response does not contain a 'claims' field."
            )

        if not isinstance(claims, list):
            raise RuntimeError(
                "The 'claims' field must contain a JSON list."
            )

        # ---------------------------------------------------------
        # 7. Validate and clean claims
        # ---------------------------------------------------------

        validated_claims = []
        seen_claims = set()

        for item in claims:

            if not isinstance(item, dict):
                continue

            raw_claim = item.get("claim")
            raw_category = item.get("category")

            if raw_claim is None:
                continue

            claim = str(raw_claim).strip()

            if not claim:
                continue

            # Prevent extremely long model-generated claims.
            claim = claim[:self.MAX_CLAIM_LENGTH]

            # Normalize category.
            category = self._normalize_category(raw_category)

            # Remove duplicate claims.
            normalized_claim = " ".join(claim.lower().split())

            if normalized_claim in seen_claims:
                continue

            seen_claims.add(normalized_claim)

            validated_claims.append(
                {
                    "id": len(validated_claims) + 1,
                    "claim": claim,
                    "category": category,
                }
            )

        # ---------------------------------------------------------
        # 8. Debug result
        # ---------------------------------------------------------

        print(
            f"Claim extraction completed successfully. "
            f"Claims found: {len(validated_claims)}"
        )

        return validated_claims

    # =============================================================
    # Helper Methods
    # =============================================================

    def _normalize_category(self, category: Any) -> str:
        """
        Normalize the category returned by the LLM.
        """

        if not category:
            return "General Fact"

        category = str(category).strip()

        # Exact match
        if category in self.ALLOWED_CATEGORIES:
            return category

        # Case-insensitive match
        for allowed in self.ALLOWED_CATEGORIES:
            if category.lower() == allowed.lower():
                return allowed

        # Common variations
        category_map = {
            "financial metric": "Financial",
            "finance": "Financial",
            "market": "Market Size",
            "market size claim": "Market Size",
            "traction metric": "Traction",
            "customer": "Traction",
            "customers": "Traction",
            "growth metric": "Growth",
            "funding round": "Funding",
            "investment": "Funding",
            "performance metric": "Performance",
            "product performance": "Performance",
            "industry": "Industry Fact",
            "industry statistic": "Industry Fact",
            "general": "General Fact",
            "fact": "General Fact",
        }

        return category_map.get(category.lower(), "General Fact")
