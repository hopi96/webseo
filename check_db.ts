import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function checkState() {
    console.log('--- Checking Users ---');
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
        console.error("Error listing users:", error.message);
    } else {
        users.forEach(u => console.log(`User: ${u.email} (ID: ${u.id})`));
    }

    console.log('\n--- Checking Roles ---');
    const { data: roles, error: rolesError } = await supabaseAdmin.from('user_roles').select('*');
    if (rolesError) {
        console.error("Error reading roles:", rolesError.message);
    } else {
        console.log(roles);
    }

    console.log('\n--- Checking Sites ---');
    const { data: sites, error: sitesError } = await supabaseAdmin.from('sites').select('id, name');
    if (sitesError) {
        console.error("Error reading sites:", sitesError.message);
    } else {
        console.log(`Found ${sites?.length} sites`);
    }
}

checkState();
