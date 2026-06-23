/**
 * SwasthGuru Auth Service
 * ─────────────────────────────────────────────────────────────────────────
 * Handles user registration, profile sync, and authentication.
 *
 * Responsibilities:
 * - Receive Clerk webhook events (user.created, user.updated)
 * - Sync user profiles to Supabase (patients + doctors tables)
 * - Serve user profile GET endpoints
 * - Validate Clerk webhook signatures (Svix)
 * - Issue internal service tokens for inter-service communication
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { Webhook } from 'svix';

const PORT = parseInt(process.env.PORT || '5002', 10);

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));

// Raw body needed for Clerk webhook signature verification
app.use('/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));

// ─── Supabase Client ────────────────────────────────────────────────────────
const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: 'auth-service' });
});

// ─── Clerk Webhook Handler ───────────────────────────────────────────────────
/**
 * POST /webhooks/clerk
 * Processes Clerk lifecycle events and syncs user data to Supabase.
 * Webhook signature is validated using svix to prevent spoofing.
 */
app.post('/webhooks/clerk', async (req, res) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (webhookSecret) {
        const wh = new Webhook(webhookSecret);
        const headers = {
            'svix-id': req.headers['svix-id'] as string,
            'svix-timestamp': req.headers['svix-timestamp'] as string,
            'svix-signature': req.headers['svix-signature'] as string,
        };

        try {
            wh.verify(req.body, headers);
        } catch (err) {
            console.error('[webhook] Invalid Clerk webhook signature:', err);
            return res.status(401).json({ error: 'Invalid webhook signature' });
        }
    }

    const payload = JSON.parse(req.body.toString());
    const { type, data } = payload;

    console.log(`[webhook] Received event: ${type}`);

    try {
        if (type === 'user.created' || type === 'user.updated') {
            const role = data.public_metadata?.role || 'patient';
            const clerkId = data.id;
            const email = data.email_addresses?.[0]?.email_address;
            const name = `${data.first_name || ''} ${data.last_name || ''}`.trim();

            if (role === 'patient') {
                await supabase.from('patients').upsert({
                    clerk_id: clerkId,
                    name,
                    email,
                    updated_at: new Date().toISOString(),
                }).select();
            } else if (role === 'doctor') {
                await supabase.from('doctors').upsert({
                    clerk_id: clerkId,
                    name,
                    email,
                    available_slots: DEFAULT_SLOTS,
                    availability: true,
                    updated_at: new Date().toISOString(),
                }).select();
            }
        }

        res.status(200).json({ received: true });
    } catch (err: any) {
        console.error('[webhook] Error processing event:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── User Sync (Manual) ─────────────────────────────────────────────────────
/**
 * POST /api/users
 * Manual profile sync from the frontend onboarding flow.
 * This is what gets called after the user fills in their profile details.
 */
app.post('/api/users', async (req, res) => {
    const { clerkId, role, email, name, phone, ...otherData } = req.body;

    if (!clerkId || !role) {
        return res.status(400).json({ error: 'clerkId and role are required.' });
    }

    try {
        let resultData;

        if (role === 'patient') {
            const { data, error } = await supabase
                .from('patients')
                .upsert({
                    clerk_id: clerkId, name, email, phone,
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
                    updated_at: new Date().toISOString(),
                })
                .select().single();

            if (error) throw error;
            resultData = data;

        } else if (role === 'doctor') {
            const { data: existingDoctor } = await supabase
                .from('doctors').select('*').eq('clerk_id', clerkId).maybeSingle();

            const slots = existingDoctor?.available_slots?.length > 0
                ? existingDoctor.available_slots
                : (otherData.availableSlots || DEFAULT_SLOTS);

            const fee = otherData.consultationFee ? parseInt(otherData.consultationFee) : 11;

            const { data, error } = await supabase
                .from('doctors')
                .upsert({
                    clerk_id: clerkId, name, email, phone,
                    specialization: otherData.specialization || existingDoctor?.specialization || 'General',
                    available_slots: slots,
                    experience: otherData.experience,
                    qualifications: otherData.qualifications,
                    consultation_fee: isNaN(fee) ? 11 : fee,
                    about: otherData.about || otherData.bio,
                    license_number: otherData.licenseNumber,
                    languages: otherData.languages || ['English', 'Hindi'],
                    avatar: otherData.avatar,
                    proof_url: otherData.proofUrl || otherData.proof_url,
                    availability: otherData.availability ?? true,
                    specialties: otherData.specialties || [otherData.specialization],
                    updated_at: new Date().toISOString(),
                })
                .select().single();

            if (error) throw error;
            resultData = data;
        } else {
            return res.status(400).json({ error: 'Invalid role. Must be patient or doctor.' });
        }

        res.status(200).json(resultData);
    } catch (error: any) {
        console.error('[auth-service] User sync error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ─── Profile Retrieval ──────────────────────────────────────────────────────
app.get('/api/users/patient/:clerkId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('patients').select('*').eq('clerk_id', req.params.clerkId).single();

        if (error || !data) return res.status(404).json({ error: 'Patient not found' });
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users/doctor/:clerkId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('doctors').select('*').eq('clerk_id', req.params.clerkId).single();

        if (error || !data) return res.status(404).json({ error: 'Doctor not found' });
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Symptom Scans ──────────────────────────────────────────────────────────
app.post('/api/users/symptom-scans', async (req, res) => {
    const { patientId, imageUrl, aiAnalysis, possibleCondition, precautions } = req.body;
    try {
        const { data, error } = await supabase
            .from('symptom_scans')
            .insert({ patient_id: patientId, image_url: imageUrl, ai_analysis: aiAnalysis, possible_condition: possibleCondition, precautions: precautions || [] })
            .select().single();

        if (error) throw error;
        res.status(200).json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users/symptom-scans/:patientId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('symptom_scans').select('*').eq('patient_id', req.params.patientId).order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🔐 SwasthGuru Auth Service running on port ${PORT}`);
    console.log(`   → Health: http://localhost:${PORT}/health`);
    console.log(`   → Clerk Webhook: POST http://localhost:${PORT}/webhooks/clerk\n`);
});

process.on('SIGTERM', () => {
    console.log('[auth-service] Graceful shutdown initiated');
    process.exit(0);
});
