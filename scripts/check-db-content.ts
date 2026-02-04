
import 'dotenv/config';
import { supabaseService } from '../server/supabase-service';

async function checkContent() {
    console.log('🔍 Checking Supabase Content...');
    try {
        const isConnected = await supabaseService.testConnection();
        if (!isConnected) {
            console.error('❌ Connection failed');
            return;
        }

        const allContent = await supabaseService.getAllContent();
        console.log(`📊 Total Content Count: ${allContent.length}`);

        if (allContent.length > 0) {
            console.log('\nLast 5 items:');
            allContent.slice(0, 5).forEach(c => {
                console.log(`- [${c.id}] (Site: ${c.idSite}) ${c.typeContent} - ${c.statut} - ${c.dateDePublication.toISOString()}`);
                console.log(`  Keys: ${Object.keys(c).join(', ')}`);
            });
        } else {
            console.log('⚠️ No content found in database table editorial_contents');
        }

        console.log('\n🔍 Checking Sites...');
        const sites = await supabaseService.getAllSites();
        console.log(`📊 Total Sites Count: ${sites.length}`);
        if (sites.length > 0) {
            sites.forEach(s => console.log(`- [${s.id}] ${s.name} (${s.url})`));
        } else {
            console.log('⚠️ No sites found in database table sites');
        }

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

checkContent();
