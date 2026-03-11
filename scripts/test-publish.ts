import 'dotenv/config';
import { socialPublisherService } from '../server/social-publisher-service';
import { supabaseService } from '../server/supabase-service';

async function main() {
    console.log("🚀 Starting manual test of socialPublisherService.runOnce()...");
    try {
        const result = await socialPublisherService.runOnce();
        console.log("✅ runOnce finished!");
        console.log(JSON.stringify(result, null, 2));

        // Let's also verify why that specific content wasn't picked up if result is empty
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        const contents = await supabaseService.getContentForPublishing({
            start, end, statuses: ['validé'], limit: 200
        });
        console.log(`\n🔍 Found ${contents.length} 'validé' contents for today in DB.`);
        for (const c of contents) {
            const isPast = new Date(c.dateDePublication) <= now;
            console.log(`- ID: ${c.id}, Platform: ${c.typeContent}, Scheduled: ${c.dateDePublication}, IsPast: ${isPast}, Now: ${now.toISOString()}`);
            if (c.typeContent === 'blog') {
                const params = await supabaseService.getSocialParams(c.idSite);
                console.log(`\nSocial Params for this site (WordPress config):`, params.wordpress_blog);
            }
        }
    } catch (error) {
        console.error("❌ Error running publisher:", error);
    }
    process.exit(0);
}

main();
