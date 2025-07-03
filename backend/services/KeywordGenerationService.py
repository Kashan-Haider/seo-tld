import requests
from typing import List, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
import os
import re
import random
import time
import json
import nltk
import urllib.parse
from datetime import datetime

try:
    from nltk.corpus import stopwords
    _ = stopwords.words('english')
except LookupError:
    nltk.download('stopwords')
    from nltk.corpus import stopwords

class KeywordResearchService:
    @staticmethod
    def expand_seeds_gemini(seed: str, top_n: int = 10) -> List[str]:
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            print("[KeywordGen] ERROR: GOOGLE_API_KEY not found, skipping Gemini expansion")
            return []
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key)
        prompt = (
            f"Generate 10 Google-search-style keyword phrases related to '{seed}'. "
            "Return only comma-separated keywords, no numbering."
        )
        response = llm.invoke(prompt)
        content = response.content
        if isinstance(content, list):
            content = ','.join(str(x) for x in content)
        keywords = [k.strip() for k in content.split(',') if k.strip()]
        print(f"[KeywordGen] Gemini expanded keywords: {keywords}")
        return keywords[:top_n]

    @staticmethod
    def dedupe_and_filter(keywords: List[str]) -> List[str]:
        sw = set(stopwords.words('english'))
        seen = set()
        filtered = []
        for k in keywords:
            norm = k.lower().strip()
            if len(norm) < 3 or norm in sw or norm in seen:
                continue
            seen.add(norm)
            filtered.append(k)
        print(f"[KeywordGen] After dedupe/filter: {filtered}")
        return filtered

    @staticmethod
    def cluster_keywords_gemini(keywords: List[str]) -> Dict[str, List[str]]:
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            print("[KeywordGen] ERROR: GOOGLE_API_KEY not found, skipping Gemini clustering")
            return {k: [k] for k in keywords}
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key)
        prompt = (
            "Cluster these keywords into synonym groups. Return a JSON object where each key is a cluster name and the value is a list of keywords. "
            f"Keywords: {json.dumps(keywords)}"
        )
        response = llm.invoke(prompt)
        try:
            content = response.content
            if isinstance(content, dict):
                clusters = content
            elif isinstance(content, str):
                clusters = json.loads(content)
            else:
                raise ValueError(f"Unexpected LLM response type: {type(content)}")
            print(f"[KeywordGen] Gemini clustered into {len(clusters)} groups: {list(clusters.keys())}")
            return clusters
        except Exception as e:
            print(f"[KeywordGen] ERROR parsing clusters: {e}")
            print(f"[KeywordGen] Raw Gemini response: {getattr(response, 'content', response)}")
            return {k: [k] for k in keywords}

    @staticmethod
    def fetch_suggestion_count(keyword: str) -> int:
        def google():
            try:
                url = f'https://suggestqueries.google.com/complete/search?client=firefox&q={urllib.parse.quote(keyword)}'
                r = requests.get(url, timeout=8)
                if r.status_code == 200:
                    return len(r.json()[1])
            except Exception as e:
                print(f"[Suggest] Google error: {e}")
            return 0
        def bing():
            try:
                url = f'https://api.bing.com/osjson.aspx?query={urllib.parse.quote(keyword)}'
                r = requests.get(url, timeout=8)
                if r.status_code == 200:
                    return len(r.json()[1])
            except Exception as e:
                print(f"[Suggest] Bing error: {e}")
            return 0
        def youtube():
            try:
                url = f'https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q={urllib.parse.quote(keyword)}'
                r = requests.get(url, timeout=8)
                if r.status_code == 200:
                    return len(r.json()[1])
            except Exception as e:
                print(f"[Suggest] YouTube error: {e}")
            return 0
        def soovle():
            try:
                url = f'https://soovle.com/?q={urllib.parse.quote(keyword)}'
                r = requests.get(url, timeout=8)
                if r.status_code == 200:
                    return r.text.count('<div class="tag">')
            except Exception as e:
                print(f"[Suggest] Soovle error: {e}")
            return 0
        def keywordsheeter():
            try:
                url = f'https://keywordsheeter.com/?term={urllib.parse.quote(keyword)}'
                r = requests.get(url, timeout=8)
                if r.status_code == 200:
                    return r.text.count('<li class="suggestion">')
            except Exception as e:
                print(f"[Suggest] KeywordSheeter error: {e}")
            return 0
        total = google() + bing() + youtube() + soovle() + keywordsheeter()
        print(f"[KeywordGen] '{keyword}' suggestion count: {total}")
        return total

    @staticmethod
    def fetch_serp_word_density(keyword: str) -> float:
        try:
            url = f'https://www.google.com/search?q={urllib.parse.quote(keyword)}'
            headers = {'User-Agent': 'Mozilla/5.0 (compatible; KeywordBot/1.0)'}
            r = requests.get(url, headers=headers, timeout=10)
            if r.status_code == 200:
                text = r.text
                text = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', text, flags=re.DOTALL)
                text = re.sub(r'<[^>]+>', '', text)
                words = re.findall(r'\w+', text)
                word_count = len(words)
                print(f"[KeywordGen] '{keyword}' SERP word count: {word_count}")
                return word_count
        except Exception as e:
            print(f"[KeywordGen] SERP fetch error for '{keyword}': {e}")
        return 0.0

    @staticmethod
    def calculate_keyword_difficulty(search_volume, keyword, features, intent, suggestion_count):
        score = 0
        if search_volume > 10000:
            score += 30
        elif search_volume > 1000:
            score += 20
        elif search_volume > 100:
            score += 10
        if len(keyword.split()) <= 2:
            score += 15
        if features:
            score += 10
        if intent == "Commercial":
            score += 10
        if suggestion_count > 10:
            score += 10
        score += random.randint(-5, 5)
        return max(10, min(95, score))

    @staticmethod
    def get_llm_metrics(keyword, suggestion_count, serp_word_density):
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            print("[KeywordGen] No GOOGLE_API_KEY for LLM metrics, using fallback.")
            return None
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key)
        prompt = (
            f"""
            Given the following keyword research data, generate realistic SEO metrics for the keyword. 
            Return only a valid JSON object with these fields: search_volume (int), keyword_difficulty (0-100 int), cpc_usd (float), competitive_density (0-1 float), intent (string: Commercial/Informational/Navigational), features (list of strings).
            Do not return any explanation, markdown, or code block.
            Keyword: '{keyword}'
            Suggestion count: {suggestion_count}
            SERP word count: {serp_word_density}
            """
        )
        try:
            response = llm.invoke(prompt)
            content = response.content
            print(f"[KeywordGen] Raw LLM response: {content}")
            try:
                if isinstance(content, dict):
                    data = content
                elif isinstance(content, str):
                    data = json.loads(content)
                else:
                    raise ValueError(f"Unexpected LLM response type: {type(content)}")
                # Validate required fields
                for field in ["search_volume", "keyword_difficulty", "cpc_usd", "competitive_density", "intent", "features"]:
                    if field not in data:
                        print(f"[KeywordGen] LLM missing field: {field}")
                        return None
                return data
            except Exception as e:
                # fallback to regex if needed
                if isinstance(content, str):
                    match = re.search(r'\{.*\}', content, re.DOTALL)
                    if match:
                        data = json.loads(match.group(0))
                    else:
                        print(f"[KeywordGen] LLM response did not contain JSON: {content}")
                        return None
                else:
                    print(f"[KeywordGen] LLM response was not a string: {type(content)}")
                    return None
        except Exception as e:
            print(f"[KeywordGen] LLM metrics error: {e}")
            return None

    @staticmethod
    def generate_advanced_keywords(seed: str, lang: str = 'en', country: str = 'us', top_n: int = 10):
        print(f"[KeywordGen] === Starting advanced keyword workflow for '{seed}' ===")
        raw_keywords = KeywordResearchService.expand_seeds_gemini(seed, top_n=top_n)
        filtered_keywords = KeywordResearchService.dedupe_and_filter(raw_keywords)
        metrics = []
        llm_metrics_list = []
        for k in filtered_keywords:
            suggestion_count = KeywordResearchService.fetch_suggestion_count(k)
            serp_word_density = KeywordResearchService.fetch_serp_word_density(k)
            llm_metrics = KeywordResearchService.get_llm_metrics(k, suggestion_count, serp_word_density)
            if isinstance(llm_metrics, dict):
                metrics.append({
                    "keyword": k,
                    "search_volume": int(llm_metrics.get("search_volume", 0)),
                    "keyword_difficulty": int(llm_metrics.get("keyword_difficulty", 0)),
                    "cpc_usd": float(llm_metrics.get("cpc_usd", 0)),
                    "competitive_density": float(llm_metrics.get("competitive_density", 0)),
                    "intent": llm_metrics.get("intent", "Informational"),
                    "features": llm_metrics.get("features", [])
                })
                llm_metrics_list.append({"keyword": k, **llm_metrics})
            else:
                # fallback to heuristic
                base_volume = suggestion_count * random.randint(100, 300)
                if len(k.split()) > 3:
                    base_volume = int(base_volume * random.uniform(0.4, 0.7))
                search_volume = max(50, min(base_volume, 50000))
                kw_lower = k.lower()
                if any(x in kw_lower for x in ["buy", "price", "best", "review", "software", "tool", "service"]):
                    intent = "Commercial"
                elif any(kw_lower.startswith(x) for x in ["how", "what", "guide", "tips"]):
                    intent = "Informational"
                elif any(x in kw_lower for x in ["youtube", "facebook", "twitter", "linkedin"]):
                    intent = "Navigational"
                else:
                    intent = "Informational"
                features = []
                if any(x in kw_lower for x in ["how", "what", "guide", "tips"]):
                    features += ["People Also Ask", "Featured Snippet"]
                if any(x in kw_lower for x in ["best", "review"]):
                    features += ["Review Snippet", "Top Stories"]
                if any(x in kw_lower for x in ["video", "youtube"]):
                    features += ["Video Carousel"]
                if not features:
                    features = random.sample([
                        "Featured Snippet", "People Also Ask", "Review Snippet", "Top Stories",
                        "Video Carousel", "List Snippet", "Image Pack", "Sitelinks"
                    ], k=1)
                features = list(set(features))
                keyword_difficulty = KeywordResearchService.calculate_keyword_difficulty(
                    search_volume, k, features, intent, suggestion_count
                )
                if intent == "Commercial":
                    cpc_usd = round(random.uniform(2, 10) + (search_volume / 10000) + (keyword_difficulty / 50), 2)
                elif intent == "Informational":
                    cpc_usd = round(random.uniform(0.5, 3) + (search_volume / 20000), 2)
                else:
                    cpc_usd = round(random.uniform(1, 5) + (search_volume / 15000), 2)
                cpc_usd = max(0.5, min(cpc_usd, 20))
                if intent == "Commercial":
                    competitive_density = round(0.5 + (keyword_difficulty / 100) * 0.45 + random.uniform(-0.05, 0.05), 2)
                elif intent == "Informational":
                    competitive_density = round(0.2 + (keyword_difficulty / 100) * 0.4 + random.uniform(-0.05, 0.05), 2)
                else:
                    competitive_density = round(0.3 + (keyword_difficulty / 100) * 0.3 + random.uniform(-0.05, 0.05), 2)
                competitive_density = max(0.1, min(competitive_density, 0.95))
                metrics.append({
                    "keyword": k,
                    "search_volume": int(search_volume),
                    "keyword_difficulty": int(keyword_difficulty),
                    "cpc_usd": float(cpc_usd),
                    "competitive_density": float(competitive_density),
                    "intent": intent,
                    "features": features
                })
                llm_metrics_list.append({"keyword": k, "llm": False})
            time.sleep(0.2)

        keywords_out = [
            {
                "keyword": m["keyword"],
                "search_volume": int(m["search_volume"]),
                "keyword_difficulty": int(m["keyword_difficulty"]),
                "cpc_usd": float(m["cpc_usd"]),
                "competitive_density": float(m["competitive_density"]),
                "intent": m["intent"],
                "features": m["features"]
            }
            for m in metrics
        ]

        # Add ranking node: sort by composite score (search_volume / (1 + keyword_difficulty))
        ranked_keywords = sorted(
            keywords_out,
            key=lambda k: k["search_volume"] / (1 + k["keyword_difficulty"]),
            reverse=True
        )
        ranking = [
            {
                "keyword": k["keyword"],
                "score": round(k["search_volume"] / (1 + k["keyword_difficulty"]), 2)
            }
            for k in ranked_keywords
        ]

        metadata = {
            "query": seed,
            "country": country,
            "language": lang,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "total_results": len(keywords_out)
        }
        print(f"[KeywordGen] Returning {len(keywords_out)} keywords with metadata: {metadata}")
        return {
            "keywords": keywords_out,
            "metadata": metadata,
            "ranking": ranking,
            "llm_metrics": llm_metrics_list
        }

    @staticmethod
    def fetch_google_suggestions(query: str, lang: str = 'en', country: str = 'us') -> list:
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
            print(f"[KeywordGen] Google suggestions failed for '{query}': {response.status_code}")
            return []
        except Exception as e:
            print(f"[KeywordGen] Error fetching Google suggestions: {e}")
            return []

    @staticmethod
    def generate_long_tail_keywords(seed: str, lang: str = 'en', country: str = 'us') -> set:
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
        print(f"[KeywordGen] Long-tail keywords generated: {len(seen)}")
        return seen 