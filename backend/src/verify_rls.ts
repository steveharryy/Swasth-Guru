import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../.env');
console.log('Loading env from:', envPath);
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('SUPABASE_URL exists:', !!supabaseUrl);
console.log('SERVICE_ROLE_KEY exists:', !!serviceRoleKey && serviceRoleKey !== 'PASTE_YOUR_SERVICE_ROLE_SECRET_KEY_HERE');

// Hardcoded Anon Key for testing (found in .env.local)
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ha2F4ZGNqaWdxaHB3YWNkeml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyODY1NjUsImV4cCI6MjA4Nzg2MjU2NX0.uNrI8mgWtYj9r4GpBaUY1lOYfq8fEtZnKWfgimA4054';

async function verify() {
    console.log('--- RLS Verification Test ---');
    console.log('URL:', supabaseUrl);

    if (!supabaseUrl) {
        console.error('❌ Error: SUPABASE_URL is not set.');
        return;
    }

    // 1. Test Anon Access to Patients (Should be BLOCKED)
    console.log('\n[1] Testing Anon access to "patients" table...');
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: pData, error: pError } = await anonClient.from('patients').select('*').limit(1);

    if (pError) {
        console.log('✅ Correctly blocked or errored:', pError.message);
    } else if (pData && pData.length > 0) {
        console.log('❌ UNSECURE: Anon can see patient data!');
    } else {
        console.log('✅ Correct: Anon sees no data.');
    }

    // 2. Test Anon Access to Doctors (Should be ALLOWED if policy applied)
    console.log('\n[2] Testing Anon access to "doctors" table...');
    const { data: dData, error: dError } = await anonClient.from('doctors').select('*').limit(1);
    if (dError) {
        console.log('❌ Error fetching doctors:', dError.message);
    } else {
        console.log('✅ Success: Public can see doctors list.');
    }

    // 3. Test Service Role Access (Should be ALLOWED)
    console.log('\n[3] Testing Service Role access...');
    if (serviceRoleKey === 'PASTE_YOUR_SERVICE_ROLE_SECRET_KEY_HERE' || !serviceRoleKey) {
        console.log('⚠️  Skipping: Service Role Key not set in backend/.env');
    } else {
        const adminClient = createClient(supabaseUrl, serviceRoleKey);
        const { data: aData, error: aError } = await adminClient.from('patients').select('*').limit(1);
        if (aError) {
            console.log('❌ Service Role failed:', aError.message);
        } else {
            console.log('✅ Success: Service Role can bypass RLS.');
        }
    }
}

verify();
