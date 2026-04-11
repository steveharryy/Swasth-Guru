import os
from typing import Optional, List
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

# Available specializations based on SwasthGuru system
SPECIALIZATIONS = [
    "General Physician",
    "Pediatrician",
    "Gynecologist",
    "Cardiologist",
    "Dermatologist",
    "Orthopedic Surgeon",
    "Psychiatrist",
    "ENT Specialist",
    "Ophthalmologist",
    "Gastroenterologist",
    "Neurologist",
    "Pulmonologist",
    "Dentist"
]

class DoctorMatcher:
    def __init__(self):
        try:
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        except Exception:
            self.model = None

    def recommend_doctor(
        self,
        symptoms: List[str],
        preferred_language: Optional[str] = None,
        preferred_slot: Optional[str] = None
    ):
        model_names = ['models/gemini-flash-latest', 'models/gemini-pro-latest', 'gemini-1.5-flash', 'gemini-pro']

        last_err = None

        symptoms_str = ", ".join(symptoms)
        prompt = f"""
        As a medical triage assistant, analyze the following patient symptoms:
        Symptoms: {symptoms_str}
        
        From the following list of medical specializations, identify the MOST appropriate one for these symptoms:
        {", ".join(SPECIALIZATIONS)}
        
        Return ONLY the name of the specialization from the list above. Do not include any other text, markdown, or explanation.
        If generic or multiple apply, prefer 'General Physician'.
        """

        for name in model_names:
            try:
                print(f"[DoctorMatcher] Trying model: {name}")
                temp_model = genai.GenerativeModel(name)
                response = temp_model.generate_content(prompt)
                specialist = response.text.strip().replace("*", "").replace("#", "")
                
                # Basic validation to ensure LLM returned a valid specialization from our list
                matched_spec = "General Physician"
                for spec in SPECIALIZATIONS:
                    if spec.lower() in specialist.lower():
                        matched_spec = spec
                        break

                return {
                    "specialist_needed": matched_spec,
                    "llm_response": specialist,
                    "confidence": f"high ({name})",
                    "symptoms_analyzed": symptoms,
                    "recommendation_engine": "SwasthGuru Core LLM"
                }
            except Exception as e:
                print(f"[DoctorMatcher] Model {name} failed: {e}")
                last_err = e
                continue

        return {
            "specialist_needed": "General Physician",
            "error": str(last_err),
            "fallback": True
        }
