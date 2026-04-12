export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  languages: string[];
  availability: boolean;
  rating: number;
  avatar?: string;
  experience: string;
  qualifications: string;
  consultationFee: number;
  about: string;
  availableSlots: string[];
  specialties: string[];
  clerkId?: string;
  isLive?: boolean;
  gender?: 'male' | 'female';
}

export const doctorsData: Doctor[] = [
  // Cardiologists (Heart, BP)
  {
    id: 1, // Keep top rated strict IDs if referenced elsewhere, else move to 201
    name: "Dr. Sarah Johnson",
    specialization: "Cardiologist",
    languages: ["English", "Spanish"],
    availability: true,
    rating: 4.8,
    experience: "12 Years",
    qualifications: "MD, FACC",
    consultationFee: 11,
    about: "Senior Cardiologist with expertise in preventive cardiology and heart failure management.",
    availableSlots: ["10:00 AM", "2:00 PM"],
    specialties: ["Chest pain", "High blood pressure", "Heart problems", "Shortness of breath"],
    gender: 'female'
  },
  {
    id: 201, // Shifted from 101
    name: "Dr. Anjali Desai",
    specialization: "Cardiologist",
    languages: ["English", "Hindi", "Gujarati"],
    availability: true,
    rating: 4.9,
    experience: "18 Years",
    qualifications: "MBBS, MD, DM (Cardiology)",
    consultationFee: 11,
    about: "Interventional Cardiologist specialized in angiography and angioplasty.",
    availableSlots: ["11:00 AM", "5:00 PM"],
    specialties: ["Palpitations", "Heart problems", "Cholesterol"],
    gender: 'female'
  },

  // Dermatologists (Skin, Hair)
  {
    id: 2,
    name: "Dr. Rajesh Gupta",
    specialization: "Dermatologist",
    languages: ["English", "Hindi"],
    availability: true,
    rating: 4.7,
    experience: "8 Years",
    qualifications: "MBBS, MD (Dermatology)",
    consultationFee: 11,
    about: "Specialist in clinical and cosmetic dermatology.",
    availableSlots: ["11:00 AM", "4:00 PM"],
    specialties: ["Skin rash", "Acne", "Hair Fall", "Itching"],
    gender: 'male'
  },
  {
    id: 202,
    name: "Dr. Priya Sharma",
    specialization: "Dermatologist",
    languages: ["English", "Punjabi"],
    availability: true,
    rating: 4.6,
    experience: "6 Years",
    qualifications: "MBBS, DDVL",
    consultationFee: 11,
    about: "Expert in treating skin allergies and laser treatments.",
    availableSlots: ["10:30 AM", "3:30 PM"],
    specialties: ["Skin rash", "Eczema", "Psoriasis"],
    gender: 'female'
  },

  // Pediatricians (Child)
  {
    id: 3,
    name: "Dr. Emily Chen",
    specialization: "Pediatrician",
    languages: ["English", "Mandarin"],
    availability: true,
    rating: 4.9,
    experience: "15 Years",
    qualifications: "MD (Pediatrics)",
    consultationFee: 11,
    about: "Compassionate pediatrician dedicated to child health and development.",
    availableSlots: ["9:00 AM", "1:00 PM"],
    specialties: ["Child fever", "Vaccination", "Growth Issues"],
    gender: 'female'
  },
  {
    id: 203,
    name: "Dr. Arun Kumar",
    specialization: "Pediatrician",
    languages: ["English", "Hindi", "Tamil"],
    availability: true,
    rating: 4.8,
    experience: "10 Years",
    qualifications: "MBBS, DCH",
    consultationFee: 11,
    about: "Friendly doctor specializing in newborn care and immunizations.",
    availableSlots: ["4:00 PM", "7:00 PM"],
    specialties: ["Child fever", "Cold", "Flu"],
    gender: 'male'
  },

  // General Physicians (Fever, Cough, Headache, etc.)
  {
    id: 204,
    name: "Dr. James Wilson",
    specialization: "General Physician",
    languages: ["English"],
    availability: true,
    rating: 4.5,
    experience: "20 Years",
    qualifications: "MBBS, MD (Internal Medicine)",
    consultationFee: 11,
    about: "Experienced physician treating all common illnesses and chronic conditions.",
    availableSlots: ["8:00 AM", "12:00 PM"],
    specialties: ["Fever", "Headache", "Body ache", "Weakness", "Fatigue", "Diabetes"],
    gender: 'male'
  },
  {
    id: 205,
    name: "Dr. Meera Patel",
    specialization: "General Physician",
    languages: ["English", "Hindi"],
    availability: true,
    rating: 4.7,
    experience: "12 Years",
    qualifications: "MBBS, DNB (Family Medicine)",
    consultationFee: 11,
    about: "Family doctor focusing on holistic health.",
    availableSlots: ["9:00 AM", "6:00 PM"],
    specialties: ["Cough", "Sore throat", "Runny nose", "Viral Fever"],
    gender: 'female'
  },

  // Gastroenterologists (Stomach)
  {
    id: 206,
    name: "Dr. Robert Brown",
    specialization: "Gastroenterologist",
    languages: ["English"],
    availability: true,
    rating: 4.9,
    experience: "22 Years",
    qualifications: "MD, DM (Gastroenterology)",
    consultationFee: 11,
    about: "Expert in digestive disorders and liver diseases.",
    availableSlots: ["11:00 AM", "3:00 PM"],
    specialties: ["Stomach pain", "Nausea", "Diarrhea", "Constipation", "Acidity"],
    gender: 'male'
  },

  // Orthopedics (Joints, Back)
  {
    id: 207,
    name: "Dr. Vikram Singh",
    specialization: "Orthopedic",
    languages: ["English", "Hindi"],
    availability: true,
    rating: 4.6,
    experience: "14 Years",
    qualifications: "MS (Orthopedics)",
    consultationFee: 11,
    about: "Specializing in joint replacement and sports injuries.",
    availableSlots: ["10:00 AM", "2:00 PM"],
    specialties: ["Joint pain", "Back pain", "Fracture", "Arthritis"],
    gender: 'male'
  },

  // ENT Specialists (Ear, Nose, Throat)
  {
    id: 208,
    name: "Dr. Anita Roy",
    specialization: "ENT Specialist",
    languages: ["English", "Bengali"],
    availability: true,
    rating: 4.7,
    experience: "9 Years",
    qualifications: "MS (ENT)",
    consultationFee: 11,
    about: "Treating all ear, nose, and throat conditions.",
    availableSlots: ["5:00 PM", "8:00 PM"],
    specialties: ["Ear pain", "Sore throat", "Runny nose", "Sinus"],
    gender: 'female'
  },

  // Psychiatrists (Mental Health)
  {
    id: 209,
    name: "Dr. David Lee",
    specialization: "Psychiatrist",
    languages: ["English", "Korean"],
    availability: true,
    rating: 4.9,
    experience: "16 Years",
    qualifications: "MD (Psychiatry)",
    consultationFee: 11,
    about: "Helping patients with mental health and emotional well-being.",
    availableSlots: ["12:00 PM", "4:00 PM"],
    specialties: ["Anxiety", "Depression", "Sleep problems", "Stress"],
    gender: 'male'
  },

  // Gynecologists (Pregnancy)
  {
    id: 210,
    name: "Dr. Sofia Khan",
    specialization: "Gynecologist",
    languages: ["English", "Urdu", "Hindi"],
    availability: true,
    rating: 4.8,
    experience: "11 Years",
    qualifications: "MS (Obs & Gynae)",
    consultationFee: 11,
    about: "Care for women's health, pregnancy, and childbirth.",
    availableSlots: ["9:00 AM", "1:00 PM"],
    specialties: ["Pregnancy care", "PCOS", "Irregular periods"],
    gender: 'female'
  },

  // Ophthalmologists (Eye)
  {
    id: 211,
    name: "Dr. Rahul Verma",
    specialization: "Ophthalmologist",
    languages: ["English", "Hindi"],
    availability: true,
    rating: 4.7,
    experience: "13 Years",
    qualifications: "MS (Ophthalmology)",
    consultationFee: 11,
    about: "Eye care specialist for vision problems and eye surgeries.",
    availableSlots: ["10:00 AM", "2:00 PM"],
    specialties: ["Eye problems", "Vision loss", "Red eye"],
    gender: 'male'
  },

  // Dentists (Dental)
  {
    id: 212,
    name: "Dr. Lisa Wong",
    specialization: "Dentist",
    languages: ["English", "Cantonese"],
    availability: true,
    rating: 4.8,
    experience: "7 Years",
    qualifications: "BDS, MDS",
    consultationFee: 11,
    about: "Gentle dental care for all ages.",
    availableSlots: ["9:00 AM", "5:00 PM"],
    specialties: ["Dental pain", "Cavities", "Root canal"],
    gender: 'female'
  },

  // Pulmonologists (Lungs)
  {
    id: 213,
    name: "Dr. Kevin White",
    specialization: "Pulmonologist",
    languages: ["English"],
    availability: true,
    rating: 4.9,
    experience: "19 Years",
    qualifications: "MD (Pulmonary Medicine)",
    consultationFee: 11,
    about: "Expert in respiratory diseases and asthma.",
    availableSlots: ["2:00 PM", "6:00 PM"],
    specialties: ["Shortness of breath", "Asthma", "Cough"],
    gender: 'male'
  },
  {
    id: 999,
    name: "Dr. Gajraj Pandey",
    specialization: "General Physician",
    languages: ["Hindi", "English"],
    availability: true,
    rating: 5.0,
    experience: "15 Years",
    qualifications: "MBBS, MD",
    consultationFee: 11,
    about: "Hackathon Special Guest - Direct Consultation enabled.",
    availableSlots: ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM", "06:00 PM"],
    specialties: ["General Health", "Fever", "Hackathon Demo"],
    gender: 'male'
  },

  // ── Real PMC-Registered Doctors (Ludhiana / Moga / Bathinda) ──
  {
    id: 1001,
    name: "Dr. Anupreet Bassi",
    specialization: "Orthopedic Surgeon",
    languages: ["English", "Hindi", "Punjabi"],
    availability: true,
    rating: 4.8,
    experience: "14 Years",
    qualifications: "MBBS, MS (Ortho) — PMC Reg. 37412",
    consultationFee: 11,
    about: "Experienced Orthopedic Surgeon based in Ludhiana specialising in joint replacement and sports injuries.",
    availableSlots: ["09:00 AM", "11:00 AM", "02:00 PM", "05:00 PM"],
    specialties: ["Joint pain", "Back pain", "Knee pain", "Fracture", "Sports injury"],
    gender: 'female'
  },
  {
    id: 1002,
    name: "Dr. J L Bassi",
    specialization: "Orthopedic Surgeon",
    languages: ["English", "Hindi", "Punjabi"],
    availability: true,
    rating: 4.7,
    experience: "22 Years",
    qualifications: "MBBS, MS (Ortho) — PMC Reg. 14206",
    consultationFee: 11,
    about: "Senior Orthopedic Surgeon in Ludhiana with two decades of expertise in bone and joint disorders.",
    availableSlots: ["10:00 AM", "12:00 PM", "03:00 PM"],
    specialties: ["Joint pain", "Back pain", "Bone fracture", "Arthritis"],
    gender: 'male'
  },
  {
    id: 1003,
    name: "Dr. A S Passi",
    specialization: "Orthopedic Surgeon",
    languages: ["English", "Hindi", "Punjabi"],
    availability: true,
    rating: 4.6,
    experience: "10 Years",
    qualifications: "MBBS, MS (Ortho) — PMC Reg. 38502",
    consultationFee: 11,
    about: "Orthopedic Surgeon in Ludhiana specialising in minimally invasive surgery and spine care.",
    availableSlots: ["09:30 AM", "02:30 PM", "05:30 PM"],
    specialties: ["Back pain", "Neck pain", "Joint pain", "Spine disorders"],
    gender: 'male'
  },
  {
    id: 1004,
    name: "Dr. Rohit K Singla",
    specialization: "Child & Pediatric Physician",
    languages: ["English", "Hindi", "Punjabi"],
    availability: true,
    rating: 4.9,
    experience: "12 Years",
    qualifications: "MBBS, MD (Pediatrics) — PMC Reg. 34816",
    consultationFee: 11,
    about: "Dedicated Pediatric Physician in Ludhiana focused on child growth, nutrition and infectious diseases.",
    availableSlots: ["10:00 AM", "01:00 PM", "04:00 PM"],
    specialties: ["Fever", "Child health", "Vaccination", "Nausea", "Vomiting"],
    gender: 'male'
  },
  {
    id: 1005,
    name: "Dr. Prem Singh",
    specialization: "Orthopedic Surgeon",
    languages: ["Hindi", "Punjabi"],
    availability: true,
    rating: 4.6,
    experience: "18 Years",
    qualifications: "MBBS, MS (Ortho) — PMC Reg. 20739",
    consultationFee: 11,
    about: "Orthopedic Surgeon based in Moga with extensive experience in trauma and joint replacement.",
    availableSlots: ["09:00 AM", "12:00 PM", "03:00 PM"],
    specialties: ["Joint pain", "Fracture", "Back pain", "Trauma"],
    gender: 'male'
  },
  {
    id: 1006,
    name: "Dr. Manvinder Singh",
    specialization: "Orthopedic Surgeon",
    languages: ["Hindi", "Punjabi", "English"],
    availability: true,
    rating: 4.7,
    experience: "8 Years",
    qualifications: "MBBS, MS (Ortho) — PMC Reg. 50632",
    consultationFee: 11,
    about: "Young and dynamic Orthopedic Surgeon in Moga specialising in arthroscopy and sports medicine.",
    availableSlots: ["10:30 AM", "02:00 PM", "05:00 PM"],
    specialties: ["Sports injury", "Knee pain", "Shoulder pain", "Joint pain"],
    gender: 'male'
  },
  {
    id: 1007,
    name: "Dr. Parshant Aggarwal",
    specialization: "Rheumatologist",
    languages: ["English", "Hindi", "Punjabi"],
    availability: true,
    rating: 4.8,
    experience: "11 Years",
    qualifications: "MBBS, MD, DM (Rheumatology) — PMC Reg. 53985",
    consultationFee: 11,
    about: "Rheumatologist in Ludhiana specialising in autoimmune and inflammatory joint disorders.",
    availableSlots: ["11:00 AM", "03:00 PM", "06:00 PM"],
    specialties: ["Joint pain", "Arthritis", "Swollen joints", "Lupus", "Back pain"],
    gender: 'male'
  },
  {
    id: 1008,
    name: "Dr. Anand Kumar",
    specialization: "Child & Pediatric Physician",
    languages: ["English", "Hindi", "Punjabi"],
    availability: true,
    rating: 4.7,
    experience: "16 Years",
    qualifications: "MBBS, MD (Pediatrics) — PMC Reg. 39367",
    consultationFee: 11,
    about: "Experienced Pediatrician in Ludhiana providing comprehensive child healthcare.",
    availableSlots: ["09:00 AM", "12:00 PM", "04:00 PM"],
    specialties: ["Fever", "Child health", "Cough", "Nausea", "Skin rash"],
    gender: 'male'
  },
  {
    id: 1009,
    name: "Dr. Jaiveer Singh Hunjan",
    specialization: "Orthopedic Surgeon",
    languages: ["Punjabi", "Hindi", "English"],
    availability: true,
    rating: 4.8,
    experience: "13 Years",
    qualifications: "MBBS, MS (Ortho) — PMC Reg. 45024",
    consultationFee: 11,
    about: "Orthopedic Surgeon in Ludhiana known for complex joint reconstruction and revision surgeries.",
    availableSlots: ["09:30 AM", "01:30 PM", "04:30 PM"],
    specialties: ["Joint pain", "Knee replacement", "Hip replacement", "Fracture"],
    gender: 'male'
  },
  {
    id: 1010,
    name: "Dr. Vinay Gupta",
    specialization: "Orthopedic Surgeon",
    languages: ["Hindi", "English"],
    availability: true,
    rating: 4.6,
    experience: "9 Years",
    qualifications: "MBBS, MS (Ortho) — PMC Reg. 35689",
    consultationFee: 11,
    about: "Orthopedic Surgeon in Ludhiana focusing on paediatric orthopaedics and spine surgery.",
    availableSlots: ["10:00 AM", "02:00 PM", "05:00 PM"],
    specialties: ["Back pain", "Spine disorders", "Joint pain", "Child ortho"],
    gender: 'male'
  },
  {
    id: 1011,
    name: "Dr. Gagandeep",
    specialization: "Orthopedic Surgeon",
    languages: ["Punjabi", "Hindi", "English"],
    availability: true,
    rating: 4.7,
    experience: "7 Years",
    qualifications: "MBBS, MS (Ortho) — PMC Reg. 21699",
    consultationFee: 11,
    about: "Orthopedic Surgeon in Ludhiana with expertise in trauma management and ligament repair.",
    availableSlots: ["09:00 AM", "01:00 PM", "05:00 PM"],
    specialties: ["Fracture", "Ligament tear", "Sports injury", "Joint pain"],
    gender: 'male'
  },
  {
    id: 1012,
    name: "Dr. Sukdev Sharma",
    specialization: "Orthopedic Surgeon",
    languages: ["Hindi", "Punjabi"],
    availability: true,
    rating: 4.6,
    experience: "20 Years",
    qualifications: "MBBS, MS (Ortho) — PMC Reg. 35253",
    consultationFee: 11,
    about: "Senior Orthopedic Surgeon in Ludhiana with vast experience in total joint replacement.",
    availableSlots: ["10:30 AM", "03:30 PM"],
    specialties: ["Joint replacement", "Arthritis", "Back pain", "Knee pain"],
    gender: 'male'
  },
  {
    id: 1013,
    name: "Dr. Vinita Agarwal",
    specialization: "General Physician",
    languages: ["Hindi", "English", "Punjabi"],
    availability: true,
    rating: 4.9,
    experience: "17 Years",
    qualifications: "MBBS, MD (General Medicine) — PMC Reg. 37025",
    consultationFee: 11,
    about: "General Physician in Ludhiana offering holistic primary care for all age groups.",
    availableSlots: ["09:00 AM", "11:00 AM", "02:00 PM", "05:00 PM"],
    specialties: ["Fever", "General health", "Diabetes", "Hypertension", "Fatigue"],
    gender: 'female'
  },
  {
    id: 1014,
    name: "Dr. B B Jindal",
    specialization: "Child & Pediatric Physician",
    languages: ["Hindi", "Punjabi", "English"],
    availability: true,
    rating: 4.7,
    experience: "25 Years",
    qualifications: "MBBS, MD (Pediatrics) — PMC Reg. 24862",
    consultationFee: 11,
    about: "Veteran Pediatrician in Bathinda with 25 years of dedication to child health and welfare.",
    availableSlots: ["10:00 AM", "01:00 PM", "04:00 PM"],
    specialties: ["Fever", "Child health", "Nausea", "Vaccination", "Growth disorders"],
    gender: 'male'
  }
];


