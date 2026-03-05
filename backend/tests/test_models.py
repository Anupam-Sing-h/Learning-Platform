import google.generativeai as genai
from app.config import settings

genai.configure(api_key=settings.gemini_api_key)

try:
    models = []
    print("Available models supporting embedContent:")
    for m in genai.list_models():
        if 'embedContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Error: {e}")
