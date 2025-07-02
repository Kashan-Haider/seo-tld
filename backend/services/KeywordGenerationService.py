import requests
from typing import List, Set, Optional

class KeywordResearchService:
    @staticmethod
    def fetch_google_suggestions(query: str, lang: str = 'en', country: str = 'us') -> List[str]:
        """
        Fetch autocomplete suggestions from Google's suggestqueries API for a given query.
        """
        url = 'https://suggestqueries.google.com/complete/search'
        params = {
            'client': 'firefox',
            'q': query,
            'hl': lang,
            'gl': country
        }
        response = requests.get(url, params=params)
        if response.status_code == 200:
            suggestions = response.json()[1]
            return suggestions
        else:
            print(f"Failed to fetch suggestions for '{query}': {response.status_code}")
            return []

    @staticmethod
    def generate_long_tail_keywords(seed: str, lang: str = 'en', country: str = 'us') -> Set[str]:
        """
        Recursively generate long tail keywords from a seed keyword using Google suggestions. Depth is fixed at 3.
        """
        depth = 3
        seen = set()
        def _expand(keyword: str, current_depth: int):
            if current_depth > depth:
                return
            suggestions = KeywordResearchService.fetch_google_suggestions(keyword, lang, country)
            for suggestion in suggestions:
                if suggestion not in seen:
                    seen.add(suggestion)
                    _expand(suggestion, current_depth + 1)
        _expand(seed, 1)
        return seen 