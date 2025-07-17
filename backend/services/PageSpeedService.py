# services/pagespeed.py
import httpx
import os
from dotenv import load_dotenv
load_dotenv()
from db.models.pageSpeedData import PageSpeedData

class PageSpeedService:
    def __init__(self):
        self.api_key = os.environ["PAGESPEED_API_KEY"]
        self.base_url = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
    
    async def analyze_page(self, url: str, strategy: str = "mobile", categories=None) -> dict:
        if categories is None:
            categories = ["performance"]
        params = {
            'url': url,
            'key': self.api_key,
            'strategy': strategy,
            'prettyPrint': 'false',
            'category': categories
        }
        timeout = httpx.Timeout(300.0)
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(self.base_url, params=params)
                data = response.json()
        except httpx.ReadTimeout:
            raise Exception("PageSpeed API timed out. Try again or increase the timeout.")
        
        if 'lighthouseResult' not in data:
            api_error = data.get('error', {}).get('message', str(data))
            raise Exception(f"PageSpeed API response missing 'lighthouseResult': {api_error}")
        
        return data['lighthouseResult']