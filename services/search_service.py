from tavily import TavilyClient
from config import Config

class SearchService:
    def __init__(self):
        self.client = TavilyClient(api_key=Config.TAVILY_API_KEY)

    def search_claim(self, claim_text: str, max_results: int = 3) -> list[dict]:
        """
        Extract kiye hue claim ko internet par search karke reliable sources fetch karta hai.
        """
        try:
            response = self.client.search(
                query=claim_text,
                search_depth="advanced",
                max_results=max_results
            )
            results = []
            for item in response.get("results", []):
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "snippet": item.get("content", "")
                })
            return results
        except Exception as e:
            return [{"title": "Search Failed", "url": "", "snippet": str(e)}]
