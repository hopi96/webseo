/**
 * Script de migration des contenus Airtable vers Supabase
 * Les sites doivent déjà être dans Supabase !
 * Exécuter: npx tsx scripts/migrate-content-only.ts
 */

import 'dotenv/config';
import Airtable from 'airtable';
import { createClient } from '@supabase/supabase-js';

// Configuration Airtable
const airtableApiKey = process.env.AIRTABLE_API_KEY;
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

async function buildSiteMapping(): Promise<Map<string, number>> {
    console.log('📦 Construction du mapping des sites...');

    const mapping = new Map<string, number>();

    // Récupérer les sites Airtable avec leurs ID site
    const airtableRecords = await base('analyse SEO').select({
        fields: ['ID site', 'URL']
    }).all();

    // Récupérer les sites Supabase
    const { data: supabaseSites, error } = await supabase
        .from('sites')
        .select('id, url');

    if (error || !supabaseSites) {
        console.error('❌ Erreur récupération sites Supabase:', error);
        return mapping;
    }

    // Créer le mapping basé sur l'URL
    for (const airtableRecord of airtableRecords) {
        const airtableId = String(airtableRecord.fields['ID site']);
        const airtableUrl = (airtableRecord.fields['URL'] as string || '').toLowerCase().trim();

        // Trouver le site correspondant dans Supabase par URL
        const supabaseSite = supabaseSites.find(s => {
            const sUrl = s.url.toLowerCase().trim();
            return sUrl === airtableUrl ||
                sUrl.includes(airtableUrl) ||
                airtableUrl.includes(sUrl);
        });

        if (supabaseSite) {
            mapping.set(airtableId, supabaseSite.id);
            console.log(`   ✅ Mapping: Airtable ${airtableId} → Supabase ${supabaseSite.id} (${airtableUrl})`);
        } else {
            console.log(`   ⚠️ Pas de correspondance pour Airtable ID ${airtableId} (${airtableUrl})`);
        }
    }

    console.log(`\n📊 ${mapping.size} sites mappés`);
    return mapping;
}

async function migrateContent(siteMapping: Map<string, number>) {
    console.log('\n📦 Migration des contenus éditoriaux depuis Airtable...');

    try {
        const records = await base('content').select({
            fields: ['ID_SITE', 'type_contenu', 'contenu_text', 'image', 'image_url', 'statut', 'date_de_publication']
        }).all();

        console.log(`   Trouvé ${records.length} contenus dans Airtable`);

        let migrated = 0;
        let skipped = 0;
        let errors = 0;

        for (const record of records) {
            const airtableSiteId = String(record.fields['ID_SITE']);
            const supabaseSiteId = siteMapping.get(airtableSiteId);

            if (!supabaseSiteId) {
                console.log(`   ⏭️ Contenu ignoré - site Airtable ${airtableSiteId} non mappé`);
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
                console.error(`   ❌ Erreur insertion:`, error.message);
                errors++;
            } else {
                migrated++;
            }
        }

        console.log(`\n📊 Résultat: ${migrated} contenus migrés, ${skipped} ignorés, ${errors} erreurs`);
    } catch (error) {
        console.error('❌ Erreur lors de la migration des contenus:', error);
    }
}

async function main() {
    console.log('🚀 Migration des contenus Airtable → Supabase');
    console.log('=============================================');

    // 1. Construire le mapping basé sur les URLs
    const siteMapping = await buildSiteMapping();

    if (siteMapping.size === 0) {
        console.error('❌ Aucun mapping trouvé, arrêt de la migration');
        process.exit(1);
    }

    // 2. Migrer les contenus
    await migrateContent(siteMapping);

    console.log('\n=============================================');
    console.log('✅ Migration terminée!');
}

main().catch(console.error);
