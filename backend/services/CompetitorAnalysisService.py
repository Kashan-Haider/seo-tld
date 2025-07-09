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
            response = requests.get(url, timeout=150)
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
            # Extract H1 and H2 tags
            h1_tags = ' '.join([h1.get_text(strip=True) for h1 in soup.find_all('h1')])
            h2_tags = ' '.join([h2.get_text(strip=True) for h2 in soup.find_all('h2')])
            # Combine all context
            full_text = f"{title} {meta_desc} {h1_tags} {h2_tags} {text}"
            # Use YAKE for keyword extraction (n=1 and n=2)
            kw_extractor1 = yake.KeywordExtractor(lan="en", n=1, top=max_keywords*4)
            kw_extractor2 = yake.KeywordExtractor(lan="en", n=2, top=max_keywords*4)
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
            # Get unique candidate keywords
            candidate_keywords = []
            for kw in sorted_keywords:
                if kw not in candidate_keywords:
                    candidate_keywords.append(kw)
            # Use LLM to filter and rank for business relevance
            api_key = os.getenv('GOOGLE_API_KEY')
            if not api_key or not candidate_keywords:
                # fallback to YAKE only if LLM not available
                return candidate_keywords[:max_keywords]
            llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key)
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are an expert SEO strategist."),
                ("user", (
                    "Given the following information about a website, select the most business-relevant, short, SEO-friendly keywords that best represent the website's main topics and offerings.\n"
                    "Title: {title}\n"
                    "Meta Description: {meta_desc}\n"
                    "H1 Tags: {h1_tags}\n"
                    "H2 Tags: {h2_tags}\n"
                    "Candidate Keywords: {candidate_keywords}\n"
                    "Return a JSON array of the top {max_keywords} keywords, each as a string. Do not include explanations or extra text."
                ))
            ])
            chain = prompt | llm | RunnableLambda(lambda x: x.content)
            result = chain.invoke({
                "title": title,
                "meta_desc": meta_desc,
                "h1_tags": h1_tags,
                "h2_tags": h2_tags,
                "candidate_keywords": ', '.join(candidate_keywords[:max_keywords*6]),
                "max_keywords": max_keywords
            })
            import json, re
            try:
                match = re.search(r'\[.*\]', result, re.DOTALL)
                if match:
                    return json.loads(match.group(0))
                return json.loads(result)
            except Exception:
                # fallback to YAKE if LLM output is not parseable
                return candidate_keywords[:max_keywords]
        except Exception as e:
            # Log or handle error as needed
            return []

    @staticmethod
    def analyze_content_gap_and_recommend(user_keywords, competitor_keywords_dict, user_url=None, competitor_urls=None):
        """
        user_keywords: list of str
        competitor_keywords_dict: dict of {url: [keywords]}
        user_url: str (optional, for scraping user content)
        competitor_urls: list of str (optional, for scraping competitor content)
        Returns: dict with 'content_gaps' and 'recommendations'
        """
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            return {"content_gaps": [], "recommendations": ["GOOGLE_API_KEY not found, cannot run LLM workflow."]}
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key)

        # Helper to scrape and summarize content
        def scrape_content(url):
            try:
                resp = requests.get(url, timeout=150)
                resp.raise_for_status()
                soup = BeautifulSoup(resp.text, 'html.parser')
                title = soup.title.string if soup.title else ''
                meta_desc = ''
                meta = soup.find('meta', attrs={'name': 'description'})
                if isinstance(meta, Tag):
                    meta_desc = meta.get('content', '')
                h1_tags = ' '.join([h1.get_text(strip=True) for h1 in soup.find_all('h1')])
                h2_tags = ' '.join([h2.get_text(strip=True) for h2 in soup.find_all('h2')])
                text = ' '.join([t for t in soup.stripped_strings])
                return {
                    "title": title,
                    "meta_desc": meta_desc,
                    "h1_tags": h1_tags,
                    "h2_tags": h2_tags,
                    "text": text[:3000]  # limit to 3000 chars for LLM
                }
            except Exception:
                return {"title": "", "meta_desc": "", "h1_tags": "", "h2_tags": "", "text": ""}

        # Scrape user and competitor content if URLs provided
        user_content = scrape_content(user_url) if user_url else {"title": "", "meta_desc": "", "h1_tags": "", "h2_tags": "", "text": ""}
        competitor_contents = {}
        if competitor_urls:
            for url in competitor_urls:
                competitor_contents[url] = scrape_content(url)
        else:
            competitor_contents = {url: {"title": "", "meta_desc": "", "h1_tags": "", "h2_tags": "", "text": ""} for url in competitor_keywords_dict.keys()}

        # Flatten competitor keywords
        competitor_keywords = set()
        for kws in competitor_keywords_dict.values():
            competitor_keywords.update(kws)
        competitor_keywords = list(competitor_keywords)

        # Prepare competitor content summary
        competitor_content_summary = "\n\n".join([
            f"URL: {url}\nTitle: {c['title']}\nMeta: {c['meta_desc']}\nH1: {c['h1_tags']}\nH2: {c['h2_tags']}\nText: {c['text']}" for url, c in competitor_contents.items()
        ])

        # Prompt for content gap analysis
        content_gap_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert SEO strategist and content gap analyst."),
            ("user", (
                "Given the following user's website content and keywords, and the content and keywords of their competitors, perform a detailed content gap analysis.\n"
                "1. Identify the most important content gaps (topics, keywords, or sections the user is missing but competitors have).\n"
                "2. For each gap, explain why it matters and how it can help the user's SEO.\n"
                "3. Provide a very detailed, actionable set of recommendations for the user to improve their content and SEO, referencing both the user's and competitors' content.\n"
                "User URL: {user_url}\nUser Title: {user_title}\nUser Meta: {user_meta}\nUser H1: {user_h1}\nUser H2: {user_h2}\nUser Text: {user_text}\nUser Keywords: {user_keywords}\n\nCompetitor Content:\n{competitor_content_summary}\n\nCompetitor Keywords: {competitor_keywords}\n\nOutput a JSON object with two fields: 'content_gaps' (a list of detailed gap descriptions) and 'recommendations' (a list of detailed, actionable recommendations). Do not include explanations or extra text."
            ))
        ])
        chain = content_gap_prompt | llm | RunnableLambda(lambda x: x.content)
        result = chain.invoke({
            "user_url": user_url or "",
            "user_title": user_content["title"],
            "user_meta": user_content["meta_desc"],
            "user_h1": user_content["h1_tags"],
            "user_h2": user_content["h2_tags"],
            "user_text": user_content["text"],
            "user_keywords": ', '.join(user_keywords),
            "competitor_content_summary": competitor_content_summary,
            "competitor_keywords": ', '.join(competitor_keywords)
        })
        import json, re
        try:
            match = re.search(r'\{.*\}', result, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            return json.loads(result)
        except Exception:
            return {"content_gaps": [], "recommendations": ["Could not parse LLM output", str(result)]} 