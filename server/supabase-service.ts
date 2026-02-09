import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { EditorialContent, SystemPrompt, InsertSystemPrompt } from '@shared/schema';

// Types pour la base de données Supabase
export interface Site {
    id: number;
    name: string;
    url: string;
    seo_analysis: any | null;
    social_program: string | null;
    social_params: any | null;
    created_at: string;
    updated_at: string;
}

export interface DbEditorialContent {
    id: number;
    site_id: number;
    content_type: string;
    content_text: string;
    has_image: boolean;
    image_url: string | null;
    image_source: 'upload' | 'ai' | null;
    status: string;
    publication_date: string;
    created_at: string;
    updated_at: string;
}

export interface DbSystemPrompt {
    id: number;
    name: string;
    description: string | null;
    prompt_system: string;
    output_structure: string | null;
    platform: string | null;
    is_active: boolean;
    site_id: number | null;
    created_at: string;
    updated_at: string;
}

export interface DbPublicationLog {
    id: number;
    content_id: number | null;
    site_id: number | null;
    platform: string;
    status: 'success' | 'failed';
    message: string | null;
    external_id: string | null;
    publication_date: string | null;
    content_excerpt: string | null;
    created_at: string;
}

// Initialisation du client Supabase
let supabase: SupabaseClient | null = null;

function initializeSupabase(): SupabaseClient {
    if (!supabase) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Variables SUPABASE_URL et SUPABASE_ANON_KEY requises');
        }

        supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✅ Client Supabase initialisé');
    }
    return supabase;
}

// Type pour les sites avec analyse SEO (compatible avec l'ancien format)
export interface AirtableSite {
    id: number;
    name: string;
    url: string;
    programmeRs?: string | null;
    seoAnalysis?: any;
    socialParams?: any;
}

export class SupabaseService {

    // ============================================
    // GESTION DES SITES
    // ============================================

    /**
     * Récupère tous les sites avec données SEO
     */
    async getAllSites(): Promise<AirtableSite[]> {
        try {
            const client = initializeSupabase();

            const { data, error } = await client
                .from('sites')
                .select('*')
                .order('id', { ascending: false });

            if (error) throw error;

            console.log(`✅ ${data?.length || 0} sites récupérés depuis Supabase`);

            return (data || []).map((site: Site) => ({
                id: site.id,
                name: site.name,
                url: site.url,
                programmeRs: site.social_program,
                seoAnalysis: site.seo_analysis,
                socialParams: site.social_params
            }));
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des sites:', error);
            throw new Error('Impossible de récupérer les sites');
        }
    }

    /**
     * Récupère un site par ID
     */
    async getSiteById(siteId: number): Promise<AirtableSite | null> {
        try {
            const client = initializeSupabase();

            const { data, error } = await client
                .from('sites')
                .select('*')
                .eq('id', siteId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // Not found
                throw error;
            }

            return {
                id: data.id,
                name: data.name,
                url: data.url,
                programmeRs: data.social_program,
                seoAnalysis: data.seo_analysis,
                socialParams: data.social_params
            };
        } catch (error) {
            console.error(`❌ Erreur lors de la récupération du site ${siteId}:`, error);
            throw error;
        }
    }

    /**
     * Crée un nouveau site
     */
    async createSite(siteData: { name: string; url: string; seoAnalysis?: any }): Promise<AirtableSite> {
        try {
            const client = initializeSupabase();

            const { data, error } = await client
                .from('sites')
                .insert({
                    name: siteData.name,
                    url: siteData.url,
                    seo_analysis: siteData.seoAnalysis || null
                })
                .select()
                .single();

            if (error) throw error;

            console.log(`✅ Site créé avec ID: ${data.id}`);

            return {
                id: data.id,
                name: data.name,
                url: data.url,
                programmeRs: data.social_program,
                seoAnalysis: data.seo_analysis,
                socialParams: data.social_params
            };
        } catch (error) {
            console.error('❌ Erreur lors de la création du site:', error);
            throw new Error('Impossible de créer le site');
        }
    }

    /**
     * Met à jour un site
     */
    async updateSite(siteId: number, updates: { seoAnalysis?: any; socialParams?: any; name?: string; url?: string }): Promise<AirtableSite> {
        try {
            const client = initializeSupabase();

            const updateData: any = {};
            if (updates.seoAnalysis !== undefined) updateData.seo_analysis = updates.seoAnalysis;
            if (updates.socialParams !== undefined) updateData.social_params = updates.socialParams;
            if (updates.name !== undefined) updateData.name = updates.name;
            if (updates.url !== undefined) updateData.url = updates.url;

            const { data, error } = await client
                .from('sites')
                .update(updateData)
                .eq('id', siteId)
                .select()
                .single();

            if (error) throw error;

            console.log(`✅ Site ${siteId} mis à jour`);

            return {
                id: data.id,
                name: data.name,
                url: data.url,
                programmeRs: data.social_program,
                seoAnalysis: data.seo_analysis,
                socialParams: data.social_params
            };
        } catch (error) {
            console.error(`❌ Erreur lors de la mise à jour du site ${siteId}:`, error);
            throw error;
        }
    }

