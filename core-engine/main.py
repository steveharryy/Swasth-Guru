from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from engine.doctor_matcher import DoctorMatcher
from engine.medicine_analyzer import MedicineAnalyzer


app = FastAPI(title="SwasthGuru Core Engine")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

matcher = DoctorMatcher()
analyzer = MedicineAnalyzer()



@app.get("/")
@app.head("/")
async def root():
    return {
        "message": "SwasthGuru LLM Engine is Active",
        "endpoints": ["/health", "/doctor-match", "/docs"]
    }



class DoctorMatchInput(BaseModel):
    symptoms: list[str]
    preferred_language: Optional[str] = "Hindi"
    preferred_slot: Optional[str] = "5 PM"


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "SwasthGuru Core Engine"
    }


@app.post("/doctor-match")
async def doctor_match(body: DoctorMatchInput):
    try:
        return matcher.recommend_doctor(
            symptoms=body.symptoms,
            preferred_language=body.preferred_language,
            preferred_slot=body.preferred_slot
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-medicine")
async def analyze_medicine(file: UploadFile = File(...)):
    print(f"--- [API] POST /analyze-medicine received: {file.filename} ---")
    try:
        image_data = await file.read()
        result = await analyzer.analyze_image(image_data)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
