-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    patient_id TEXT, -- references clerk_id in patients
    doctor_id TEXT,  -- references clerk_id in doctors
    doctor_name TEXT,
    doctor_specialization TEXT,
    date TEXT,
    time TEXT,
    type TEXT,
    status TEXT DEFAULT 'pending',
    symptoms JSONB,
    consultation_fee INTEGER,
    additional_notes TEXT,
    avatar TEXT,
    payment_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Note: The backend uses the service_role key, so it will automatically bypass RLS.
-- This ensures that your private data is not exposed via the public anon key.