    /**
     * Supprime un site
     */
    async deleteSite(siteId: number): Promise<boolean> {
        try {
            const client = initializeSupabase();

            const { error } = await client
                .from('sites')
                .delete()
                .eq('id', siteId);

            if (error) throw error;

            console.log(`✅ Site ${siteId} supprimé`);
            return true;
        } catch (error) {
            console.error(`❌ Erreur lors de la suppression du site ${siteId}:`, error);
            throw error;
        }
    }

    /**
     * Met à jour le programme des réseaux sociaux pour un site
     */
    async updateSocialMediaProgram(siteId: number, programData: string): Promise<void> {
        try {
            const client = initializeSupabase();

            const { error } = await client
                .from('sites')
                .update({ social_program: programData })
                .eq('id', siteId);

            if (error) throw error;

            console.log(`✅ Programme RS mis à jour pour le site ${siteId}`);
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour du programme RS:', error);
            throw error;
        }
    }

    /**
     * Récupère le programme des réseaux sociaux pour un site
     */
    async getSocialMediaProgram(siteId: number): Promise<string | null> {
        try {
            const client = initializeSupabase();

            const { data, error } = await client
                .from('sites')
                .select('social_program')
                .eq('id', siteId)
                .single();

            if (error) throw error;

            return data?.social_program || null;
        } catch (error) {
            console.error('❌ Erreur lors de la récupération du programme RS:', error);
            throw error;
        }
    }

    /**
     * Met à jour les paramètres des réseaux sociaux pour un site
     */
    async updateSocialParams(siteId: number, socialParams: any): Promise<void> {
        try {
            const client = initializeSupabase();

            const { error } = await client
                .from('sites')
                .update({ social_params: socialParams })
                .eq('id', siteId);

            if (error) throw error;

            console.log(`✅ Paramètres RS mis à jour pour le site ${siteId}`);
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour des paramètres RS:', error);
            throw error;
        }
    }

    /**
     * Récupère les paramètres des réseaux sociaux pour un site
     */
    async getSocialParams(siteId: number): Promise<any> {
        try {
            const client = initializeSupabase();

            const { data, error } = await client
                .from('sites')
                .select('social_params')
                .eq('id', siteId)
                .single();

            if (error) throw error;

            return data?.social_params || {};
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des paramètres RS:', error);
            throw error;
        }
    }

    // ============================================
    // GESTION DES CONTENUS ÉDITORIAUX
    // ============================================

    /**
     * Récupère tous les contenus éditoriaux
     */
    async getAllContent(): Promise<EditorialContent[]> {
        try {
            const client = initializeSupabase();

            const { data, error } = await client
                .from('editorial_contents')
                .select('*')
                .order('publication_date', { ascending: false });

            if (error) throw error;

            console.log(`✅ ${data?.length || 0} contenus récupérés`);

            return (data || []).map((content: DbEditorialContent) => this.mapDbContentToEditorial(content));
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des contenus:', error);
            throw new Error('Impossible de récupérer les contenus');
        }
    }

    /**
     * Récupère les contenus pour un site spécifique
     */
    async getContentBySite(siteId: number): Promise<EditorialContent[]> {
        try {
            const client = initializeSupabase();

            const { data, error } = await client
                .from('editorial_contents')
                .select('*')
                .eq('site_id', siteId)
                .order('publication_date', { ascending: false });

            if (error) throw error;

            return (data || []).map((content: DbEditorialContent) => this.mapDbContentToEditorial(content));
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des contenus par site:', error);
            throw error;
        }
    }

    /**
     * Récupère les contenus pour une date spécifique
     */
    async getContentByDate(date: Date): Promise<EditorialContent[]> {
        try {
            const client = initializeSupabase();

            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const { data, error } = await client
                .from('editorial_contents')
                .select('*')
                .gte('publication_date', startOfDay.toISOString())
                .lte('publication_date', endOfDay.toISOString())
                .order('publication_date', { ascending: true });

            if (error) throw error;

            return (data || []).map((content: DbEditorialContent) => this.mapDbContentToEditorial(content));
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des contenus par date:', error);
            throw error;
        }
    }

