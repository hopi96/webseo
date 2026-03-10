import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
    console.log('Testing login with admin@webseo.local / admin...');
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@webseo.local',
        password: 'admin',
    });

    if (error) {
        console.error('Login Failed:', error.message);
    } else {
        console.log('Login Success! User ID:', data.user.id);
    }
}

testLogin();
