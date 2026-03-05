import express from 'express';
import { supabase } from '../config/supabase';

const router = express.Router();

// @desc    Get a single appointment by ID
// @route   GET /api/appointments/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error('Supabase Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create an appointment
// @route   POST /api/appointments
// @access  Public
router.post('/', async (req, res) => {
    try {
        const appointment = req.body;

        const { data, error } = await supabase
            .from('appointments')
            .upsert({
                id: appointment.id,
                patient_id: appointment.patientId,
                doctor_id: appointment.doctorId,
                doctor_name: appointment.doctorName,
                doctor_specialization: appointment.doctorSpecialization,
                date: appointment.date,
                time: appointment.time,
                type: appointment.type,
                status: appointment.status,
                symptoms: appointment.symptoms,
                consultation_fee: appointment.consultationFee,
                additional_notes: appointment.additionalNotes,
                avatar: appointment.avatar,
                payment_status: appointment.paymentStatus,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error: any) {
        console.error('Supabase Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get appointments for a patient
// @route   GET /api/appointments/patient/:clerkId
// @access  Public
router.get('/patient/:clerkId', async (req, res) => {
    try {
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', req.params.clerkId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!appointments || appointments.length === 0) return res.json([]);

        // Get patient info for complete display
        const { data: patient } = await supabase
            .from('patients')
            .select('name, avatar, email, phone')
            .eq('clerk_id', req.params.clerkId)
            .maybeSingle();

        const enriched = appointments.map(apt => ({
            ...apt,
            patient: patient || null,
            patient_name: patient?.name || apt.patient_name || 'Patient'
        }));

        res.json(enriched);
    } catch (error: any) {
        console.error('Supabase Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get appointments for a doctor
// @route   GET /api/appointments/doctor/:clerkId
// @access  Public
router.get('/doctor/:clerkId', async (req, res) => {
    try {
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('doctor_id', req.params.clerkId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase Appointments Fetch Error:', error);
            throw error;
        }

        if (!appointments || appointments.length === 0) {
            return res.json([]);
        }

        // Manual join for patient names
        const patientIds = [...new Set(appointments.map(a => a.patient_id))];
        const { data: patients, error: pError } = await supabase
            .from('patients')
            .select('clerk_id, name, avatar, email, phone')
            .in('clerk_id', patientIds);

        if (pError) {
            console.error('Error fetching patients for join:', pError);
            // Non-blocking, just return appointments as is
            return res.json(appointments);
        }

        const patientMap = (patients || []).reduce((acc: any, p: any) => {
            acc[p.clerk_id] = p;
            return acc;
        }, {});

        const enriched = appointments.map(apt => ({
            ...apt,
            patient: patientMap[apt.patient_id] || null,
            patient_name: patientMap[apt.patient_id]?.name || apt.patient_name || 'Patient'
        }));

        res.json(enriched);
    } catch (error: any) {
        console.error('Supabase Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update appointment status or payment
// @route   PATCH /api/appointments/:id
// @access  Public
router.patch('/:id', async (req, res) => {
    try {
        const { status, payment_status } = req.body;
        const updates: any = { updated_at: new Date().toISOString() };

        if (status) updates.status = status;
        if (payment_status) updates.payment_status = payment_status;

        const { data, error } = await supabase
            .from('appointments')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error('Supabase Error:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