    /**
     * Récupère les contenus à publier sur une période donnée
     */
    async getContentForPublishing(params: {
        start: Date;
        end: Date;
        statuses: string[];
        limit?: number;
    }): Promise<EditorialContent[]> {
        try {
            const client = initializeSupabase();

            const { data, error } = await client
                .from('editorial_contents')
                .select('*')
                .in('status', params.statuses)
                .gte('publication_date', params.start.toISOString())
                .lte('publication_date', params.end.toISOString())
                .order('publication_date', { ascending: true })
                .limit(params.limit ?? 200);

            if (error) throw error;

            return (data || []).map((content: DbEditorialContent) => this.mapDbContentToEditorial(content));
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des contenus à publier:', error);
            throw error;
        }
    }

    /**
     * Log des tentatives de publication (succès/échec)
     */
    async createPublicationLog(params: {
        contentId?: number;
        siteId?: number;
        platform: string;
        status: 'success' | 'failed';
        message?: string;
        externalId?: string;
        publicationDate?: Date | string;
        contentExcerpt?: string;
    }): Promise<void> {
        try {
            const client = initializeSupabase();
            const payload: any = {
                content_id: params.contentId ?? null,
                site_id: params.siteId ?? null,
                platform: params.platform,
                status: params.status,
                message: params.message || null,
                external_id: params.externalId || null,
                publication_date: params.publicationDate
                    ? (params.publicationDate instanceof Date ? params.publicationDate.toISOString() : params.publicationDate)
                    : null,
                content_excerpt: params.contentExcerpt || null
            };

            const { error } = await client
                .from('publication_logs')
                .insert(payload);

            if (error) throw error;
        } catch (error) {
            console.warn('⚠️ Erreur création publication_log:', error);
        }
    }

    /**
     * Snapshot monitoring (comptes + listes)
     */
    async getMonitoringSnapshot(siteId?: number): Promise<{
        now: string;
        counts: {
            total: number;
            byStatus: Record<string, number>;
            dueToday: number;
            publishedToday: number;
            pendingToday: number;
            overdue: number;
            upcoming7d: number;
        };
        lastPublished: Array<{
            id: number;
            siteId: number;
            platform: string;
            status: string;
            publicationDate: string;
            excerpt: string;
        }>;
        nextScheduled: Array<{
            id: number;
            siteId: number;
            platform: string;
            status: string;
            publicationDate: string;
            excerpt: string;
        }>;
        failedPosts: Array<{
            id: number;
            contentId: number | null;
            siteId: number | null;
            platform: string;
            message: string;
            createdAt: string;
            publicationDate: string | null;
            excerpt: string;
        }>;
    }> {
        const client = initializeSupabase();
        const now = new Date();
        const startDay = new Date(now);
        startDay.setHours(0, 0, 0, 0);
        const endDay = new Date(now);
        endDay.setHours(23, 59, 59, 999);
        const next7d = new Date(now);
        next7d.setDate(next7d.getDate() + 7);
        next7d.setHours(23, 59, 59, 999);

        const statuses = ['en attente', 'à réviser', 'validé', 'publié'];

        const baseCount = () => {
            let query = client
                .from('editorial_contents')
                .select('id', { count: 'exact', head: true });
            if (siteId) query = query.eq('site_id', siteId);
            return query;
        };

        const countWith = async (apply: (q: ReturnType<typeof baseCount>) => ReturnType<typeof baseCount>) => {
            const { count, error } = await apply(baseCount());
            if (error) throw error;
            return count || 0;
        };

        const byStatus: Record<string, number> = {};
        for (const status of statuses) {
            byStatus[status] = await countWith(q => q.eq('status', status));
        }

        const total = await countWith(q => q);
        const dueToday = await countWith(q => q.gte('publication_date', startDay.toISOString()).lte('publication_date', endDay.toISOString()));
        const publishedToday = await countWith(q =>
            q.eq('status', 'publié')
                .gte('publication_date', startDay.toISOString())
                .lte('publication_date', endDay.toISOString())
        );
        const overdue = await countWith(q =>
            q.neq('status', 'publié')
                .lt('publication_date', now.toISOString())
        );
        const upcoming7d = await countWith(q =>
            q.gte('publication_date', now.toISOString())
                .lte('publication_date', next7d.toISOString())
        );

        const pendingToday = Math.max(0, dueToday - publishedToday);

        let publishedQuery = client
            .from('editorial_contents')
            .select('id, site_id, content_type, status, publication_date, content_text')
            .eq('status', 'publié')
            .order('publication_date', { ascending: false })
            .limit(5);

        if (siteId) {
            publishedQuery = publishedQuery.eq('site_id', siteId);
        }

        const { data: publishedData, error: publishedError } = await publishedQuery;
        if (publishedError) throw publishedError;

        let nextQuery = client
            .from('editorial_contents')
            .select('id, site_id, content_type, status, publication_date, content_text')
            .neq('status', 'publié')
            .gte('publication_date', now.toISOString())
            .order('publication_date', { ascending: true })
            .limit(5);

        if (siteId) {
            nextQuery = nextQuery.eq('site_id', siteId);
        }

        const { data: nextData, error: nextError } = await nextQuery;
        if (nextError) throw nextError;

        let failedPosts: Array<{
            id: number;
            contentId: number | null;
            siteId: number | null;
            platform: string;
            message: string;
            createdAt: string;
            publicationDate: string | null;
            excerpt: string;
        }> = [];

        try {
            let failureQuery = client
                .from('publication_logs')
                .select('id, content_id, site_id, platform, status, message, publication_date, content_excerpt, created_at')
                .eq('status', 'failed')
                .order('created_at', { ascending: false })
                .limit(10);

            if (siteId) {
                failureQuery = failureQuery.eq('site_id', siteId);
            }

            const { data: failureData, error: failureError } = await failureQuery;
            if (failureError) throw failureError;

            failedPosts = (failureData || []).map((row: DbPublicationLog) => ({
                id: row.id,
                contentId: row.content_id ?? null,
                siteId: row.site_id ?? null,
                platform: row.platform,
                message: row.message || 'Erreur inconnue',
                createdAt: row.created_at,
                publicationDate: row.publication_date ?? null,
                excerpt: row.content_excerpt || ''
            }));
        } catch (error) {
            console.warn('⚠️ Erreur récupération publication_logs:', error);
        }

        return {
            now: now.toISOString(),
            counts: {
                total,
                byStatus,
                dueToday,
                publishedToday,
                pendingToday,
                overdue,
                upcoming7d
            },
            lastPublished: (publishedData || []).map((row: any) => ({
                id: row.id,
                siteId: row.site_id,
                platform: row.content_type,
                status: row.status,
                publicationDate: row.publication_date,
                excerpt: (row.content_text || '').slice(0, 140)
            })),
            nextScheduled: (nextData || []).map((row: any) => ({
                id: row.id,
                siteId: row.site_id,
                platform: row.content_type,
                status: row.status,
                publicationDate: row.publication_date,
                excerpt: (row.content_text || '').slice(0, 140)
            })),
            failedPosts
        };
    }

