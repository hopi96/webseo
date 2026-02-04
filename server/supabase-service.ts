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
    created_at: string;
    updated_at: string;
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
                seoAnalysis: site.seo_analysis
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
    async getAllSystemPrompts(): Promise<SystemPrompt[]> {
        try {
            const client = initializeSupabase();

            const { data, error } = await client
                .from('system_prompts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            console.log(`✅ ${data?.length || 0} prompts récupérés`);

            return (data || []).map((prompt: DbSystemPrompt) => this.mapDbPromptToSystemPrompt(prompt));
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
    async createSystemPrompt(promptData: InsertSystemPrompt): Promise<SystemPrompt> {
        try {
            const client = initializeSupabase();

            const { data, error } = await client
                .from('system_prompts')
                .insert({
                    name: promptData.nom || 'Nouveau prompt',
                    description: promptData.description || null,
                    prompt_system: promptData.promptSystem,
                    output_structure: promptData.structureSortie || null,
                    is_active: promptData.actif || false
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
    async updateSystemPrompt(promptId: string | number, updateData: Partial<InsertSystemPrompt>): Promise<SystemPrompt> {
        try {
            const client = initializeSupabase();

            const fieldsToUpdate: any = {};

            if (updateData.nom !== undefined) fieldsToUpdate.name = updateData.nom;
            if (updateData.description !== undefined) fieldsToUpdate.description = updateData.description;
            if (updateData.promptSystem !== undefined) fieldsToUpdate.prompt_system = updateData.promptSystem;
            if (updateData.structureSortie !== undefined) fieldsToUpdate.output_structure = updateData.structureSortie;
            if (updateData.actif !== undefined) fieldsToUpdate.is_active = updateData.actif;

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
            id: prompt.id.toString(),
            nom: prompt.name,
            description: prompt.description || undefined,
            promptSystem: prompt.prompt_system,
            structureSortie: prompt.output_structure || undefined,
            actif: prompt.is_active,
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
}

export const supabaseService = new SupabaseService();
