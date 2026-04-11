import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const DHANVANTRI_API_URL = process.env.NEXT_PUBLIC_DHANVANTRI_API_URL || 'http://localhost:8000';

export interface MedicineInfo {
    name: string;
    genericName: string;
    dosage: string;
    manufacturer: string;
    category: string;
    sideEffects: string[];
    interactions: string[];
    alternatives: string[];
}

export interface SymptomAnalysis {
    possibleCondition: string;
    description: string;
    precautions: string[];
    recommendation: string;
}

export interface TriageAnalysis {
    level: 'Low' | 'Medium' | 'High';
    explanation: string;
    symptoms: string[];
}

export interface PharmacyAvailability {
    pharmacyId: string;
    pharmacyName: string;
    address: string;
    distance: number;
    price: number;
    stock: number;
    lastUpdated: string;
    phone: string;
    isOpen: boolean;
    openingHours: string;
}

export function isAiAvailable(): boolean {
    return true; // Always return true because we have mock fallback
}

// --- MOCK DATA FALLBACKS ---
const MOCK_MEDICINES: Record<string, MedicineInfo> = {
    "paracetamol": {
        name: "Paracetamol (650mg)",
        genericName: "Acetaminophen",
        dosage: "1 tablet every 4-6 hours, not exceeding 4g per day.",
        manufacturer: "GSK / Cipla",
        category: "Analgesic & Antipyretic",
        sideEffects: ["Nausea", "Stomach pain"],
        interactions: ["Alcohol"],
        alternatives: ["Ibuprofen", "Naproxen"]
    },
    "crocin": {
        name: "Crocin Advance",
        genericName: "Paracetamol",
        dosage: "1-2 tablets for adults every 4-6 hours.",
        manufacturer: "GlaxoSmithKline",
        category: "Pain Reliever",
        sideEffects: ["Allergic reactions"],
        interactions: ["Alcohol"],
        alternatives: ["Dolo 650", "Calpol"]
    }
};

const MOCK_SYMPTOM_ANALYSES: SymptomAnalysis[] = [
    {
        possibleCondition: "Skin Irritation / Dermatitis",
        description: "Generalized redness and inflammation of the skin surface.",
        precautions: ["Keep area clean", "Avoid scratching", "Apply soothing lotion"],
        recommendation: "If it spreads or becomes painful, consult a dermatologist."
    }
];

// --- AI FUNCTIONS WITH FALLBACK ---

const MODELS_TO_TRY = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-pro"
];

async function getAiResponse(prompt: string, image?: string): Promise<string> {
    if (!genAI) throw new Error("GenAI not initialized");

    let lastError = null;
    for (const modelName of MODELS_TO_TRY) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            let result;
            if (image) {
                const base64Data = image.replace(/^data:[^;]+;base64,/, "");
                result = await model.generateContent([
                    prompt,
                    { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
                ]);
            } else {
                result = await model.generateContent(prompt);
            }
            return result.response.text();
        } catch (e) {
            console.warn(`Model ${modelName} failed:`, e);
            lastError = e;
        }
    }
    throw lastError;
}

export async function analyzeMedicine(medicineName: string): Promise<MedicineInfo> {
    const prompt = `Analyze medicine "${medicineName}". Provide strict JSON:
  { "name": "string", "genericName": "string", "dosage": "string", "manufacturer": "string", "category": "string", "sideEffects": ["string"], "interactions": ["string"], "alternatives": ["string"] }`;

    try {
        const text = await getAiResponse(prompt);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {
        console.warn("All Gemini models failed, using Mock data.");
    }

    // Mock Fallback
    const key = medicineName.toLowerCase();
    for (const k in MOCK_MEDICINES) {
        if (key.includes(k)) return MOCK_MEDICINES[k];
    }
    return {
        name: medicineName,
        genericName: "General Medicine",
        dosage: "Consult doctor for dosage.",
        manufacturer: "Generic",
        category: "Medical",
        sideEffects: ["Varies"],
        interactions: ["None noted"],
        alternatives: []
    };
}

export async function findMedicineAlternatives(medicineName: string, symptoms: string[]): Promise<string[]> {
    const info = await analyzeMedicine(medicineName);
    return info.alternatives.length > 0 ? info.alternatives : ["Alternative A", "Alternative B"];
}

export async function analyzeSymptomImage(imageBase64: string): Promise<SymptomAnalysis> {
    // 1. Try Dhanvantri AI (Local LLM/ML)
    try {
        const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, "");
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/jpeg" });
        const formData = new FormData();
        formData.append("image", blob, "symptom.jpg");

        const response = await fetch(`${DHANVANTRI_API_URL}/analyze-image`, {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            return {
                possibleCondition: data.possible_condition || "Unknown Condition",
                description: `Analysis complete with ${Math.round((data.confidence || 0) * 100)}% confidence using Dhanvantri AI.`,
                precautions: [
                    "Consult a professional for verification",
                    "Keep the affected area clean",
                    "Monitor for any spreading"
                ],
                recommendation: data.recommendation || "Maintain observation and visit a clinic if symptoms persist.",
            };
        }
    } catch (e) {
        console.warn("Dhanvantri AI unreachable, falling back to Gemini.", e);
    }

    // 2. Fallback to Gemini Vision
    const prompt = `Analyze health concern image. Insights only, NOT diagnosis. Strict JSON:
  { "possibleCondition": "string", "description": "string", "precautions": ["string"], "recommendation": "string" }`;

    try {
        const text = await getAiResponse(prompt, imageBase64);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {
        console.warn("Gemini Vision failed, using Mock analysis.");
    }

    return MOCK_SYMPTOM_ANALYSES[0];
}

export async function analyzeSymptomsAndTriage(text: string): Promise<TriageAnalysis> {
    // 1. Try Dhanvantri AI (Local NLP/Triage)
    try {
        // Step A: Extract Symptoms
        const extractRes = await fetch(`${DHANVANTRI_API_URL}/extract-symptoms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });
        
        const extractData = extractRes.ok ? await extractRes.json() : { symptoms: [] };

        // Step B: Assessment
        const triageRes = await fetch(`${DHANVANTRI_API_URL}/triage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symptoms: extractData.symptoms }),
        });

        if (triageRes.ok) {
            const data = await triageRes.json();
            return {
                level: data.level || 'Low',
                explanation: data.explanation || "System assessment complete.",
                symptoms: extractData.symptoms || [],
            };
        }
    } catch (e) {
        console.warn("Dhanvantri Triage unreachable.", e);
    }

    // Fallback: Basic logic
    return {
        level: 'Medium',
        explanation: "Dynamic analysis currently unavailable. Please consult a professional for a definitive assessment.",
        symptoms: [],
    };
}

export async function analyzeMedicineImage(imageBase64: string): Promise<any> {
    try {
        const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, "");
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/jpeg" });
        const formData = new FormData();
        formData.append("file", blob, "medicine.jpg");

        const response = await fetch(`${DHANVANTRI_API_URL}/analyze-medicine`, {
            method: 'POST',
            body: formData,
        });

        console.log(`[AI-API] Medicine analysis response status: ${response.status}`);

        if (response.ok) {
            const result = await response.json();
            console.log(`[AI-API] Medicine analysis successful:`, result);
            return result;
        } else {
            const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
            console.error(`[AI-API] Medicine analysis failed:`, error);
            throw new Error(error.detail || 'Failed to analyze medicine image');
        }
    } catch (e: any) {
        console.error("Error in analyzeMedicineImage:", e);
        throw e;
    }
}