    /**
     * Crée un nouveau contenu
     */
    async createContent(contentData: {
        idSite: number;
        typeContent: string;
        contentText: string;
        statut?: string;
        hasImage?: boolean;
        imageUrl?: string | null;
        imageSource?: string | null;
        dateDePublication: Date | string;
    }): Promise<EditorialContent> {
        try {
            const client = initializeSupabase();

            const { data, error } = await client
                .from('editorial_contents')
                .insert({
                    site_id: contentData.idSite,
                    content_type: contentData.typeContent,
                    content_text: contentData.contentText,
                    has_image: contentData.hasImage || false,
                    image_url: contentData.imageUrl || null,
                    image_source: contentData.imageSource || null,
                    status: contentData.statut || 'en attente',
                    publication_date: contentData.dateDePublication instanceof Date
                        ? contentData.dateDePublication.toISOString()
                        : contentData.dateDePublication
                })
                .select()
                .single();

            if (error) throw error;

            console.log(`✅ Contenu créé avec ID: ${data.id}`);

            return this.mapDbContentToEditorial(data);
        } catch (error) {
            console.error('❌ Erreur lors de la création du contenu:', error);
            throw new Error('Impossible de créer le contenu');
        }
    }

    /**
     * Met à jour un contenu
     */
    async updateContent(contentId: string | number, updateData: Partial<EditorialContent>): Promise<EditorialContent> {
        try {
            const client = initializeSupabase();

            const fieldsToUpdate: any = {};

            if (updateData.typeContent) fieldsToUpdate.content_type = updateData.typeContent;
            if (updateData.contentText) fieldsToUpdate.content_text = updateData.contentText;
            if (updateData.statut) fieldsToUpdate.status = updateData.statut;
            if (updateData.hasImage !== undefined) fieldsToUpdate.has_image = updateData.hasImage;
            if (updateData.imageUrl !== undefined) fieldsToUpdate.image_url = updateData.imageUrl;
            if (updateData.imageSource !== undefined) fieldsToUpdate.image_source = updateData.imageSource;
            if (updateData.idSite) fieldsToUpdate.site_id = updateData.idSite;
            if (updateData.dateDePublication) {
                fieldsToUpdate.publication_date = updateData.dateDePublication instanceof Date
                    ? updateData.dateDePublication.toISOString()
                    : updateData.dateDePublication;
            }

            const { data, error } = await client
                .from('editorial_contents')
                .update(fieldsToUpdate)
                .eq('id', typeof contentId === 'string' ? parseInt(contentId) : contentId)
                .select()
                .single();

            if (error) throw error;

            console.log(`✅ Contenu ${contentId} mis à jour`);

            return this.mapDbContentToEditorial(data);
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour du contenu:', error);
            throw new Error('Impossible de mettre à jour le contenu');
        }
    }

