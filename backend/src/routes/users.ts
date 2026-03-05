import express from 'express';
import { supabase } from '../config/supabase';

const router = express.Router();

const DEFAULT_SLOTS = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM"
];

// @desc    Create or update user
// @route   POST /api/users
// @access  Public (should be protected with webhook signature in prod)
router.post('/', async (req, res) => {
    const { clerkId, role, email, name, phone, ...otherData } = req.body;

    try {
        let resultData;

        if (role === 'patient') {
            console.log('Syncing patient:', { clerkId, email, name });
            const { data, error } = await supabase
                .from('patients')
                .upsert({
                    clerk_id: clerkId,
                    name,
                    email,
                    phone,
                    age: otherData.age,
                    date_of_birth: otherData.dateOfBirth,
                    gender: otherData.gender,
                    blood_group: otherData.bloodGroup,
                    height: otherData.height,
                    weight: otherData.weight,
                    address: otherData.address,
                    emergency_contact: otherData.emergencyContact,
                    medical_history: otherData.medicalHistory,
                    allergies: otherData.allergies,
                    current_medications: otherData.currentMedications,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error('Supabase Patient Upsert Error:', error);
                throw error;
            }
            console.log('Patient sync successful:', data.clerk_id);
            resultData = data;
        } else if (role === 'doctor') {
            const { data: existingDoctor } = await supabase
                .from('doctors')
                .select('*')
                .eq('clerk_id', clerkId)
                .maybeSingle();

            const slots = (existingDoctor?.available_slots && existingDoctor.available_slots.length > 0)
                ? existingDoctor.available_slots
                : (otherData.availableSlots || DEFAULT_SLOTS);

            console.log('Syncing doctor:', { clerkId, email, name });
            const fee = otherData.consultationFee ? parseInt(otherData.consultationFee) : undefined;

            const { data, error } = await supabase
                .from('doctors')
                .upsert({
                    clerk_id: clerkId,
                    name,
                    email,
                    phone,
                    specialization: otherData.specialization || existingDoctor?.specialization || 'General',
                    available_slots: slots,
                    experience: otherData.experience,
                    qualifications: otherData.qualifications,
                    consultation_fee: isNaN(fee as number) ? 500 : fee,
                    about: otherData.about || otherData.bio,
                    license_number: otherData.licenseNumber,
                    languages: otherData.languages || ['English', 'Hindi'],
                    avatar: otherData.avatar,
                    availability: otherData.availability ?? true,
                    specialties: otherData.specialties || [otherData.specialization] // Default specialty to their specialization
                })
                .select()
                .single();

            if (error) {
                console.error('Supabase Doctor Upsert Error:', error);
                throw error;
            }
            console.log('Doctor sync successful:', data.clerk_id);
            resultData = data;
        } else {
            return res.status(400).json({ message: 'Invalid role' });
        }

        res.status(200).json(resultData);
    } catch (error: any) {
        console.error('Supabase Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get patient profile
// @route   GET /api/users/patient/:clerkId
router.get('/patient/:clerkId', async (req, res) => {
    try {
        const { data: patient, error } = await supabase
            .from('patients')
            .select('*')
            .eq('clerk_id', req.params.clerkId)
            .single();

        if (error || !patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        res.json(patient);
    } catch (error) {
        console.error('Supabase Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get doctor profile
// @route   GET /api/users/doctor/:clerkId
router.get('/doctor/:clerkId', async (req, res) => {
    try {
        const { data: doctor, error } = await supabase
            .from('doctors')
            .select('*')
            .eq('clerk_id', req.params.clerkId)
            .single();

        if (error || !doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.json(doctor);
    } catch (error) {
        console.error('Supabase Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Save symptom scan result
// @route   POST /api/users/symptom-scans
router.post('/symptom-scans', async (req, res) => {
    const { patientId, imageUrl, aiAnalysis, possibleCondition, precautions } = req.body;

    try {
        const { data, error } = await supabase
            .from('symptom_scans')
            .insert({
                patient_id: patientId,
                image_url: imageUrl,
                ai_analysis: aiAnalysis,
                possible_condition: possibleCondition,
                precautions: precautions || []
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase symptom_scans insert error:', error);
            throw error;
        }

        res.status(200).json(data);
    } catch (error: any) {
        console.error('Backend symptom-scans error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get patient symptom scans
// @route   GET /api/users/symptom-scans/:patientId
router.get('/symptom-scans/:patientId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('symptom_scans')
            .select('*')
            .eq('patient_id', req.params.patientId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase symptom_scans fetch error:', error);
            throw error;
        }

        res.json(data);
    } catch (error) {
        console.error('Backend symptom-scans fetch error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
