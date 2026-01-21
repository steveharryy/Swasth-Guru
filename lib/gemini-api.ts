import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);


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

export async function analyzeMedicine(medicineName: string): Promise<MedicineInfo> {
  try {
   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Analyze the medicine "${medicineName}" and provide detailed information in JSON format:
    {
      "name": "medicine name",
      "genericName": "generic name",
      "dosage": "common dosage",
      "manufacturer": "common manufacturers",
      "category": "therapeutic category",
      "sideEffects": ["list of common side effects"],
      "interactions": ["list of drug interactions"],
      "alternatives": ["list of alternative medicines"]
    }

    Provide accurate medical information. If the medicine name is unclear or not found, suggest the closest match.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Unable to parse medicine information');
  } catch (error) {
    console.error('Error analyzing medicine:', error);
    throw error;
  }
}

export async function findMedicineAlternatives(medicineName: string, symptoms: string[]): Promise<string[]> {
  try {
    // 🔥 FIXED model name
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
    For the medicine "${medicineName}" used to treat symptoms: ${symptoms.join(', ')}, 
    suggest 5 alternative medicines that can treat the same condition. 
    Provide only the medicine names in a JSON array format: ["medicine1", "medicine2", ...]
    Focus on commonly available generic alternatives.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  } catch (error) {
    console.error('Error finding alternatives:', error);
    return [];
  }
}
