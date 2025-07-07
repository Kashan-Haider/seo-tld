import requests
from typing import Set

class LongTailKeywordService:
    @staticmethod
    def fetch_google_suggestions(query: str, lang: str = 'en', country: str = 'us') -> list:
        # Always use 'en' and 'us' regardless of input
        lang = 'en'
        country = 'us'
        try:
            url = 'https://suggestqueries.google.com/complete/search'
            params = {
                'client': 'firefox',
                'q': query,
                'hl': lang,
                'gl': country
            }
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                return response.json()[1]
            print(f"[LongTailKeyword] Google suggestions failed for '{query}': {response.status_code}")
            return []
        except Exception as e:
            print(f"[LongTailKeyword] Error fetching Google suggestions: {e}")
            return []

    @staticmethod
    def generate_long_tail_keywords(seed: str, lang: str = 'en', country: str = 'us') -> Set[str]:
        depth = 3
        seen = set()
        def _expand(keyword: str, current_depth: int):
            if current_depth > depth:
                return
            suggestions = LongTailKeywordService.fetch_google_suggestions(keyword)
            for suggestion in suggestions:
                if suggestion not in seen:
                    seen.add(suggestion)
                    _expand(suggestion, current_depth + 1)
        _expand(seed, 1)
        return seen 