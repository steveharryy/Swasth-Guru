import express from 'express';
import { supabase } from '../config/supabase';

const router = express.Router();

// @desc    Upload a medical record
// @route   POST /api/records
router.post('/', async (req, res) => {
    const { patientId, category, title, description, fileName, fileBase64 } = req.body;

    try {
        if (!fileBase64) {
             return res.status(400).json({ message: 'No file provided' });
        }

        // Upload to Supabase Storage
        // Convert base64 to Buffer
        const buffer = Buffer.from(fileBase64.split(',')[1], 'base64');
        const filePath = `${patientId}/${Date.now()}_${fileName}`;

        // Ensure bucket exists
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some(b => b.name === 'medical-records');
        if (!bucketExists) {
            await supabase.storage.createBucket('medical-records', {
                public: true,
                fileSizeLimit: 10485760 // 10MB
            });
            console.log('Created missing medical-records bucket');
        }

        const { data: storageData, error: storageError } = await supabase.storage
            .from('medical-records')
            .upload(filePath, buffer, {
                contentType: 'application/octet-stream',
                upsert: true
            });

        if (storageError) {
            console.error('Supabase Storage Error:', storageError);
            throw storageError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('medical-records')
            .getPublicUrl(filePath);

        // Insert metadata into database
        const { data: recordData, error: dbError } = await supabase
            .from('medical_records')
            .insert({
                patient_id: patientId,
                category,
                title,
                description,
                file_url: publicUrl,
                file_name: fileName,
                date: new Date().toISOString(),
                status: 'completed'
            })
            .select()
            .single();

        if (dbError) {
            console.error('Supabase Database Error:', dbError);
            throw dbError;
        }

        res.status(200).json(recordData);
    } catch (error: any) {
        console.error('Medical Record Upload Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get medical records for a patient
// @route   GET /api/records/:patientId
router.get('/:patientId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('medical_records')
            .select('*')
            .eq('patient_id', req.params.patientId)
            .order('date', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error('Medical Records Fetch Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a medical record
// @route   DELETE /api/records/:id
router.delete('/:id', async (req, res) => {
    try {
        // First get the file_url to delete from storage
        const { data: record, error: fetchError } = await supabase
            .from('medical_records')
            .select('file_url')
            .eq('id', req.params.id)
            .single();

        if (fetchError) throw fetchError;

        if (record && record.file_url) {
            // Extract path from public URL
            // Public URL is typically: https://[project].supabase.co/storage/v1/object/public/medical-records/[path]
            const parts = record.file_url.split('/medical-records/');
            if (parts.length > 1) {
                const filePath = parts[1];
                await supabase.storage.from('medical-records').remove([filePath]);
            }
        }

        const { error } = await supabase
            .from('medical_records')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Record deleted successfully' });
    } catch (error: any) {
        console.error('Medical Record Delete Error:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
