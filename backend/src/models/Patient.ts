// Refactored from Mongoose to TypeScript Interface for Supabase
export interface IPatient {
    clerk_id: string;
    name: string;
    email: string;
    phone?: string;
    age?: string;
    date_of_birth?: string;
    gender?: string;
    blood_group?: string;
    height?: string;
    weight?: string;
    address?: string;
    emergency_contact?: string;
    medical_history?: string;
    allergies?: string;
    current_medications?: string;
    created_at?: string;
    updated_at?: string;
}