const SYMPTOM_SPECIALIZATION_MAP: Record<string, string[]> = {
  // General
  'fever': ['General Physician', 'Pediatrician', 'Internal Medicine'],
  'headache': ['General Physician', 'Neurologist'],
  'body ache': ['General Physician', 'Orthopedic'],
  'weakness': ['General Physician'],

  // Skin
  'skin rash': ['Dermatologist'],
  'acne': ['Dermatologist'],
  'hair fall': ['Dermatologist'],
  'itching': ['Dermatologist'],

  // Heart
  'chest pain': ['Cardiologist', 'General Physician'],
  'palpitations': ['Cardiologist'],
  'high blood pressure': ['Cardiologist', 'General Physician'],
  'shortness of breath': ['Pulmonologist', 'Cardiologist'],
  'heart problems': ['Cardiologist'],

  // Stomach
  'stomach pain': ['Gastroenterologist', 'General Physician'],
  'nausea': ['Gastroenterologist', 'General Physician'],
  'vomiting': ['Gastroenterologist', 'General Physician'],
  'diarrhea': ['Gastroenterologist', 'General Physician'],
  'constipation': ['Gastroenterologist', 'General Physician'],

  // Bone/Joint
  'joint pain': ['Orthopedic', 'Rheumatologist'],
  'back pain': ['Orthopedic', 'Physiotherapist'],
  'fracture': ['Orthopedic'],

  // Mental
  'anxiety': ['Psychiatrist', 'Psychologist'],
  'depression': ['Psychiatrist', 'Psychologist'],
  'sleep problems': ['Psychiatrist', 'General Physician'],

  // Child
  'child fever': ['Pediatrician'],
  'vaccination': ['Pediatrician'],

  // ENT / Respiratory
  'cough': ['General Physician', 'Pulmonologist', 'ENT Specialist'],
  'sore throat': ['General Physician', 'ENT Specialist'],
  'runny nose': ['General Physician', 'ENT Specialist'],
  'ear pain': ['ENT Specialist'],
  'ent pain': ['ENT Specialist'],
  'throat pain': ['ENT Specialist'],

  // Eye
  'eye problems': ['Ophthalmologist'],

  // Dental
  'dental pain': ['Dentist'],

  // Women's Health
  'pregnancy care': ['Gynecologist'],

  // Chronic / Other
  'diabetes': ['Diabetologist', 'Endocrinologist', 'General Physician'],
  'fatigue': ['General Physician'],
  'dizziness': ['General Physician', 'Neurologist', 'ENT Specialist']
};

