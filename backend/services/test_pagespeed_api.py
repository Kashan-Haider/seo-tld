import asyncio
import os
from dotenv import load_dotenv
import traceback
import httpx

# Support running as a script or as a module
try:
    from services.PageSpeedService import PageSpeedService
except ImportError:
    from .PageSpeedService import PageSpeedService

load_dotenv()

def main():
    url = "https://www.example.com"  # You can change this to any URL you want to test
    service = PageSpeedService()
    try:
        print("PAGESPEED_API_KEY:", os.environ.get("PAGESPEED_API_KEY"))
        result = asyncio.run(service.analyze_page(url))
        print("PageSpeed API key is working! Here is a summary:")
        print(f"Performance Score: {result.performance_score}")
        print(f"FCP: {result.fcp}s, LCP: {result.lcp}s, CLS: {result.cls}, FID: {result.fid}, TTFB: {result.ttfb}")
    except Exception as e:
        print("PageSpeed API key test failed.")
        print(f"Error: {e} ({type(e).__name__})")
        traceback.print_exc()

if __name__ == "__main__":
    main() 