    /**
     * Supprime un contenu
     */
    async deleteContent(contentId: string | number): Promise<boolean> {
        try {
            const client = initializeSupabase();

            const { error } = await client
                .from('editorial_contents')
                .delete()
                .eq('id', typeof contentId === 'string' ? parseInt(contentId) : contentId);

            if (error) throw error;

            console.log(`✅ Contenu ${contentId} supprimé`);
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de la suppression du contenu:', error);
            throw error;
        }
    }

    /**
     * Met à jour le statut de plusieurs contenus en lot
     */
    async bulkUpdateStatus(contentIds: (string | number)[], statut: string): Promise<EditorialContent[]> {
        try {
            const client = initializeSupabase();

            const validStatuses = ['en attente', 'à réviser', 'validé', 'publié'];
            if (!validStatuses.includes(statut)) {
                throw new Error(`Statut invalide: ${statut}`);
            }

            const numericIds = contentIds.map(id => typeof id === 'string' ? parseInt(id) : id);

            const { data, error } = await client
                .from('editorial_contents')
                .update({ status: statut })
                .in('id', numericIds)
                .select();

            if (error) throw error;

            console.log(`✅ ${data?.length || 0} contenus mis à jour avec statut: ${statut}`);

            return (data || []).map((content: DbEditorialContent) => this.mapDbContentToEditorial(content));
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour en lot:', error);
            throw error;
        }
    }

    /**
     * Convertit un contenu DB vers le format EditorialContent
     */
    private mapDbContentToEditorial(content: DbEditorialContent): EditorialContent {
        return {
            id: content.id,
            airtableId: content.id.toString(), // Pour compatibilité avec l'ancien format
            idSite: content.site_id,
            typeContent: content.content_type,
            contentText: content.content_text,
            hasImage: content.has_image,
            imageUrl: content.image_url,
            imageSource: content.image_source,
            statut: content.status,
            dateDePublication: new Date(content.publication_date),
            createdAt: new Date(content.created_at)
        };
    }

    // ============================================
    // GESTION DES PROMPTS SYSTÈME
    // ============================================

