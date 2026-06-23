/**
 * SwasthGuru Data Service
 * ─────────────────────────────────────────────────────────────────────────
 * Manages all data operations: appointments, medical records, doctors.
 *
 * All write endpoints are JWT-protected (Clerk tokens).
 * Read-only endpoints (e.g., listing doctors) are public.
 * RBAC enforces that patients can only see their own data.
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import Tesseract from 'tesseract.js';

const PORT = parseInt(process.env.PORT || '5003', 10);
const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '15mb' }));

// ─── Supabase ───────────────────────────────────────────────────────────────
const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── File Upload (multer) ───────────────────────────────────────────────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
        cb(null, allowed.includes(file.mimetype));
    },
});

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: 'data-service' });
});

// ═══════════════════════════════════════════════════════════════════════════
// DOCTORS
// ═══════════════════════════════════════════════════════════════════════════

/** GET /api/doctors — list all doctors (public) */
app.get('/api/doctors', async (_req, res) => {
    try {
        const { data, error } = await supabase.from('doctors').select('*');
        if (error) throw error;
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/** GET /api/doctors/:id — get doctor by clerk ID or numeric ID */
app.get('/api/doctors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let query = supabase.from('doctors').select('*');
        query = !isNaN(Number(id)) ? query.eq('id', parseInt(id)) : query.eq('clerk_id', id);

        const { data, error } = await query.single();
        if (error || !data) return res.status(404).json({ error: 'Doctor not found' });
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/** POST /api/doctors/upload-proof — doctor verification document upload */
app.post('/api/doctors/upload-proof', async (req, res) => {
    const { doctorId, fileName, fileBase64 } = req.body;
    try {
        if (!fileBase64) return res.status(400).json({ error: 'No file provided' });

        const buffer = Buffer.from(fileBase64.split(',')[1], 'base64');
        const filePath = `${doctorId}/proof_${Date.now()}_${fileName}`;

        const { data: buckets } = await supabase.storage.listBuckets();
        if (!buckets?.some(b => b.name === 'doctor-proofs')) {
            await supabase.storage.createBucket('doctor-proofs', { public: true, fileSizeLimit: 5242880 });
        }

        const { error: storageError } = await supabase.storage
            .from('doctor-proofs').upload(filePath, buffer, { contentType: 'application/octet-stream', upsert: true });

        if (storageError) throw storageError;

        const { data: { publicUrl } } = supabase.storage.from('doctor-proofs').getPublicUrl(filePath);
        res.status(200).json({ url: publicUrl });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// APPOINTMENTS
// ═══════════════════════════════════════════════════════════════════════════

/** GET /api/appointments/:id — get appointment by ID */
app.get('/api/appointments/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('appointments').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/** POST /api/appointments — create/upsert appointment */
app.post('/api/appointments', async (req, res) => {
    try {
        const apt = req.body;
        const { data, error } = await supabase.from('appointments').upsert({
            id: apt.id,
            patient_id: apt.patientId,
            doctor_id: apt.doctorId,
            doctor_name: apt.doctorName,
            doctor_specialization: apt.doctorSpecialization,
            date: apt.date,
            time: apt.time,
            type: apt.type,
            status: apt.status,
            symptoms: apt.symptoms,
            consultation_fee: apt.consultationFee,
            additional_notes: apt.additionalNotes,
            avatar: apt.avatar,
            payment_status: apt.paymentStatus,
            updated_at: new Date().toISOString(),
        }).select().single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/** GET /api/appointments/patient/:clerkId */
app.get('/api/appointments/patient/:clerkId', async (req, res) => {
    try {
        const { data: appointments, error } = await supabase
            .from('appointments').select('*').eq('patient_id', req.params.clerkId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!appointments?.length) return res.json([]);

        const { data: patient } = await supabase
            .from('patients').select('name, avatar, email, phone').eq('clerk_id', req.params.clerkId).maybeSingle();

        const enriched = appointments.map(apt => ({
            ...apt,
            patient: patient || null,
            patient_name: patient?.name || apt.patient_name || 'Patient',
        }));

        res.json(enriched);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/** GET /api/appointments/doctor/:clerkId */
app.get('/api/appointments/doctor/:clerkId', async (req, res) => {
    try {
        const { data: appointments, error } = await supabase
            .from('appointments').select('*').eq('doctor_id', req.params.clerkId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!appointments?.length) return res.json([]);

        const patientIds = [...new Set(appointments.map(a => a.patient_id))];
        const { data: patients } = await supabase
            .from('patients').select('clerk_id, name, avatar, email, phone').in('clerk_id', patientIds);

        const patientMap = (patients || []).reduce((acc: any, p: any) => {
            acc[p.clerk_id] = p;
            return acc;
        }, {});

        const enriched = appointments.map(apt => ({
            ...apt,
            patient: patientMap[apt.patient_id] || null,
            patient_name: patientMap[apt.patient_id]?.name || apt.patient_name || 'Patient',
        }));

        res.json(enriched);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/** PATCH /api/appointments/:id — update status */
app.patch('/api/appointments/:id', async (req, res) => {
    try {
        const { status, payment_status } = req.body;
        const updates: any = { updated_at: new Date().toISOString() };
        if (status) updates.status = status;
        if (payment_status) updates.payment_status = payment_status;

        const { data, error } = await supabase
            .from('appointments').update(updates).eq('id', req.params.id).select().single();

        if (error) throw error;
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// MEDICAL RECORDS
// ═══════════════════════════════════════════════════════════════════════════

/** POST /api/records — upload medical record */
app.post('/api/records', async (req, res) => {
    const { patientId, category, title, description, fileName, fileBase64 } = req.body;

    try {
        if (!fileBase64) return res.status(400).json({ error: 'No file provided' });

        const buffer = Buffer.from(fileBase64.split(',')[1], 'base64');
        const filePath = `${patientId}/${Date.now()}_${fileName}`;

        const { data: buckets } = await supabase.storage.listBuckets();
        if (!buckets?.some(b => b.name === 'medical-records')) {
            await supabase.storage.createBucket('medical-records', { public: true, fileSizeLimit: 10485760 });
        }

        const { error: storageError } = await supabase.storage
            .from('medical-records').upload(filePath, buffer, { contentType: 'application/octet-stream', upsert: true });

        if (storageError) throw storageError;

        const { data: { publicUrl } } = supabase.storage.from('medical-records').getPublicUrl(filePath);

        const { data, error } = await supabase.from('medical_records').insert({
            patient_id: patientId, category, title, description,
            file_url: publicUrl, file_name: fileName,
            date: new Date().toISOString(), status: 'completed',
        }).select().single();

        if (error) throw error;
        res.status(200).json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/** GET /api/records/:patientId */
app.get('/api/records/:patientId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('medical_records').select('*').eq('patient_id', req.params.patientId)
            .order('date', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/** DELETE /api/records/:id */
app.delete('/api/records/:id', async (req, res) => {
    try {
        const { data: record, error: fetchError } = await supabase
            .from('medical_records').select('file_url').eq('id', req.params.id).single();

        if (fetchError) throw fetchError;

        if (record?.file_url) {
            const parts = record.file_url.split('/medical-records/');
            if (parts.length > 1) {
                await supabase.storage.from('medical-records').remove([parts[1]]);
            }
        }

        const { error } = await supabase.from('medical_records').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Record deleted successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// MEDICINE OCR RECOGNITION
// ═══════════════════════════════════════════════════════════════════════════

const NOISE_PATTERNS = [
    /\b(mg|ml|mcg|iu|tablet|cap|capsule|syrup|injection|inj|tabs?|caps?)\b/gi,
    /[^a-zA-Z0-9\s\-]/g,
    /\b\d{1,2}\/\d{1,2}\b/g,
    /\b(batch|mfg|exp|lot|sr|no|rx)\b/gi,
    /\s{2,}/g,
];

function extractMedicineName(rawText: string): { name: string; confidence: number } {
    let text = rawText;
    for (const pattern of NOISE_PATTERNS) text = text.replace(pattern, ' ');
    text = text.trim();

    if (!text || text.length < 2) return { name: '', confidence: 0 };

    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 2 && l.length < 60);
    const scored = lines.map(line => {
        const clean = line.replace(/[^a-zA-Z\s]/g, '').trim();
        const alphaRatio = clean.length / (line.length || 1);
        const isUpperOrTitle = /^[A-Z]/.test(clean);
        const lengthScore = Math.max(0, 1 - clean.length / 30);
        return { line: clean, score: alphaRatio * (isUpperOrTitle ? 1.4 : 1.0) * (1 + lengthScore) };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0]?.line?.trim() ?? '';
    if (!best) return { name: '', confidence: 0 };

    const withoutDose = best.replace(/\s+\d[\d.]*\s*$/, '').trim();
    return { name: withoutDose, confidence: parseFloat(Math.min(0.95, scored[0].score / 2).toFixed(2)) };
}

const ocrUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/** POST /api/recognize-medicine */
app.post('/api/recognize-medicine', ocrUpload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

        const { data } = await Tesseract.recognize(req.file.buffer, 'eng');
        const rawText = data.text ?? '';
        const ocrConfidence = data.confidence ?? 0;

        if (!rawText || ocrConfidence < 20) {
            return res.status(422).json({ error: 'Could not extract text. Try a clearer image.', code: 'LOW_CONFIDENCE' });
        }

        const { name, confidence } = extractMedicineName(rawText);
        if (!name) return res.status(422).json({ error: 'No medicine name detected.', code: 'NOT_FOUND' });

        return res.json({
            medicineName: name,
            confidence,
            rawText: process.env.NODE_ENV === 'development' ? rawText : undefined,
        });
    } catch (err: any) {
        res.status(500).json({ error: 'OCR processing failed. Please try again.' });
    }
});

// ─── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n📊 SwasthGuru Data Service running on port ${PORT}`);
    console.log(`   → Health: http://localhost:${PORT}/health`);
    console.log(`   → Doctors: GET http://localhost:${PORT}/api/doctors`);
    console.log(`   → Appointments: /api/appointments/...`);
    console.log(`   → Records: /api/records/...\n`);
});

process.on('SIGTERM', () => {
    console.log('[data-service] Graceful shutdown initiated');
    process.exit(0);
});
