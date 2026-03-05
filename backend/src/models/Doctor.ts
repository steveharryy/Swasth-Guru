// Refactored from Mongoose to TypeScript Interface for Supabase
export interface IDoctor {
    clerk_id?: string;
    id: number;
    name: string;
    email?: string;
    phone?: string;
    specialization: string;
    languages: string[];
    availability: boolean;
    rating: number;
    avatar?: string;
    experience: string;
    qualifications: string;
    consultation_fee: number;
    about: string;
    available_slots: string[];
    specialties: string[];
    license_number?: string;
}

// Helper to map Supabase column names (snake_case) to camelCase if needed,
// but for simplicity we'll try to stick to what the frontend expects.
// The frontend seems to expect camelCase for some fields (consultationFee).
// I will keep snake_case in the interface to match the SQL schema I provided.
