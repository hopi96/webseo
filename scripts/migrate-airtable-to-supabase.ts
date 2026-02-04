/**
 * Script de migration des données Airtable vers Supabase
 * Exécuter: npx tsx scripts/migrate-airtable-to-supabase.ts
 */

import 'dotenv/config';
import Airtable from 'airtable';
import { createClient } from '@supabase/supabase-js';

// Configuration Airtable
const airtableApiKey = process.env.AIRTABLE_API_KEY;
// Base ID exact depuis l'ancien service (app9L4iAzg6Nms9Qq sans le 'r' final)
const airtableBaseId = 'app9L4iAzg6Nms9Qq';

if (!airtableApiKey) {
    console.error('❌ Variable AIRTABLE_API_KEY requise');
    process.exit(1);
}

const airtable = new Airtable({ apiKey: airtableApiKey });
const base = airtable.base(airtableBaseId);

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables SUPABASE_URL et SUPABASE_ANON_KEY requises');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapping des anciens IDs Airtable vers nouveaux IDs Supabase
const siteIdMapping = new Map<number, number>();

async function migrateSites() {
    console.log('\n📦 Migration des sites depuis Airtable...');

    try {
        const records = await base('analyse SEO').select({
            fields: ['ID site', 'Nom_site_web', 'URL', 'Analyse_SEO', 'programme_rs', 'parametre_rs']
        }).all();

        console.log(`   Trouvé ${records.length} sites dans Airtable`);

        for (const record of records) {
            const airtableSiteId = record.fields['ID site'] as number;
            const name = (record.fields['Nom_site_web'] as string || '').replace(/^\d+\s*[-–]\s*/, '').trim();
            const url = record.fields['URL'] as string || '';

            // Parse SEO analysis JSON
            let seoAnalysis = null;
            try {
                const rawSeo = record.fields['Analyse_SEO'];
                if (rawSeo && typeof rawSeo === 'string') {
                    seoAnalysis = JSON.parse(rawSeo);
                }
            } catch (e) {
                console.log(`   ⚠️ Impossible de parser l'analyse SEO pour le site ${airtableSiteId}`);
            }

            // Parse social params
            let socialParams = null;
            try {
                const rawParams = record.fields['parametre_rs'];
                if (rawParams && typeof rawParams === 'string') {
                    socialParams = JSON.parse(rawParams);
                }
            } catch (e) {
                // Ignorer les erreurs de parsing
            }

            if (!name || !url) {
                console.log(`   ⏭️ Site ${airtableSiteId} ignoré (données incomplètes)`);
                continue;
            }

            // Insérer dans Supabase
            const { data, error } = await supabase
                .from('sites')
                .insert({
                    name,
                    url,
                    seo_analysis: seoAnalysis,
                    social_program: record.fields['programme_rs'] as string || null,
                    social_params: socialParams
                })
                .select()
                .single();

            if (error) {
                console.error(`   ❌ Erreur insertion site ${name}:`, error.message);
            } else {
                siteIdMapping.set(airtableSiteId, data.id);
                console.log(`   ✅ Site migré: ${name} (Airtable ID: ${airtableSiteId} → Supabase ID: ${data.id})`);
            }
        }

        console.log(`\n📊 ${siteIdMapping.size} sites migrés avec succès`);
        console.log('   Mapping Airtable → Supabase:', Object.fromEntries(siteIdMapping));
    } catch (error) {
        console.error('❌ Erreur lors de la migration des sites:', error);
    }
}

