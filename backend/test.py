from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

def map_locations_ids_to_resource_names(client, location_ids):
    geo_target_constant_service = client.get_service("GeoTargetConstantService")
    return [
        geo_target_constant_service.geo_target_constant_path(location_id)
        for location_id in location_ids
    ]

def main(client, customer_id, location_ids, language_id, keyword_texts, page_url):
    keyword_plan_idea_service = client.get_service("KeywordPlanIdeaService")
    keyword_plan_network = (
        client.enums.KeywordPlanNetworkEnum.GOOGLE_SEARCH_AND_PARTNERS
    )
    location_rns = map_locations_ids_to_resource_names(client, location_ids)
    language_rn = client.get_service("GoogleAdsService").language_constant_path(language_id)

    if not (keyword_texts or page_url):
        raise ValueError("At least one of keywords or page URL is required.")

    request = client.get_type("GenerateKeywordIdeasRequest")
    request.customer_id = customer_id
    request.language = language_rn
    request.geo_target_constants = location_rns
    request.include_adult_keywords = False
    request.keyword_plan_network = keyword_plan_network

    if not keyword_texts and page_url:
        request.url_seed.url = page_url

    if keyword_texts and not page_url:
        request.keyword_seed.keywords.extend(keyword_texts)

    if keyword_texts and page_url:
        request.keyword_and_url_seed.url = page_url
        request.keyword_and_url_seed.keywords.extend(keyword_texts)

    try:
        response = keyword_plan_idea_service.generate_keyword_ideas(request=request)
        for idea in response:
            print(
                f'Keyword: "{idea.text}", '
                f'Avg Monthly Searches: {idea.keyword_idea_metrics.avg_monthly_searches}, '
                f'Competition: {idea.keyword_idea_metrics.competition.name}'
            )
    except GoogleAdsException as ex:
        print("Google Ads API Error:", ex)

if __name__ == "__main__":
    credentials = {
        "developer_token": "SdVhzDNZtW-xQ3BCSz-2hA",
        "client_id": "183344298572-9eduvq7mpcrl2mqrhnpgj691gfom9lga.apps.googleusercontent.com",
        "client_secret": "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",
        "refresh_token": "1//09gN8NkBiNwX6CgYIARAAGAkSNwF-L9IrL95MUD_0TZzScClkhf64gkZeIRYWnmD4e6n56q1aAYbYENnm-yPE2fyRNJQS_CMra10",
        "login_customer_id": "9658765347",
        "use_proto_plus": True
    }

    client = GoogleAdsClient.load_from_dict(credentials)

    # Example input values
    main(
        client=client,
        customer_id="9658765347",
        location_ids=["2840"],             # United States
        language_id="1000",                # English
        keyword_texts=["seo", "ai marketing"],
        page_url="https://example.com"
    )
