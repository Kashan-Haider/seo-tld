import requests
from typing import List, Dict, Any, Set, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
import os
import re
import json
import nltk
import urllib.parse
from datetime import datetime
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure stopwords are downloaded and loaded once
try:
    from nltk.corpus import stopwords
    STOPWORDS = set(stopwords.words('english'))
except LookupError:
    nltk.download('stopwords')
    from nltk.corpus import stopwords
    STOPWORDS = set(stopwords.words('english'))

class KeywordGenerationService:
    """
    Service for generating and analyzing SEO keywords using LLMs and web data.
    """

    @staticmethod
    def expand_seeds_gemini(seed: str, top_n: int = 10) -> List[str]:
        """
        Use Gemini LLM to generate keyword ideas from a seed.
        """
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            logger.error("[KeywordGen] GOOGLE_API_KEY not found, skipping Gemini expansion")
            return []
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key)
        prompt = (
    f"Generate 10 short, high-impact keywords related to '{seed}'. "
    f"Focus on 1-3 word phrases that people actually type in search boxes. "
    f"Prioritize popular, specific terms with strong search volume potential. "
    f"Output format: keyword1, keyword2, keyword3..."
)
        response = llm.invoke(prompt)
        content = response.content
        if isinstance(content, list):
            content = ','.join(str(x) for x in content)
        keywords = [k.strip() for k in content.split(',') if k.strip()]
        logger.info(f"[KeywordGen] Gemini expanded keywords: {keywords}")
        return keywords[:top_n]

    @staticmethod
    def dedupe_and_filter(keywords: List[str]) -> List[str]:
        """
        Remove duplicates and stopwords from keyword list.
        """
        seen = set()
        filtered = []
        for k in keywords:
            norm = k.lower().strip()
            if len(norm) < 3 or norm in STOPWORDS or norm in seen:
                continue
            seen.add(norm)
            filtered.append(k)
        logger.info(f"[KeywordGen] After dedupe/filter: {filtered}")
        return filtered

    @staticmethod
    def fetch_suggestion_count(keyword: str) -> int:
        """
        Fetch the number of autocomplete suggestions for a keyword from Google, Bing, and YouTube.
        """
        def google():
            try:
                url = f'https://suggestqueries.google.com/complete/search?client=firefox&q={urllib.parse.quote(keyword)}'
                r = requests.get(url, timeout=8)
                if r.status_code == 200:
                    return len(r.json()[1])
            except Exception as e:
                logger.warning(f"[Suggest] Google error: {e}")
            return 0
        def bing():
            try:
                url = f'https://api.bing.com/osjson.aspx?query={urllib.parse.quote(keyword)}'
                r = requests.get(url, timeout=8)
                if r.status_code == 200:
                    return len(r.json()[1])
            except Exception as e:
                logger.warning(f"[Suggest] Bing error: {e}")
            return 0
        def youtube():
            try:
                url = f'https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q={urllib.parse.quote(keyword)}'
                r = requests.get(url, timeout=8)
                if r.status_code == 200:
                    return len(r.json()[1])
            except Exception as e:
                logger.warning(f"[Suggest] YouTube error: {e}")
            return 0
        # Only use reliable sources
        total = google() + bing() + youtube()
        logger.info(f"[KeywordGen] '{keyword}' suggestion count: {total}")
        return total

    @staticmethod
    def fetch_serp_word_density(keyword: str) -> float:
        """
        Fetch the word count from the Google SERP for a keyword.
        """
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
                logger.info(f"[KeywordGen] '{keyword}' SERP word count: {word_count}")
                return word_count
        except Exception as e:
            logger.warning(f"[KeywordGen] SERP fetch error for '{keyword}': {e}")
        return 0.0

    @staticmethod
    def get_llm_metrics_batch(keywords: List[str], suggestion_counts: List[int], serp_word_densities: List[float]) -> List[Optional[Dict[str, Any]]]:
        """
        Batch LLM call for metrics for a list of keywords. Returns a list of dicts or None.
        """
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            logger.warning("[KeywordGen] No GOOGLE_API_KEY for LLM metrics, using fallback.")
            return [None] * len(keywords)
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key)
        prompt = (
            "Given the following keyword research data, generate realistic SEO metrics for each keyword. "
            "Return only a valid JSON array, each element with these fields: keyword (string), search_volume (int), keyword_difficulty (0-100 int), cpc_usd (float), competitive_density (0-1 float), intent (string: Commercial/Informational/Navigational), features (list of strings). "
            "Do not return any explanation, markdown, or code block.\n"
        )
        # Compose the batch data
        batch_data = [
            {
                "keyword": k,
                "suggestion_count": s,
                "serp_word_count": w
            }
            for k, s, w in zip(keywords, suggestion_counts, serp_word_densities)
        ]
        prompt += f"\nData: {json.dumps(batch_data)}"
        try:
            response = llm.invoke(prompt)
            content = response.content
            logger.info(f"[KeywordGen] Raw LLM batch response: {content}")
            if isinstance(content, list):
                return [item if isinstance(item, dict) else None for item in content]
            elif isinstance(content, str):
                # Try to parse JSON array
                try:
                    data = json.loads(content)
                    if isinstance(data, list):
                        return data
                except Exception:
                    # Try to extract JSON array from string
                    match = re.search(r'\[.*\]', content, re.DOTALL)
                    if match:
                        return json.loads(match.group(0))
            logger.warning(f"[KeywordGen] LLM batch response could not be parsed: {content}")
            return [None] * len(keywords)
        except Exception as e:
            logger.warning(f"[KeywordGen] LLM metrics error: {e}")
            return [None] * len(keywords)

    @staticmethod
    def calculate_keyword_difficulty(search_volume: int, keyword: str, features: List[str], intent: str, suggestion_count: int) -> int:
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
        import random
        score += random.randint(-5, 5)
        return max(10, min(95, score))

    @staticmethod
    def generate_advanced_keywords(seed: str, lang: str = 'en', country: str = 'us', top_n: int = 10) -> Dict[str, Any]:
        """
        Main workflow: generate, filter, and analyze keywords with parallel web requests and batch LLM calls.
        """
        logger.info(f"[KeywordGen] === Starting advanced keyword workflow for '{seed}' ===")
        raw_keywords = KeywordGenerationService.expand_seeds_gemini(seed, top_n=top_n)
        filtered_keywords = KeywordGenerationService.dedupe_and_filter(raw_keywords)
        metrics = []
        llm_metrics_list = []
        # Parallelize web requests for suggestion count and SERP word density
        suggestion_counts = [0] * len(filtered_keywords)
        serp_word_densities = [0.0] * len(filtered_keywords)
        with ThreadPoolExecutor(max_workers=8) as executor:
            future_to_idx = {}
            for idx, k in enumerate(filtered_keywords):
                future_to_idx[executor.submit(KeywordGenerationService.fetch_suggestion_count, k)] = ("suggestion", idx)
                future_to_idx[executor.submit(KeywordGenerationService.fetch_serp_word_density, k)] = ("serp", idx)
            for future in as_completed(future_to_idx):
                typ, idx = future_to_idx[future]
                try:
                    result = future.result()
                    if typ == "suggestion":
                        suggestion_counts[idx] = result
                    else:
                        serp_word_densities[idx] = result
                except Exception as e:
                    logger.warning(f"[KeywordGen] Error in parallel web request: {e}")
        # Batch LLM metrics
        llm_metrics_batch = KeywordGenerationService.get_llm_metrics_batch(filtered_keywords, suggestion_counts, serp_word_densities)
        for i, k in enumerate(filtered_keywords):
            llm_metrics = llm_metrics_batch[i] if llm_metrics_batch and i < len(llm_metrics_batch) else None
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
                import random
                base_volume = suggestion_counts[i] * random.randint(100, 300)
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
                keyword_difficulty = KeywordGenerationService.calculate_keyword_difficulty(
                    search_volume, k, features, intent, suggestion_counts[i]
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
        logger.info(f"[KeywordGen] Returning {len(keywords_out)} keywords with metadata: {metadata}")
        return {
            "keywords": keywords_out,
            "metadata": metadata,
            "ranking": ranking,
            "llm_metrics": llm_metrics_list
        }

    @staticmethod
    def fetch_google_suggestions(query: str, lang: str = 'en', country: str = 'us') -> List[str]:
        """
        Fetch Google autocomplete suggestions for a query.
        """
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
            logger.warning(f"[KeywordGen] Google suggestions failed for '{query}': {response.status_code}")
            return []
        except Exception as e:
            logger.warning(f"[KeywordGen] Error fetching Google suggestions: {e}")
            return []

    @staticmethod
    def generate_long_tail_keywords(seed: str, lang: str = 'en', country: str = 'us') -> Set[str]:
        """
        Recursively expand Google suggestions to generate long-tail keywords.
        """
        depth = 3
        seen = set()
        def _expand(keyword: str, current_depth: int):
            if current_depth > depth:
                return
            suggestions = KeywordGenerationService.fetch_google_suggestions(keyword, lang, country)
            for suggestion in suggestions:
                if suggestion not in seen:
                    seen.add(suggestion)
                    _expand(suggestion, current_depth + 1)
        _expand(seed, 1)
        logger.info(f"[KeywordGen] Long-tail keywords generated: {len(seen)}")
        return seen 