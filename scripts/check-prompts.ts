import { SupabaseService } from '../server/supabase-service';
import 'dotenv/config';

async function run() {
    const service = new SupabaseService();
    try {
        console.log('Testing connection...');
        await service.testConnection();
        console.log('Fetching system prompts...');
        const prompts = await service.getAllSystemPrompts();
        console.log('✅ Success! Found ' + prompts.length + ' prompts.');
        console.log('Active prompts:', prompts.filter(p => p.actif).map(p => p.nom).join(', '));
    } catch (error: any) {
        console.error('❌ Failed:', error.message);
        process.exit(1);
    }
}

run();