async function migrateContent() {
    console.log('\n📦 Migration des contenus éditoriaux depuis Airtable...');

    try {
        const records = await base('content').select({
            fields: ['ID_SITE', 'type_contenu', 'contenu_text', 'image', 'image_url', 'statut', 'date_de_publication']
        }).all();

        console.log(`   Trouvé ${records.length} contenus dans Airtable`);

        let migrated = 0;
        let skipped = 0;

        for (const record of records) {
            const airtableSiteId = record.fields['ID_SITE'] as number;
            const supabaseSiteId = siteIdMapping.get(airtableSiteId);

            if (!supabaseSiteId) {
                console.log(`   ⏭️ Contenu ignoré - site ${airtableSiteId} non trouvé`);
                skipped++;
                continue;
            }

            const contentType = record.fields['type_contenu'] as string || 'newsletter';
            const contentText = record.fields['contenu_text'] as string || '';
            const status = record.fields['statut'] as string || 'en attente';
            const publicationDate = record.fields['date_de_publication'] as string || new Date().toISOString();

            // Gestion des images
            let hasImage = false;
            let imageUrl: string | null = null;
            let imageSource: string | null = null;

            const images = record.fields['image'] as any[];
            if (images && images.length > 0) {
                hasImage = true;
                imageUrl = images[0].url;
                imageSource = 'upload';
            } else if (record.fields['image_url']) {
                hasImage = true;
                imageUrl = record.fields['image_url'] as string;
                imageSource = 'ai';
            }

            if (!contentText) {
                skipped++;
                continue;
            }

            // Insérer dans Supabase
            const { error } = await supabase
                .from('editorial_contents')
                .insert({
                    site_id: supabaseSiteId,
                    content_type: contentType,
                    content_text: contentText,
                    has_image: hasImage,
                    image_url: imageUrl,
                    image_source: imageSource,
                    status: status,
                    publication_date: publicationDate
                });

            if (error) {
                console.error(`   ❌ Erreur insertion contenu:`, error.message);
            } else {
                migrated++;
            }
        }

        console.log(`\n📊 ${migrated} contenus migrés, ${skipped} ignorés`);
    } catch (error) {
        console.error('❌ Erreur lors de la migration des contenus:', error);
    }
}

async function migratePrompts() {
    console.log('\n📦 Migration des prompts système depuis Airtable...');

    try {
        const records = await base('Gestion prompt').select().all();

        console.log(`   Trouvé ${records.length} prompts dans Airtable`);

        for (const record of records) {
            const name = record.fields['Name'] as string || 'Prompt sans nom';
            const promptSystem = record.fields['Prompt system'] as string;

            if (!promptSystem) {
                console.log(`   ⏭️ Prompt "${name}" ignoré (pas de contenu)`);
                continue;
            }

            // Vérifier si un prompt par défaut existe déjà
            const { data: existing } = await supabase
                .from('system_prompts')
                .select('id')
                .eq('name', name)
                .single();

            if (existing) {
                console.log(`   ⏭️ Prompt "${name}" existe déjà, mise à jour...`);
                await supabase
                    .from('system_prompts')
                    .update({
                        prompt_system: promptSystem,
                        output_structure: record.fields['structure_sortie'] as string || null,
                        description: record.fields['Description'] as string || null,
                        is_active: (record.fields['Active'] || record.fields['actif']) as boolean || false
                    })
                    .eq('id', existing.id);
            } else {
                const { error } = await supabase
                    .from('system_prompts')
                    .insert({
                        name,
                        prompt_system: promptSystem,
                        output_structure: record.fields['structure_sortie'] as string || null,
                        description: record.fields['Description'] as string || null,
                        is_active: (record.fields['Active'] || record.fields['actif']) as boolean || false
                    });

                if (error) {
                    console.error(`   ❌ Erreur insertion prompt ${name}:`, error.message);
                } else {
                    console.log(`   ✅ Prompt migré: ${name}`);
                }
            }
        }
    } catch (error) {
        console.error('❌ Erreur lors de la migration des prompts:', error);
    }
}

async function main() {
    console.log('🚀 Démarrage de la migration Airtable → Supabase');
    console.log('================================================');

    // 1. Migrer les sites d'abord (pour avoir le mapping des IDs)
    await migrateSites();

    // 2. Migrer les contenus (utilise le mapping des sites)
    await migrateContent();

    // 3. Migrer les prompts
    await migratePrompts();

    console.log('\n================================================');
    console.log('✅ Migration terminée!');
}

main().catch(console.error);
