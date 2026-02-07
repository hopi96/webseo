
import { supabaseService } from './server/supabase-service';

async function checkSite10() {
    console.log("🔍 Checking Site 10 Social Params...");
    try {
        const site = await supabaseService.getSiteById(10);
        if (!site) {
            console.log("❌ Site 10 not found");
            return;
        }
        console.log("✅ Site 10 found: " + site.name);
        console.log("📊 Raw Social Params:", JSON.stringify(site.socialParams, null, 2));

        // Check specific structure
        const params = site.socialParams as any;
        if (params?.frequence_publication) {
            console.log("✅ frequence_publication found");
        } else {
            console.log("❌ frequence_publication MISSING");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

checkSite10();
