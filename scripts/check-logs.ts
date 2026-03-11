import 'dotenv/config';
import { supabaseService } from '../server/supabase-service';

async function checkLogs() {
    console.log('🔍 Checking Supabase Publication Logs...');
    try {
        const client = supabaseService.getClientWithAccessToken();
        const { data, error } = await client
            .from('publication_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (error) {
            console.error('❌ Query failed:', error);
            return;
        }

        console.log(`📊 Found ${data?.length || 0} logs:`);
        data?.forEach(log => {
            console.log(`- [${log.id}] Content: ${log.content_id}, Status: ${log.status}, Platform: ${log.platform}`);
            console.log(`  Message: ${log.message}`);
        });

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

checkLogs();
