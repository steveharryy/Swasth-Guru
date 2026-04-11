import os
from typing import Optional, List
import google.generativeai as genai
from dotenv import load_dotenv
from PIL import Image
import io

# Load environment variables
load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

class MedicineAnalyzer:
    def __init__(self):
        # Try a few common model names for vision
        model_names = ['gemini-1.5-flash', 'gemini-pro-vision', 'gemini-1.5-pro']
        self.model = None
        
        for name in model_names:
            try:
                print(f"[MedicineAnalyzer] Attempting to load model: {name}")
                self.model = genai.GenerativeModel(name)
                # We don't know if it really exists until we call it, 
                # but we'll store the successful init for now
                self.current_model_name = name
                break
            except Exception as e:
                print(f"[MedicineAnalyzer] Failed to load {name}: {e}")
        
    async def analyze_image(self, image_data: bytes):

        print(f"[MedicineAnalyzer] Received image data: {len(image_data)} bytes")
        if not self.model or not os.getenv("GEMINI_API_KEY"):
            print("[MedicineAnalyzer] Gemini API not configured")
            return {
                "medicine_name": "Error",
                "error": "Gemini API not configured",
                "fallback": True
            }

        try:
            # Open binary data as image
            image = Image.open(io.BytesIO(image_data))
            print(f"[MedicineAnalyzer] Image opened successfully: {image.format} {image.size}")
            
            prompt = """
            Analyze this image of a medicine. 
            Identify the brand name, the generic name (formula), manufacturer, and providing suggestions for use.
            
            Return the result in JSON format with these exact keys:
            {
              "medicine_name": "Brand Name",
              "generic_name": "Generic Name",
              "manufacturer": "Manufacturer Name",
              "suggestion": "Brief usage suggestion",
              "dosage": "Typical dosage if visible",
              "side_effects": ["side effect 1", "side effect 2"],
              "interactions": ["interaction 1", "interaction 2"]
            }
            Do not include markdown or other text, just the JSON.
            """

            
            # Real-time model rotation based on the discovered models in your region
            model_names = [
                'models/gemini-flash-latest', 
                'models/gemini-pro-latest', 
                'models/gemini-2.5-flash-lite',
                'gemini-1.5-flash', 
                'gemini-pro-vision'
            ]

            last_err = None
            
            for name in model_names:
                try:
                    print(f"[MedicineAnalyzer] Sending request using target model: {name}")
                    temp_model = genai.GenerativeModel(name)
                    response = temp_model.generate_content([prompt, image])
                    
                    # If we got here, it succeeded!
                    print(f"[MedicineAnalyzer] Model {name} succeeded!")
                    text = response.text.strip()
                    if "```json" in text:
                        text = text.split("```json")[1].split("```")[0].strip()
                    elif "{" in text:
                        text = text[text.find("{"):text.rfind("}")+1].strip()
                    
                    import json
                    return json.loads(text)
                except Exception as e:
                    print(f"[MedicineAnalyzer] Model {name} failed: {e}")
                    last_err = e
                    continue
            
            # If all vision-capable models fail, let's list what we HAVE
            try:
                available_models = [m.name for m in genai.list_models()]
                print(f"[MedicineAnalyzer] CRITICAL: All models failed. Available models are: {available_models}")
                raise Exception(f"All vision models failed. Available models in your region: {available_models}. Last error: {last_err}")
            except Exception as list_err:
                print(f"[MedicineAnalyzer] Could not even list models: {list_err}")
                raise last_err
            
        except Exception as e:
            print(f"Vision Error: {e}")
            return {
                "medicine_name": "Unknown",
                "error": str(e),
                "fallback": True
            }

