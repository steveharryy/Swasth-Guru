import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY") or os.getenv("NEXT_PUBLIC_GEMINI_API_KEY")
if not api_key:
    print("ERROR: GEMINI_API_KEY/NEXT_PUBLIC_GEMINI_API_KEY not found in .env")
else:
    genai.configure(api_key=api_key)
    print(f"API Key configured: {api_key[:5]}...{api_key[-5:]}")
    
    print("\n--- Listing Available Models ---")
    try:
        models = genai.list_models()
        for m in models:
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name} (Supports Vision: {'vision' in m.name.lower() or '1.5' in m.name})")
    except Exception as e:
        print(f"Error listing models: {e}")

    print("\n--- Testing Single Prompt ---")
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Ping")
        print(f"Gemini 1.5 Flash test: SUCCESS! Response: {response.text}")
    except Exception as e:
        print(f"Gemini 1.5 Flash test: FAILED: {e}")

    try:
        # Try a model string that often works in older versions
        model = genai.GenerativeModel('models/gemini-1.5-flash')
        response = model.generate_content("Ping")
        print(f"models/gemini-1.5-flash test: SUCCESS! Response: {response.text}")
    except Exception as e:
        print(f"models/gemini-1.5-flash test: FAILED: {e}")
