from celery_app import celery_app
from services.CompetitorAnalysisService import CompetitorAnalysisService

@celery_app.task(name="scrape_competitor_keywords")
def scrape_competitor_keywords(urls):
    import asyncio
    async def extract_all(urls):
        from services.CompetitorAnalysisService import CompetitorAnalysisService
        async def extract(url):
            print(f"Extracting keywords for: {url}")
            try:
                keywords = await CompetitorAnalysisService.extract_keywords_from_url(url)
                print(f"Keywords for {url}: {keywords}")
                return url, keywords
            except Exception as e:
                print(f"Error extracting keywords for {url}: {e}")
                return url, []
        tasks = [extract(url) for url in urls]
        results = await asyncio.gather(*tasks)
        return dict(results)
    return asyncio.run(extract_all(urls))

@celery_app.task(name="analyze_content_gap_task")
def analyze_content_gap_task(user_keywords, competitor_keywords_dict):
    return CompetitorAnalysisService.analyze_content_gap_and_recommend(user_keywords, competitor_keywords_dict) 