export const getAvailableDoctors = async (language: string, symptoms?: string[]) => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/api';
    const dhanvantriUrl = process.env.NEXT_PUBLIC_DHANVANTRI_API_URL || 'http://localhost:8000';
    
    // Trigger API fetch and LLM analysis in PARALLEL to save time
    const [apiResponse, llmResponse] = await Promise.allSettled([
      // Fetch DB Doctors
      (async () => {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 3000); // 3s timeout for DB
        try {
          const res = await fetch(`${apiUrl}/doctors`, { signal: controller.signal });
          clearTimeout(tid);
          return res.ok ? await res.json() : [];
        } catch (e) {
          return [];
        }
      })(),
      // Fetch LLM Matching
      (async () => {
        if (!symptoms || symptoms.length === 0) return null;
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 2000); // 2s strict timeout for AI
        try {
          const res = await fetch(`${dhanvantriUrl}/doctor-match`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ symptoms }),
             signal: controller.signal
          });
          clearTimeout(tid);
          return res.ok ? await res.json() : null;
        } catch (e) {
          return null;
        }
      })()
    ]);

    const rawApiDoctors = apiResponse.status === 'fulfilled' ? apiResponse.value : [];
    const llmMatch = llmResponse.status === 'fulfilled' ? llmResponse.value : null;

    const apiDoctors = rawApiDoctors.map((d: any) => ({
      ...d,
      clerkId: d.clerk_id || d.clerkId || d.id?.toString(),
      consultationFee: d.consultation_fee || d.consultationFee || 11,
      availableSlots: Array.isArray(d.available_slots) ? d.available_slots : (d.availableSlots || ["09:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"]),
      specialties: Array.isArray(d.specialties) ? d.specialties : (d.specialties ? [d.specialties] : []),
      availability: d.availability ?? true,
      rating: d.rating || 5.0,
      experience: d.experience || "Medical Specialist",
      qualifications: d.qualifications || "Verified Doctor",
      isLive: true
    }));

    // Merge static and API doctors
    const allDoctorsMap = new Map();
    doctorsData.forEach(d => {
      const key = d.clerkId || d.id.toString();
      allDoctorsMap.set(key, { ...d, isLive: false });
    });
    apiDoctors.forEach((d: Doctor) => {
      const key = d.clerkId || d.id.toString();
      allDoctorsMap.set(key, d);
    });

    const allDoctors = Array.from(allDoctorsMap.values()) as Doctor[];
    let filtered = allDoctors.filter(doctor => doctor.availability !== false);

    if (llmMatch?.specialist_needed && llmMatch.specialist_needed !== "General Physician") {
      const specialistNeeded = llmMatch.specialist_needed.toLowerCase();
      const llmFiltered = filtered.filter(doctor =>
        doctor.specialization.toLowerCase().includes(specialistNeeded) ||
        specialistNeeded.includes(doctor.specialization.toLowerCase())
      );
      if (llmFiltered.length > 0) return llmFiltered.sort((a, b) => b.rating - a.rating);
    }

    // Fallback to static mapping logic if AI fails or no AI match
    if (symptoms && symptoms.length > 0) {
      filtered = filtered.filter(doctor =>
        symptoms.some(symptom => {
          const lowerSymptom = symptom.toLowerCase();
          const hasSpecialty = doctor.specialties && doctor.specialties.some((specialty: string) =>
            specialty.toLowerCase().includes(lowerSymptom) || lowerSymptom.includes(specialty.toLowerCase())
          );
          if (hasSpecialty) return true;

          const hasSpecialization = doctor.specialization && (
            doctor.specialization.toLowerCase().includes(lowerSymptom) ||
            lowerSymptom.includes(doctor.specialization.toLowerCase())
          );
          if (hasSpecialization) return true;

          const mappedTargetSpecs = Object.entries(SYMPTOM_SPECIALIZATION_MAP).find(([key, val]) =>
            lowerSymptom.includes(key) || key.includes(lowerSymptom)
          )?.[1];

          return mappedTargetSpecs?.some(targetSpec =>
            doctor.specialization.toLowerCase().includes(targetSpec.toLowerCase()) ||
            targetSpec.toLowerCase().includes(doctor.specialization.toLowerCase())
          );
        })
      );
    }

    return filtered.sort((a, b) => b.rating - a.rating);
  } catch (error) {
    console.error('Error in getAvailableDoctors:', error);
    return doctorsData;
  }
};

