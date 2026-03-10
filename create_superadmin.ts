import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// We must use the SERVICE ROLE KEY to use auth.admin
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

async function run() {
    console.log('Fetching superadmin user...');
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
        console.error("Error listing users:", error.message);
        return;
    }

    const existingAdmin = users.find(u => u.email === 'admin@webseo.local');
    let adminId;

    if (existingAdmin) {
        console.log(`User admin@webseo.local already exists with ID ${existingAdmin.id}. Updating password...`);
        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            existingAdmin.id,
            { password: 'admin', email_confirm: true }
        );
        if (updateError) {
            console.error("Failed to update password:", updateError.message);
            return;
        }
        adminId = existingAdmin.id;
        console.log("Password updated successfully via Admin API.");
    } else {
        console.log("Creating admin@webseo.local user via Admin API...");
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: 'admin@webseo.local',
            password: 'admin',
            email_confirm: true,
        });
        if (createError) {
            console.error("Failed to create user:", createError.message);
            return;
        }
        adminId = newUser.user.id;
        console.log(`User created via Admin API with ID: ${adminId}`);
    }

    console.log("Ensuring user has superadmin role in user_roles table...");
    const { error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: adminId, role: 'superadmin' }, { onConflict: 'user_id' });

    if (rolesError) {
        console.error("Failed to assign role:", rolesError.message);
    } else {
        console.log("Role 'superadmin' successfully assigned!");
    }
}

run();
