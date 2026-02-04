
import 'dotenv/config';
import { supabaseService } from '../server/supabase-service';

async function verifyFullFlow() {
    console.log('🚀 Starting Full Flow Verification (RLS Check)...');

    try {
        // 1. GET SITES (Read Permission)
        console.log('\n1️⃣  Testing READ Sites...');
        const sites = await supabaseService.getAllSites();
        if (sites.length === 0) {
            console.error('❌  No sites found. Cannot proceed with creation test.');
            return;
        }
        const testSite = sites[0];
        console.log(`✅  Found ${sites.length} sites. Using site: [${testSite.id}] ${testSite.name}`);

        // 2. CREATE CONTENT (Write Permission)
        console.log('\n2️⃣  Testing CREATE Content...');
        const newContent = {
            idSite: testSite.id,
            typeContent: 'newsletter',
            contentText: `RLS Verification Test - ${new Date().toISOString()}`,
            statut: 'en attente',
            hasImage: false,
            imageUrl: null,
            imageSource: null, // Explicitly null
            dateDePublication: new Date()
        };

        const created = await supabaseService.createContent(newContent);
        console.log(`✅  Content created successfully! ID: ${created.id}`);

        // 3. READ CONTENT (Read Permission for new item)
        console.log('\n3️⃣  Testing READ Created Content...');
        const fetchedContent = await supabaseService.getContentBySite(testSite.id);
        const match = fetchedContent.find(c => c.id === created.id);

        if (match) {
            console.log(`✅  Verified content exists in DB: "${match.contentText}"`);
        } else {
            console.error('❌  Created content NOT found in subsequent fetch (Consistency/Latency issue?)');
        }

        // 4. CLEANUP (Delete Permission)
        console.log('\n4️⃣  Cleaning up (DELETE)...');
        await supabaseService.deleteContent(created.id);
        console.log(`✅  Test content deleted.`);

        console.log('\n✨  VERIFICATION SUCCESSFUL: Policies allow Read/Write/Delete.');

    } catch (error: any) {
        console.error('\n❌  VERIFICATION FAILED');
        console.error('Error details:', error);

        if (error.code === '42501') {
            console.error('👉  Cause: RLS Policy Violation. The SQL migration was probably not applied correctly.');
        }
    }
}

verifyFullFlow();
