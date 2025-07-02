from google_auth_oauthlib.flow import InstalledAppFlow
import json
from dotenv import load_dotenv
import os

load_dotenv()

# Path to your downloaded OAuth2 credentials JSON file
CLIENT_SECRETS_FILE = os.getenv("CLIENT_SECRETS_FILE")

# Scopes required for Google Ads API
SCOPES = ['https://www.googleapis.com/auth/adwords']

def generate_refresh_token():
    flow = InstalledAppFlow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, 
        scopes=SCOPES
    )
    
    # This will open a browser window for authorization
    credentials = flow.run_local_server(port=0)
    
    print("Refresh Token:", credentials.refresh_token)
    print("Client ID:", credentials.client_id)
    print("Client Secret:", credentials.client_secret)

if __name__ == "__main__":
    generate_refresh_token()
