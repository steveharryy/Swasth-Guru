import express from 'express';
import { createClient } from '@supabase/supabase-js';
import process from 'process';

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
router.get('/', async (req, res) => {
    console.log('--- ALL DOCTORS ROUTE HIT ---');
    console.log('Context Type of process:', typeof process);
    try {
        console.log('Querying Supabase for doctors...');
        const { data: doctors, error } = await supabase.from('doctors').select('*');

        if (error) {
            console.error('Supabase Query Error:', error);
            return res.status(500).json({ message: 'DB_QUERY_ERROR', details: error });
        }

        console.log(`Successfully fetched ${doctors?.length || 0} doctors`);
        res.json(doctors);
    } catch (error: any) {
        console.error('ALL_DOCTORS_CATCH:', error);
        res.status(500).json({
            message: 'ALL_DOCTORS_FAIL',
            error: error.message
        });
    }
});

// @desc    Get doctor by ID
// @route   GET /api/doctors/:id
// @access  Public
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`--- SINGLE DOCTOR ROUTE HIT (ID: ${id}) ---`);
    try {
        let query = supabase.from('doctors').select('*');

        if (!isNaN(Number(id))) {
            query = query.eq('id', parseInt(id));
        } else {
            query = query.eq('clerk_id', id);
        }

        const { data: doctor, error } = await query.single();

        if (error || !doctor) {
            return res.status(404).json({ message: 'DOCTOR_NOT_FOUND' });
        }
        res.json(doctor);
    } catch (error: any) {
        console.error('SINGLE_DOCTOR_CATCH:', error);
        res.status(500).json({ message: 'SINGLE_DOCTOR_FAIL' });
    }
});

export default router;
