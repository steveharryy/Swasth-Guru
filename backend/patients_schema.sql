-- Create patients table with expanded medical fields
CREATE TABLE IF NOT EXISTS patients (
    clerk_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    age INTEGER,
    date_of_birth TEXT,
    gender TEXT,
    blood_group TEXT,
    height INTEGER, -- height in cm
    weight INTEGER, -- weight in kg
    address TEXT,
    emergency_contact TEXT,
    medical_history TEXT,
    allergies TEXT,
    current_medications TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Note: The backend uses the service_role key to sync data from Clerk, 
-- so it bypasses these policies. 
-- For client-side access, users can only see their own profile:
CREATE POLICY patient_select_own_profile ON patients
    FOR SELECT USING (clerk_id = auth.uid()::text);

-- Optional: Allow patients to update their own profile from frontend if needed
CREATE POLICY patient_update_own_profile ON patients
    FOR UPDATE USING (clerk_id = auth.uid()::text)
    WITH CHECK (clerk_id = auth.uid()::text);
