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
    auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
        console.error("Error fetching users:", error.message);
        return;
    }

    const adminUser = users.find(u => u.email === 'admin@webseo.local');
    if (!adminUser) {
        console.error("Could not find admin@webseo.local user!");
        return;
    }

    console.log(`Found admin user ID: ${adminUser.id}`);

    const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: adminUser.id, role: 'superadmin' }, { onConflict: 'user_id' });

    if (roleError) {
        console.error("Failed to add superadmin role:", roleError.message);
    } else {
        console.log("Successfully added superadmin role to user_roles!");
    }
}

run();
