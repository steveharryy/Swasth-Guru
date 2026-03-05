CREATE TABLE symptom_scans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    ai_analysis JSONB NOT NULL,
    possible_condition TEXT NOT NULL,
    precautions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE symptom_scans ENABLE ROW LEVEL SECURITY;

-- Policy for patients to see only their own scans
CREATE POLICY patient_select_own ON symptom_scans
    FOR SELECT USING (patient_id = auth.uid()::text);

-- Policy for patients to insert their own scans
CREATE POLICY patient_insert_own ON symptom_scans
    FOR INSERT WITH CHECK (patient_id = auth.uid()::text);
