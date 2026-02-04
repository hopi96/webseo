import 'dotenv/config';
import { supabaseService } from '../server/supabase-service';
import { contentCalendarService } from '../server/content-calendar-service';
import { contentGeneratorService } from '../server/content-generator-service';

async function main() {
    console.log('🔍 Starting content generation verification...');

    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY is missing in .env');
        process.exit(1);
    }

    // 1. Get Site
    const sites = await supabaseService.getAllSites();
    console.log(`Found ${sites.length} sites.`);

    // Prefer site with SEO analysis
    const targetSite = sites.find(s => s.seoAnalysis) || sites[0];

    if (!targetSite) {
        console.error('❌ No sites found in database.');
        process.exit(1);
    }

    console.log(`✅ Selected Site: ${targetSite.name} (ID: ${targetSite.id})`);
    if (targetSite.seoAnalysis) {
        console.log('   has SEO Analysis: YES');
    } else {
        console.log('   has SEO Analysis: NO (will use basic context)');
    }

    // 2. Generate Calendar Entry
    console.log('\n📅 Generating Calendar Entry (LinkedIn)...');

    const entries = await contentCalendarService.generateCalendar({
        siteId: targetSite.id,
        period: {
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0]
        },
        platforms: ['linkedin']
    });

    if (!entries.length) {
        console.error('❌ No entries generated.');
        process.exit(1);
    }

    const entry = entries[0];
    console.log('✅ Calendar Entry:');
    console.log(`   Theme: ${entry.theme_de_publication}`);
    console.log(`   Context: ${entry.contexte?.substring(0, 100)}...`);

    // 3. Generate Content
    console.log('\n📝 Generating Content...');
    const result = await contentGeneratorService.generateContent({
        siteId: targetSite.id,
        platform: entry.plateforme,
        theme: entry.theme_de_publication,
        context: entry.contexte,
        publicationDate: entry.date_de_publication,
        generateImage: false
    });

    console.log('\n✨ GENERATED CONTENT PREVIEW:');
    console.log('-----------------------------------');
    console.log(result.contentText.substring(0, 1000));
    console.log('-----------------------------------');
    console.log(`✅ Content ID: ${result.id} (Created in DB)`);
}

main().catch(err => {
    console.error('❌ Script failed:', err);
    process.exit(1);
});