    /**
     * Récupère tous les prompts système
     */
    /**
     * Récupère tous les prompts système, optionnellement filtrés par site
     */
    async getAllSystemPrompts(siteId?: number): Promise<SystemPrompt[]> {
        try {
            const client = initializeSupabase();

            // 1. Récupérer TOUS les prompts globaux (is_active=true ou false, peu importe)
            // On filtre STRICTEMENT pour que site_id soit NULL.
            // Cela empêche les prompts "pollués" (avec site_id) de la table system_prompts d'apparaître ici.
            const { data: globalPrompts, error: globalError } = await client
                .from('system_prompts')
                .select('*')
                .is('site_id', null) // STRICT FILTER
                .order('created_at', { ascending: false });

            if (globalError) throw globalError;

            // Map global prompts
            const mappedGlobalPrompts = (globalPrompts || []).map((prompt: DbSystemPrompt) =>
                this.mapDbPromptToSystemPrompt(prompt)
            );

            // Si pas de siteId, on retourne les globaux
            if (siteId === undefined) return mappedGlobalPrompts;

            // 2. Si siteId, récupérer les overrides de ce site
            const { data: sitePrompts, error: siteError } = await client
                .from('site_prompts')
                .select('*')
                .eq('site_id', siteId);

            if (siteError) throw siteError;

            // 3. Fusionner (Merge)
            const mergedPrompts = new Map<string, SystemPrompt>();

            // Helper function to normalize keys
            const normalizeKey = (k: string) => k.trim().toLowerCase();

            // Ajouter les globaux d'abord
            mappedGlobalPrompts.forEach(p => {
                const key = p.platform ? normalizeKey(p.platform) : normalizeKey(p.name || '');
                if (key) mergedPrompts.set(key, p);
            });

            // Ajouter/Ecraser avec les site-specifics
            (sitePrompts || []).forEach((sp: any) => {
                const mappedSitePrompt: SystemPrompt = {
                    id: sp.id.toString(),
                    name: sp.name || `Prompt ${sp.platform}`,
                    promptSystem: sp.prompt_system,
                    outputStructure: null, // Site prompts table doesn't have output_structure column? Need to check schema.
                    description: `Prompt personnalisé pour ${sp.platform}`,
                    isActive: sp.is_active,
                    siteId: sp.site_id,
                    platform: sp.platform,
                    createdAt: new Date(sp.created_at),
                    updatedAt: new Date(sp.updated_at)
                };

                const key = sp.platform ? normalizeKey(sp.platform) : '';
                if (key) mergedPrompts.set(key, mappedSitePrompt);
            });

            return Array.from(mergedPrompts.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        } catch (error) {
            console.error('❌ Erreur lors de la récupération des prompts:', error);
            throw new Error('Impossible de récupérer les prompts');
        }
    }

    /**
     * Récupère le prompt système actif
     */
    async getActiveSystemPrompt(): Promise<SystemPrompt | null> {
        try {
            const client = initializeSupabase();

            const { data, error } = await client
                .from('system_prompts')
                .select('*')
                .eq('is_active', true)
                .limit(1)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log('⚠️ Aucun prompt système actif trouvé');
                    return null;
                }
                throw error;
            }

            console.log(`✅ Prompt système actif récupéré: ${data.name}`);

            return this.mapDbPromptToSystemPrompt(data);
        } catch (error) {
            console.error('❌ Erreur lors de la récupération du prompt actif:', error);
            return null;
        }
    }

    /**
     * Crée un nouveau prompt système
     */
    async createSystemPrompt(promptData: InsertSystemPrompt & { siteId?: number }): Promise<SystemPrompt> {
        try {
            const client = initializeSupabase();

            const { data, error } = await client
                .from('system_prompts')
                .insert({
                    name: promptData.name || 'Nouveau prompt',
                    description: promptData.description || null,
                    prompt_system: promptData.promptSystem,
                    output_structure: promptData.outputStructure || null,
                    is_active: promptData.isActive || false,
                    site_id: promptData.siteId || null,
                    platform: promptData.platform || null
                })
                .select()
                .single();

            if (error) throw error;

            console.log(`✅ Prompt créé avec ID: ${data.id}`);

            return this.mapDbPromptToSystemPrompt(data);
        } catch (error) {
            console.error('❌ Erreur lors de la création du prompt:', error);
            throw new Error('Impossible de créer le prompt');
        }
    }

    /**
     * Met à jour un prompt système
     */
    async updateSystemPrompt(promptId: string | number, updateData: Partial<InsertSystemPrompt> & { siteId?: number }): Promise<SystemPrompt> {
        try {
            const client = initializeSupabase();

            const fieldsToUpdate: any = {};

            if (updateData.name !== undefined) fieldsToUpdate.name = updateData.name;
            if (updateData.description !== undefined) fieldsToUpdate.description = updateData.description;
            if (updateData.promptSystem !== undefined) fieldsToUpdate.prompt_system = updateData.promptSystem;
            if (updateData.outputStructure !== undefined) fieldsToUpdate.output_structure = updateData.outputStructure;
            if (updateData.isActive !== undefined) fieldsToUpdate.is_active = updateData.isActive;
            // On ne permet généralement pas de changer le site_id d'un prompt existant, mais pourquoi pas
            if (updateData.siteId !== undefined) fieldsToUpdate.site_id = updateData.siteId;

            const { data, error } = await client
                .from('system_prompts')
                .update(fieldsToUpdate)
                .eq('id', typeof promptId === 'string' ? parseInt(promptId) : promptId)
                .select()
                .single();

            if (error) throw error;

            console.log(`✅ Prompt ${promptId} mis à jour`);

            return this.mapDbPromptToSystemPrompt(data);
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour du prompt:', error);
            throw new Error('Impossible de mettre à jour le prompt');
        }
    }

    /**
     * Supprime un prompt système
     */
    async deleteSystemPrompt(promptId: string | number): Promise<boolean> {
        try {
            const client = initializeSupabase();

            const { error } = await client
                .from('system_prompts')
                .delete()
                .eq('id', typeof promptId === 'string' ? parseInt(promptId) : promptId);

            if (error) throw error;

            console.log(`✅ Prompt ${promptId} supprimé`);
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de la suppression du prompt:', error);
            throw error;
        }
    }

    /**
     * Récupère le prompt actif pour une plateforme spécifique
     */
    async getPromptByPlatform(platform: string): Promise<SystemPrompt | null> {
        try {
            const client = initializeSupabase();

            const { data, error } = await client
                .from('system_prompts')
                .select('*')
                .eq('platform', platform.toLowerCase())
                .eq('is_active', true)
                .limit(1)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log(`⚠️ Aucun prompt trouvé pour la plateforme: ${platform}`);
                    return null;
                }
                throw error;
            }

            console.log(`✅ Prompt récupéré pour ${platform}: ${data.name}`);
            return this.mapDbPromptToSystemPrompt(data);
        } catch (error) {
            console.error(`❌ Erreur lors de la récupération du prompt pour ${platform}:`, error);
            return null;
        }
    }

    /**
     * Convertit un prompt DB vers le format SystemPrompt
     */
    private mapDbPromptToSystemPrompt(prompt: DbSystemPrompt): SystemPrompt {
        return {
            id: prompt.id,
            name: prompt.name,
            description: prompt.description || null,
            promptSystem: prompt.prompt_system,
            outputStructure: prompt.output_structure || null,
            isActive: prompt.is_active,
            siteId: prompt.site_id || null,
            platform: prompt.platform || null,
            createdAt: new Date(prompt.created_at),
            updatedAt: new Date(prompt.updated_at)
        };
    }

    // ============================================
    // UTILITAIRES
    // ============================================

    /**
     * Teste la connexion Supabase
     */
    async testConnection(): Promise<boolean> {
        try {
            const client = initializeSupabase();

            const { error } = await client.from('sites').select('id').limit(1);

            if (error) throw error;

            console.log('✅ Connexion Supabase OK');
            return true;
        } catch (error) {
            console.error('❌ Échec de la connexion Supabase:', error);
            return false;
        }
    }

    // ============= GEO Analysis Methods =============

    /**
     * Sauvegarde l'analyse GEO pour un site
     */
    async saveGeoAnalysis(siteId: number, geoAnalysis: any, geoScore: number): Promise<void> {
        try {
            const client = initializeSupabase();

            const { error } = await client
                .from('sites')
                .update({
                    geo_analysis: geoAnalysis,
                    geo_score: geoScore,
                    updated_at: new Date().toISOString()
                })
                .eq('id', siteId);

            if (error) throw error;

            console.log(`✅ Analyse GEO sauvegardée pour le site ${siteId} (score: ${geoScore})`);
        } catch (error) {
            console.error('❌ Erreur sauvegarde analyse GEO:', error);
            throw error;
        }
    }

    /**
     * Récupère l'analyse GEO pour un site
     */
    async getGeoAnalysis(siteId: number): Promise<{ geoAnalysis: any; geoScore: number } | null> {
        try {
            const client = initializeSupabase();

            const { data, error } = await client
                .from('sites')
                .select('geo_analysis, geo_score')
                .eq('id', siteId)
                .single();

            if (error) throw error;

            if (!data?.geo_analysis) {
                return null;
            }

            return {
                geoAnalysis: data.geo_analysis,
                geoScore: data.geo_score || 0
            };
        } catch (error) {
            console.error('❌ Erreur récupération analyse GEO:', error);
            return null;
        }
    }

    // ============================================
    // SITE-SPECIFIC PROMPTS
    // ============================================

    /**
     * Récupère le prompt pour un site et une plateforme spécifique
     * Fallback sur le prompt global si aucun prompt spécifique n'existe
     */
    async getSitePrompt(siteId: number, platform: string): Promise<SystemPrompt | null> {
        try {
            const client = initializeSupabase();
            const platformLower = platform.toLowerCase();

            // 1. D'abord chercher un prompt spécifique au site
            const { data: sitePrompt, error: siteError } = await client
                .from('site_prompts')
                .select('*')
                .eq('site_id', siteId)
                .eq('platform', platformLower)
                .eq('is_active', true)
                .limit(1)
                .single();

            if (sitePrompt && !siteError) {
                console.log(`✅ Prompt SITE-SPÉCIFIQUE trouvé pour site ${siteId}, plateforme ${platform}`);
                return {
                    id: sitePrompt.id,
                    name: sitePrompt.name || `Prompt ${platform} - Site ${siteId}`,
                    description: `Prompt personnalisé pour ${platform}`,
                    promptSystem: sitePrompt.prompt_system,
                    outputStructure: null,
                    isActive: sitePrompt.is_active,
                    siteId: siteId,
                    platform: platform,
                    createdAt: new Date(sitePrompt.created_at),
                    updatedAt: new Date(sitePrompt.updated_at)
                } as SystemPrompt; // Cast needed because schema mismatch?
            }

            // 2. Fallback sur le prompt global
            console.log(`⚠️ Pas de prompt site-spécifique, fallback sur prompt global pour ${platform}`);
            return await this.getPromptByPlatform(platform);

        } catch (error) {
            console.error('❌ Erreur getSitePrompt:', error);
            // Fallback sur le prompt global en cas d'erreur
            return await this.getPromptByPlatform(platform);
        }
    }

    /**
     * Liste tous les prompts personnalisés d'un site
     */
    async listSitePrompts(siteId: number): Promise<Array<{
        id: number;
        siteId: number;
        platform: string;
        name: string;
        promptSystem: string;
        isActive: boolean;
    }>> {
        try {
            const client = initializeSupabase();

            const { data, error } = await client
                .from('site_prompts')
                .select('*')
                .eq('site_id', siteId)
                .order('platform', { ascending: true });

            if (error) throw error;

            console.log(`✅ ${data?.length || 0} prompts personnalisés pour le site ${siteId}`);

            return (data || []).map((p: any) => ({
                id: p.id,
                siteId: p.site_id,
                platform: p.platform,
                name: p.name || `Prompt ${p.platform}`,
                promptSystem: p.prompt_system,
                isActive: p.is_active
            }));
        } catch (error) {
            console.error('❌ Erreur listSitePrompts:', error);
            return [];
        }
    }

    /**
     * Sauvegarde ou met à jour un prompt spécifique à un site
     */
    async saveSitePrompt(siteId: number, platform: string, promptSystem: string, name?: string): Promise<{
        id: number;
        siteId: number;
        platform: string;
        promptSystem: string;
        name: string;
    }> {
        try {
            const client = initializeSupabase();
            const platformLower = platform.toLowerCase();

            // Upsert - insert or update if exists
            const { data, error } = await client
                .from('site_prompts')
                .upsert({
                    site_id: siteId,
                    platform: platformLower,
                    name: name || `Prompt ${platform}`,
                    prompt_system: promptSystem,
                    is_active: true
                }, {
                    onConflict: 'site_id,platform'
                })
                .select()
                .single();

            if (error) throw error;

            console.log(`✅ Prompt sauvegardé pour site ${siteId}, plateforme ${platform}`);

            return {
                id: data.id,
                siteId: data.site_id,
                platform: data.platform,
                promptSystem: data.prompt_system,
                name: data.name
            };
        } catch (error) {
            console.error('❌ Erreur saveSitePrompt:', error);
            throw error;
        }
    }

    /**
     * Supprime un prompt spécifique à un site (revient au prompt global)
     */
    async deleteSitePrompt(siteId: number, platform: string): Promise<boolean> {
        try {
            const client = initializeSupabase();

            const { error } = await client
                .from('site_prompts')
                .delete()
                .eq('site_id', siteId)
                .eq('platform', platform.toLowerCase());

            if (error) throw error;

            console.log(`✅ Prompt site ${siteId}/${platform} supprimé (fallback global)`);
            return true;
        } catch (error) {
            console.error('❌ Erreur deleteSitePrompt:', error);
            return false;
        }
    }

    /**
     * Récupère tous les prompts pour un site (personnalisés + globaux complétés)
     */
    async getAllPromptsForSite(siteId: number): Promise<Array<{
        id: number;
        platform: string;
        promptSystem: string;
        isCustom: boolean;
        name: string;
        description: string;
        isActive: boolean;
        outputStructure: string;
    }>> {
        try {
            const client = initializeSupabase();

            // Récupérer les prompts personnalisés du site
            const sitePrompts = await this.listSitePrompts(siteId);
            const sitePromptsMap = new Map(sitePrompts.map(p => [p.platform, p]));

            // Récupérer tous les prompts globaux
            const { data: globalPrompts, error } = await client
                .from('system_prompts')
                .select('*')
                .eq('is_active', true)
                .not('platform', 'is', null);

            if (error) throw error;

            // Fusionner : prompts personnalisés prioritaires
            const result: Array<{
                id: number;
                platform: string;
                promptSystem: string;
                isCustom: boolean;
                name: string;
                description: string;
                isActive: boolean;
                outputStructure: string;
            }> = [];

            const seenPlatforms = new Set<string>();

            // D'abord les prompts personnalisés
            for (const sp of sitePrompts) {
                result.push({
                    id: sp.id,
                    platform: sp.platform,
                    promptSystem: sp.promptSystem,
                    isCustom: true,
                    name: sp.name,
                    description: "Prompt personnalisé", // Default description for site prompts
                    isActive: sp.isActive,
                    outputStructure: ""
                });
                if (sp.platform) {
                    seenPlatforms.add(sp.platform.toLowerCase());
                }
            }

            // Ensuite les prompts globaux non couverts
            for (const gp of (globalPrompts || [])) {
                // Créer une clé normalisée pour la vérification
                const platformKey = gp.platform ? gp.platform.toLowerCase() : null;

                if (platformKey && !seenPlatforms.has(platformKey)) {
                    result.push({
                        id: gp.id,
                        platform: gp.platform,
                        promptSystem: gp.prompt_system,
                        isCustom: false,
                        name: gp.name,
                        description: gp.description || '',
                        isActive: gp.is_active,
                        outputStructure: gp.output_structure || ''
                    });
                }
            }

            return result.sort((a, b) => a.platform.localeCompare(b.platform));
        } catch (error) {
            console.error('❌ Erreur getAllPromptsForSite:', error);
            return [];
        }
    }
}

export const supabaseService = new SupabaseService();
