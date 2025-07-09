from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time
import random
import requests
from bs4 import BeautifulSoup
import yake
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda
from bs4.element import Tag
import urllib.parse

class CompetitorAnalysisService:
    @staticmethod
    async def get_duckduckgo_competitors(keywords):
        import logging
        import requests
        from bs4 import BeautifulSoup
        all_links = []
        try:
            logging.info(f"[CompetitorAnalysis] Keywords: {keywords}")
            for kw in keywords:
                search_url = f"https://html.duckduckgo.com/html/?q={kw}"
                logging.info(f"[CompetitorAnalysis] Searching: {search_url}")
                resp = requests.get(search_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
                soup = BeautifulSoup(resp.text, "html.parser")
                results = soup.find_all("a", class_="result__a")
                links = []
                for a in results:
                    if isinstance(a, Tag) and a.has_attr('href'):
                        href = str(a['href'])
                        parsed = urllib.parse.urlparse(href)
                        qs = urllib.parse.parse_qs(parsed.query)
                        real_url = qs.get('uddg', [None])[0]
                        if real_url:
                            real_url = urllib.parse.unquote(real_url)
                            links.append(real_url)
                logging.info(f"[CompetitorAnalysis] Links for '{kw}': {links}")
                all_links.extend(links[:2])
                if len(all_links) >= 10:
                    break
            logging.info(f"[CompetitorAnalysis] All links: {all_links}")
            return all_links[:10]
        except Exception as e:
            logging.error(f"[CompetitorAnalysis] DuckDuckGo scraping failed: {e}")
            raise Exception(f"DuckDuckGo scraping failed: {e}")

    @staticmethod
    async def extract_keywords_from_url(url, max_keywords=5):
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            # Extract visible text
            text = ' '.join([t for t in soup.stripped_strings])
            # Add title and meta description for better context
            title = soup.title.string if soup.title else ''
            meta_desc = ''
            meta = soup.find('meta', attrs={'name': 'description'})
            if isinstance(meta, Tag):
                meta_desc = meta.get('content', '')
            full_text = f"{title} {meta_desc} {text}"
            # Use YAKE for keyword extraction (n=1 and n=2)
            kw_extractor1 = yake.KeywordExtractor(lan="en", n=1, top=max_keywords*2)
            kw_extractor2 = yake.KeywordExtractor(lan="en", n=2, top=max_keywords*2)
            keywords1 = [kw for kw, score in kw_extractor1.extract_keywords(full_text)]
            keywords2 = [kw for kw, score in kw_extractor2.extract_keywords(full_text)]
            # Combine, deduplicate, and filter stopwords/short words
            import re
            from collections import Counter
            stopwords = set(["the","and","for","with","that","this","from","are","was","but","not","you","your","all","can","has","have","will","more","one","about","who","out","get","use","how","why","when","where","which","their","they","our","its","it's","on","in","at","to","of","by","as","an","or","is","be","if","it","a"])
            all_keywords = keywords1 + keywords2
            # Clean and filter
            cleaned = [re.sub(r'[^a-zA-Z0-9\- ]', '', kw).strip().lower() for kw in all_keywords]
            filtered = [kw for kw in cleaned if len(kw) > 2 and kw not in stopwords]
            # Prioritize by frequency
            freq = Counter(filtered)
            sorted_keywords = [kw for kw, _ in freq.most_common()]
            # Return top unique keywords
            unique_keywords = []
            for kw in sorted_keywords:
                if kw not in unique_keywords:
                    unique_keywords.append(kw)
                if len(unique_keywords) >= max_keywords:
                    break
            return unique_keywords
        except Exception as e:
            # Log or handle error as needed
            return []

    @staticmethod
    def analyze_content_gap_and_recommend(user_keywords, competitor_keywords_dict):
        """
        user_keywords: list of str
        competitor_keywords_dict: dict of {url: [keywords]}
        Returns: dict with 'content_gaps' and 'recommendations'
        """
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            return {"content_gaps": [], "recommendations": ["GOOGLE_API_KEY not found, cannot run LLM workflow."]}
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key)

        # Flatten competitor keywords
        competitor_keywords = set()
        for kws in competitor_keywords_dict.values():
            competitor_keywords.update(kws)
        competitor_keywords = list(competitor_keywords)

        # Prompt for content gap analysis
        content_gap_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert SEO strategist and content gap analyst."),
            ("user", (
                "Given the following user's keywords and competitor keywords, identify the most important content gaps (keywords/topics the user is missing but competitors have).\n"
                "Then, provide actionable recommendations for the user to improve their content and SEO.\n"
                "User keywords: {user_keywords}\n"
                "Competitor keywords: {competitor_keywords}\n"
                "Output a JSON object with two fields: 'content_gaps' (list of missing keywords/topics) and 'recommendations' (list of actionable recommendations).\n"
                "Do not include explanations or extra text."
            ))
        ])
        chain = content_gap_prompt | llm | RunnableLambda(lambda x: x.content)
        result = chain.invoke({
            "user_keywords": ", ".join(user_keywords),
            "competitor_keywords": ", ".join(competitor_keywords)
        })
        import json, re
        try:
            match = re.search(r'\{.*\}', result, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            return json.loads(result)
        except Exception:
            return {"content_gaps": [], "recommendations": ["Could not parse LLM output", str(result)]} 