export const getDoctorById = async (id: number) => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/api';
    const res = await fetch(`${apiUrl}/doctors/${id}`);

    if (res.ok) {
      return await res.json() as Doctor;
    }

    // Fallback to static data
    return doctorsData.find(d => d.id === Number(id));

  } catch (error) {
    console.error('Error fetching doctor by id:', error);
    return doctorsData.find(d => d.id === Number(id));
  }
};

export const getDoctorAvatar = (doctor: Doctor): string => {
  if (doctor.avatar) return doctor.avatar;
  
  // Specific image mappings based on verified assets in /public/Doctors/
  // Male Assets: 1, 3, 4, 5, 7
  // Female Assets: 2, 6, 8
  const maleAvatars = [
    '/Doctors/doctor 1.jpg',
    '/Doctors/doctor  3.jpg',
    '/Doctors/doctor  4.jpg',
    '/Doctors/doctor  5.jpg',
    '/Doctors/doctor  7.jpg'
  ];
  
  const femaleAvatars = [
    '/Doctors/doctor  2.jpg',
    '/Doctors/doctor  6.jpg',
    '/Doctors/doctor  8.jpg'
  ];
  
  // Use a name-based heuristic if gender is missing (fallback)
  let gender = doctor.gender;
  if (!gender) {
    const femalePrefixes = ['dr. sarah', 'dr. anjali', 'dr. priya', 'dr. emily', 'dr. meera', 'dr. anita', 'dr. sofia', 'dr. lisa'];
    const nameLower = doctor.name.toLowerCase();
    gender = femalePrefixes.some(p => nameLower.includes(p)) ? 'female' : 'male';
  }

  const avatarList = gender === 'male' ? maleAvatars : femaleAvatars;
  
  // Use ID to consistently pick the same photo for the same doctor
  const index = Math.abs(doctor.id) % avatarList.length;
  return avatarList[index];
};
