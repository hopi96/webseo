import Airtable from 'airtable';
import { EditorialContent, AirtableSite, SystemPrompt, InsertSystemPrompt } from '@shared/schema';

let base: any = null;
let table: any = null;

function initializeAirtable() {
  if (!base) {
    const apiKey = process.env.AIRTABLE_API_KEY;
    // Utilisation du bon Base ID directement (temporaire)
    const baseId = 'app9L4iAzg6Nms9Qq';
    
    if (!apiKey) {
      throw new Error('Token API Airtable manquant');
    }
    
    const airtable = new Airtable({ apiKey });
    base = airtable.base(baseId);
    table = base('content');
    
    console.log('✅ Configuration Airtable initialisée avec Base ID:', baseId);
  }
  return { base, table };
}

// Interface pour les données Airtable (plus flexible)
export interface AirtableContentRecord {
  [key: string]: any;
  ID_contenu?: number;
  ID_SITE?: number;
  type_contenu?: string;
  contenu_text?: string;
  image?: boolean;
  image_url?: string;
  statut?: string;
  date_de_publication?: string;
}

// Fonction utilitaire pour normaliser les types de contenu
function normalizeContentType(type: string): string {
  // Garder les types d'Airtable : newsletter, tiktok, instagram, xtwitter, youtube, facebook, linkedin, blog, google my business, pinterest
  const validTypes = ['newsletter', 'tiktok', 'instagram', 'xtwitter', 'youtube', 'facebook', 'linkedin', 'blog', 'google my business', 'pinterest'];
  return validTypes.includes(type) ? type : 'newsletter';
}


/**
 * Extrait l'URL de l'image depuis les champs Airtable avec support des deux champs
 */
function extractImageData(fields: any): { hasImage: boolean; imageUrl: string | null; imageSource: 'upload' | 'ai' | null } {
  const imageData = fields.image;
  const imageUrl = fields.image_url;
  
  // Priorité 1: Champ "image" (uploads locaux) - le plus fiable
  if (imageData && Array.isArray(imageData) && imageData.length > 0 && imageData[0].url) {
    return {
      hasImage: true,
      imageUrl: imageData[0].url,
      imageSource: 'upload'
    };
  }
  
  // Priorité 2: Champ "image_url" (images DALL-E ou URLs externes)
  if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
    return {
      hasImage: true,
      imageUrl: imageUrl.trim(),
      imageSource: 'ai'
    };
  }
  
  // Aucune image disponible
  return {
    hasImage: false,
    imageUrl: null,
    imageSource: null
  };
}

export class AirtableService {
  /**
   * Gère les champs d'image pour la création de contenu
   */
  private async handleImageFieldsForCreation(contentData: any, fieldsToCreate: Record<string, any>): Promise<void> {
    if (!contentData.imageUrl) {
      return; // Pas d'image à traiter
    }

    try {
      const imageUrl = contentData.imageUrl.trim();
      
      // Déterminer le type d'image
      const isDALLEImage = imageUrl.includes('oaidalleapi') || imageUrl.includes('openai.com');
      const isExternalURL = imageUrl.startsWith('http');
      const isLocalUpload = imageUrl.startsWith('/uploads/');
      
      if (isDALLEImage || (isExternalURL && !isLocalUpload)) {
        // Image générée par DALL-E ou URL externe
        console.log('🖼️ Traitement image DALL-E/externe:', imageUrl);
        
        // Remplir les deux champs pour les images DALL-E (redondance sécurisée)
        fieldsToCreate.image_url = imageUrl;
        fieldsToCreate.image = [{
          url: imageUrl,
          filename: `dalle_image_${Date.now()}.png`
        }];
        
      } else if (isLocalUpload) {
        // Image uploadée localement
        console.log('📁 Traitement image uploadée:', imageUrl);
        
        // Construire l'URL complète pour Airtable
        const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
        const fullImageUrl = `https://${domain}${imageUrl}`;
        
        // Priorité au champ image pour les uploads
        fieldsToCreate.image = [{
          url: fullImageUrl,
          filename: `uploaded_${Date.now()}.${imageUrl.split('.').pop()}`
        }];
        
        // image_url reste vide pour les uploads locaux
        
      } else {
        console.warn('⚠️ Type d\'image non reconnu:', imageUrl);
        // Fallback: traiter comme URL externe
        fieldsToCreate.image_url = imageUrl;
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du traitement de l\'image:', error);
      // Ne pas faire échouer la création pour une erreur d'image
    }
  }

  /**
   * Gère les champs d'image pour la mise à jour de contenu
   */
  private async handleImageFieldsForUpdate(updateData: any, fieldsToUpdate: Record<string, any>): Promise<void> {
    // Si hasImage est false, vider les deux champs
    if (updateData.hasImage === false) {
      fieldsToUpdate.image = null;
      fieldsToUpdate.image_url = '';
      return;
    }
    
    if (!updateData.imageUrl) {
      return; // Pas de changement d'image
    }

    try {
      const imageUrl = updateData.imageUrl.trim();
      
      // Même logique que pour la création
      const isDALLEImage = imageUrl.includes('oaidalleapi') || imageUrl.includes('openai.com');
      const isExternalURL = imageUrl.startsWith('http');
      const isLocalUpload = imageUrl.startsWith('/uploads/');
      
      if (isDALLEImage || (isExternalURL && !isLocalUpload)) {
        console.log('🖼️ Mise à jour image DALL-E/externe:', imageUrl);
        
        fieldsToUpdate.image_url = imageUrl;
        fieldsToUpdate.image = [{
          url: imageUrl,
          filename: `dalle_updated_${Date.now()}.png`
        }];
        
      } else if (isLocalUpload) {
        console.log('📁 Mise à jour image uploadée:', imageUrl);
        
        const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
        const fullImageUrl = `https://${domain}${imageUrl}`;
        
        fieldsToUpdate.image = [{
          url: fullImageUrl,
          filename: `uploaded_updated_${Date.now()}.${imageUrl.split('.').pop()}`
        }];
        
        // Vider image_url pour les uploads locaux
        fieldsToUpdate.image_url = '';
        
      } else {
        console.warn('⚠️ Type d\'image non reconnu lors de la mise à jour:', imageUrl);
        fieldsToUpdate.image_url = imageUrl;
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de l\'image:', error);
    }
  }
  /**
   * Met à jour le programme des réseaux sociaux pour un site
   */
  async updateSocialMediaProgram(siteId: number, programData: string): Promise<void> {
    const { base } = initializeAirtable();
    const seoTable = base('analyse SEO');
    
    try {
      // Rechercher le site par ID
      const records = await seoTable.select({
        filterByFormula: `{ID site} = ${siteId}`,
        maxRecords: 1
      }).firstPage();
      
      if (records.length === 0) {
        throw new Error(`Site avec ID ${siteId} non trouvé`);
      }
      
      const record = records[0];
      
      // Mettre à jour le champ programme_rs
      await seoTable.update(record.getId(), {
        programme_rs: programData
      });
      
      console.log(`✅ Programme RS mis à jour pour le site ${siteId}`);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du programme RS:', error);
      throw error;
    }
  }

  /**
   * Récupère le programme des réseaux sociaux pour un site spécifique
   */
  async getSocialMediaProgram(siteId: number): Promise<string | null> {
    try {
      const { base } = initializeAirtable();
      const analyseSeoTable = base('analyse SEO');
      
      const records = await analyseSeoTable.select({
        filterByFormula: `{ID site} = ${siteId}`,
        fields: ['programme_rs'],
        maxRecords: 1
      }).firstPage();
      
      if (records.length === 0) {
        throw new Error(`Site avec ID ${siteId} non trouvé`);
      }
      
      const programmeRs = records[0].fields['programme_rs'] as string | undefined;
      console.log(`✅ Programme RS récupéré pour le site ${siteId}:`, programmeRs ? 'Configuré' : 'Non configuré');
      
      return programmeRs || null;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du programme RS:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les sites depuis la table analyse SEO d'Airtable avec données d'analyse SEO
   */
  async getAllSites(): Promise<AirtableSite[]> {
    try {
      const { base } = initializeAirtable();
      const analyseSeoTable = base('analyse SEO');
      
      const records = await analyseSeoTable.select({
        fields: ['ID site', 'Nom_site_web', 'URL', 'Analyse_SEO', 'programme_rs'],
        sort: [{ field: 'ID site', direction: 'desc' }] // Trier par ID décroissant (plus récents en premier)
      }).all();

      console.log(`✅ ${records.length} sites récupérés depuis la table analyse SEO`);
      
      return records.map((record: any) => {
        const fields = record.fields as any;
        
        // Parser le JSON d'analyse SEO si disponible
        let seoAnalysis = null;
        if (fields['Analyse_SEO']) {
          try {
            seoAnalysis = JSON.parse(fields['Analyse_SEO']);
          } catch (error) {
            console.warn(`Erreur lors du parsing JSON pour le site ${fields['ID site']}:`, error);
          }
        }
        
        // Nettoyer le nom du site en enlevant "Analyse SEO - " et "Analyse SEO pour "
        let cleanName = fields['Nom_site_web'] || 'Site sans nom';
        cleanName = cleanName.replace(/^Analyse SEO - /, '');
        cleanName = cleanName.replace(/^Analyse SEO pour /, '');
        
        return {
          id: parseInt(fields['ID site']) || 0,
          name: cleanName,
          url: fields['URL'] || '',
          programmeRs: fields['programme_rs'] || null,
          seoAnalysis: seoAnalysis
        };
      }).filter((site: any) => site.id > 0); // Filtrer les sites avec un ID valide
    } catch (error) {
      console.error('Erreur lors de la récupération des sites depuis la table analyse SEO:', error);
      throw new Error('Impossible de récupérer les sites depuis la table analyse SEO');
    }
  }

  /**
   * Récupère tous les contenus éditoriaux depuis Airtable
   */
  async getAllContent(): Promise<EditorialContent[]> {
    try {
      const { table } = initializeAirtable();
      const records = await table.select({
        // Optionnel: filtrer par statut ou date  
        // filterByFormula: "NOT({statut} = 'publié')"
      }).all();

      console.log(`✅ ${records.length} contenus récupérés depuis Airtable`);

      return records.map((record: any) => {
        const fields = record.fields as any;
        const imageData = extractImageData(fields);
        
        return {
          id: record.id, // Utilisation de l'ID Airtable unique
          airtableId: record.id, // Stockage de l'ID Airtable pour les mises à jour
          idSite: parseInt(fields.ID_SITE) || 1,
          typeContent: normalizeContentType(fields.type_contenu || 'newsletter'),
          contentText: fields.contenu_text || '',
          hasImage: imageData.hasImage,
          imageUrl: imageData.imageUrl,
          imageSource: imageData.imageSource,
          statut: fields.statut || 'en attente',
          dateDePublication: fields.date_de_publication ? new Date(fields.date_de_publication) : new Date(),
          createdAt: new Date()
        } as EditorialContent;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des contenus Airtable:', error);
      throw new Error('Impossible de récupérer les contenus depuis Airtable');
    }
  }

  /**
   * Récupère les contenus pour une date spécifique
   */
  async getContentByDate(date: Date): Promise<EditorialContent[]> {
    try {
      const { table } = initializeAirtable();
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const records = await table.select({
        filterByFormula: `AND(
          IS_AFTER({date_de_publication}, '${startOfDay.toISOString().split('T')[0]}'),
          IS_BEFORE({date_de_publication}, '${endOfDay.toISOString().split('T')[0]}')
        )`
      }).all();

      return records.map((record: any) => {
        const fields = record.fields as any;
        const imageData = extractImageData(fields);
        
        return {
          id: record.id, // Utilisation de l'ID Airtable unique
          airtableId: record.id, // Stockage de l'ID Airtable pour les mises à jour
          idSite: parseInt(fields.ID_SITE) || 1,
          typeContent: normalizeContentType(fields.type_contenu || 'newsletter'),
          contentText: fields.contenu_text || '',
          hasImage: imageData.hasImage,
          imageUrl: imageData.imageUrl,
          imageSource: imageData.imageSource,
          statut: fields.statut || 'en attente',
          dateDePublication: fields.date_de_publication ? new Date(fields.date_de_publication) : new Date(),
          createdAt: new Date()
        } as EditorialContent;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des contenus par date:', error);
      throw new Error('Impossible de récupérer les contenus pour cette date');
    }
  }

  /**
   * Récupère les contenus pour un site spécifique
   */
  async getContentBySite(siteId: number): Promise<EditorialContent[]> {
    try {
      const { table } = initializeAirtable();
      const records = await table.select({
        filterByFormula: `{ID_SITE} = "${siteId}"`
      }).all();

      return records.map((record: any) => {
        const fields = record.fields as any;
        const imageData = extractImageData(fields);
        
        return {
          id: record.id, // Utilisation de l'ID Airtable unique
          airtableId: record.id, // Stockage de l'ID Airtable pour les mises à jour
          idSite: parseInt(fields.ID_SITE) || 1,
          typeContent: normalizeContentType(fields.type_contenu || 'newsletter'),
          contentText: fields.contenu_text || '',
          hasImage: imageData.hasImage,
          imageUrl: imageData.imageUrl,
          imageSource: imageData.imageSource,
          statut: fields.statut || 'en attente',
          dateDePublication: fields.date_de_publication ? new Date(fields.date_de_publication) : new Date(),
          createdAt: new Date()
        } as EditorialContent;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des contenus par site:', error);
      throw new Error('Impossible de récupérer les contenus pour ce site');
    }
  }

  /**
   * Crée un nouveau contenu dans Airtable
   */
  async createContent(contentData: Omit<EditorialContent, 'id' | 'airtableId'>): Promise<EditorialContent> {
    console.log('🔄 Création d\'un nouveau contenu dans Airtable');
    console.log('Données à créer:', contentData);

    try {
      const { table } = initializeAirtable();
      
      // Préparer les champs pour Airtable avec ID_SITE
      const fieldsToCreate: Record<string, any> = {
        type_contenu: contentData.typeContent,
        contenu_text: contentData.contentText,
        statut: contentData.statut || 'en attente',
        ID_SITE: (contentData.idSite || 1).toString()  // Convertir en string pour Airtable
      };

      // Gestion avancée des images avec support des deux champs
      await this.handleImageFieldsForCreation(contentData, fieldsToCreate);

      // Formater la date pour Airtable (YYYY-MM-DD)
      if (contentData.dateDePublication) {
        const date = typeof contentData.dateDePublication === 'string' 
          ? new Date(contentData.dateDePublication)
          : contentData.dateDePublication;
        fieldsToCreate.date_de_publication = date.toISOString().split('T')[0];
      }

      console.log('Champs à créer dans Airtable:', fieldsToCreate);

      const record = await table.create(fieldsToCreate);
      console.log('✅ Contenu créé dans Airtable avec ID:', record.id);

      // Retourner le contenu créé avec l'ID Airtable
      const createdContent: EditorialContent = {
        id: record.id,
        airtableId: record.id,
        idSite: contentData.idSite || 1,
        typeContent: contentData.typeContent,
        contentText: contentData.contentText,
        hasImage: contentData.hasImage || false,
        imageUrl: contentData.imageUrl || null,
        imageSource: contentData.imageSource || null,
        statut: contentData.statut || 'en attente',
        dateDePublication: contentData.dateDePublication || new Date(),
        createdAt: new Date()
      };

      return createdContent;
    } catch (error) {
      console.error('Erreur lors de la création du contenu dans Airtable:', error);
      throw new Error('Impossible de créer le contenu dans Airtable');
    }
  }

  /**
   * Supprime un contenu dans Airtable
   */
  async deleteContent(airtableId: string): Promise<boolean> {
    console.log('🔄 Suppression du contenu dans Airtable avec ID:', airtableId);

    try {
      const { table } = initializeAirtable();
      await table.destroy(airtableId);
      console.log('✅ Contenu supprimé dans Airtable');
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du contenu dans Airtable:', error);
      throw new Error('Impossible de supprimer le contenu dans Airtable');
    }
  }

  /**
   * Met à jour un contenu dans Airtable
   */
  async updateContent(airtableId: string, updateData: Partial<EditorialContent>): Promise<EditorialContent> {
    console.log('🔄 Mise à jour du contenu dans Airtable avec ID:', airtableId);
    console.log('Données à mettre à jour:', updateData);

    try {
      const { table } = initializeAirtable();
      
      // Préparer les champs pour Airtable
      const fieldsToUpdate: Record<string, any> = {};
      
      if (updateData.typeContent) {
        fieldsToUpdate.type_contenu = updateData.typeContent;
      }
      if (updateData.contentText) {
        fieldsToUpdate.contenu_text = updateData.contentText;
      }
      if (updateData.statut) {
        fieldsToUpdate.statut = updateData.statut;
      }
      // Gestion avancée des images avec support des deux champs
      await this.handleImageFieldsForUpdate(updateData, fieldsToUpdate);
      if (updateData.idSite) {
        fieldsToUpdate.ID_SITE = updateData.idSite.toString();
      }
      if (updateData.dateDePublication) {
        // Convertir en Date si c'est une chaîne
        const date = typeof updateData.dateDePublication === 'string' 
          ? new Date(updateData.dateDePublication)
          : updateData.dateDePublication;
        fieldsToUpdate.date_de_publication = date.toISOString().split('T')[0];
      }

      console.log('Champs à mettre à jour dans Airtable:', fieldsToUpdate);

      const record = await table.update(airtableId, fieldsToUpdate);
      console.log('✅ Contenu mis à jour dans Airtable');

      // Retourner le contenu mis à jour
      const fields = record.fields as any;
        const imageData = extractImageData(fields);
      
      return {
        id: record.id,
        airtableId: record.id,
        idSite: parseInt(fields.ID_SITE) || 1,
        typeContent: normalizeContentType(fields.type_contenu || 'newsletter'),
        contentText: fields.contenu_text || '',
        hasImage: imageData.hasImage,
        imageUrl: imageData.imageUrl,
        imageSource: imageData.imageSource,
        statut: fields.statut || 'en attente',
        dateDePublication: fields.date_de_publication ? new Date(fields.date_de_publication) : new Date(),
        createdAt: new Date()
      } as EditorialContent;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du contenu dans Airtable:', error);
      throw new Error('Impossible de mettre à jour le contenu dans Airtable');
    }
  }

  /**
   * Supprime un site de la table analyse SEO
   */
  async deleteSite(siteId: number): Promise<boolean> {
    try {
      const { base } = initializeAirtable();
      const analyseSeoTable = base('analyse SEO');
      
      // Trouver le record à supprimer
      const records = await analyseSeoTable.select({
        filterByFormula: `{ID site} = "${siteId}"`
      }).all();
      
      if (records.length === 0) {
        throw new Error(`Site avec ID ${siteId} non trouvé`);
      }
      
      // Supprimer le record
      await analyseSeoTable.destroy(records[0].id);
      console.log(`✅ Site ${siteId} supprimé de la table analyse SEO`);
      return true;
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression du site ${siteId}:`, error);
      throw new Error(`Impossible de supprimer le site ${siteId}`);
    }
  }

  /**
   * Met à jour les paramètres des réseaux sociaux pour un site
   */
  async updateSocialParams(siteId: number, socialParams: any): Promise<void> {
    try {
      const { base } = initializeAirtable();
      const analyseSeoTable = base('analyse SEO');
      
      console.log('🔄 Mise à jour des paramètres réseaux sociaux pour le site', siteId);
      console.log('Paramètres à sauvegarder:', socialParams);
      
      // Trouver le record du site
      const records = await analyseSeoTable.select({
        filterByFormula: `{ID site} = "${siteId}"`
      }).all();
      
      if (records.length === 0) {
        throw new Error(`Site avec ID ${siteId} non trouvé`);
      }
      
      // Utiliser directement la nouvelle structure JSON
      // Les paramètres arrivent déjà dans le bon format depuis le frontend
      const formattedParams = socialParams;
      
      // Mettre à jour le champ parametre_rs
      await analyseSeoTable.update(records[0].id, {
        'parametre_rs': JSON.stringify(formattedParams)
      });
      
      console.log('✅ Paramètres réseaux sociaux mis à jour pour le site', siteId);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des paramètres réseaux sociaux:', error);
      throw new Error('Impossible de mettre à jour les paramètres des réseaux sociaux');
    }
  }

  /**
   * Récupère les paramètres des réseaux sociaux pour un site
   */
  async getSocialParams(siteId: number): Promise<any> {
    try {
      const { base } = initializeAirtable();
      const analyseSeoTable = base('analyse SEO');
      
      console.log('🔍 Récupération des paramètres réseaux sociaux pour le site', siteId);
      
      // Trouver le record du site
      const records = await analyseSeoTable.select({
        filterByFormula: `{ID site} = "${siteId}"`
      }).all();
      
      if (records.length === 0) {
        throw new Error(`Site avec ID ${siteId} non trouvé`);
      }
      
      const parametreRs = records[0].fields['parametre_rs'];
      
      if (!parametreRs) {
        // Retourner la structure par défaut vide
        return {};
      }
      
      try {
        const parsed = JSON.parse(parametreRs as string);
        console.log('✅ Paramètres récupérés pour le site', siteId);
        return parsed;
      } catch (parseError) {
        console.error('❌ Erreur lors du parsing des paramètres JSON:', parseError);
        // Retourner une structure vide en cas d'erreur de parsing
        return {};
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des paramètres réseaux sociaux:', error);
      throw new Error('Impossible de récupérer les paramètres des réseaux sociaux');
    }
  }

  /**
   * Teste la connexion Airtable
   */
  async testConnection(): Promise<boolean> {
    try {
      const { table } = initializeAirtable();
      // Tester en récupérant un enregistrement
      await table.select({ maxRecords: 1 }).firstPage();
      console.log('✅ Connexion Airtable OK');
      return true;
    } catch (error) {
      console.error('❌ Échec de la connexion Airtable:', error);
      return false;
    }
  }
  /**
   * Met à jour le statut de plusieurs contenus en lot
   */
  async bulkUpdateStatus(airtableIds: string[], statut: string): Promise<EditorialContent[]> {
    console.log(`🔄 Mise à jour en lot de ${airtableIds.length} contenus avec statut: ${statut}`);
    console.log('IDs à mettre à jour:', airtableIds);

    try {
      const { table } = initializeAirtable();
      
      // Validation du statut
      const validStatuses = ['en attente', 'à réviser', 'validé'];
      if (!validStatuses.includes(statut)) {
        throw new Error(`Statut invalide: ${statut}. Statuts valides: ${validStatuses.join(', ')}`);
      }

      // Traitement en parallèle avec limitation pour éviter les erreurs de rate limiting
      const updateResults: Array<{success: boolean, airtableId: string, content?: EditorialContent, error?: string}> = [];
      
      const updatePromises = airtableIds.map(async (airtableId) => {
        try {
          const fieldsToUpdate = { statut };
          console.log(`Mise à jour du contenu ${airtableId} avec statut: ${statut}`);
          console.log(`Tentative de mise à jour avec champs:`, fieldsToUpdate);
          
          // Vérifier que l'enregistrement existe avant la mise à jour
          let existingRecord;
          try {
            existingRecord = await table.find(airtableId);
            console.log(`✅ Record trouvé: ${airtableId}`, existingRecord.fields);
          } catch (findError: any) {
            console.error(`❌ Record non trouvé: ${airtableId}`, findError);
            return {
              success: false,
              airtableId,
              error: `Record ${airtableId} introuvable - il a peut-être été supprimé ou archivé`
            };
          }
          
          const record = await table.update(airtableId, fieldsToUpdate);
          const fields = record.fields as any;
          const imageData = extractImageData(fields);
          
          const content = {
            id: record.id,
            airtableId: record.id,
            idSite: parseInt(fields.ID_SITE) || 1,
            typeContent: normalizeContentType(fields.type_contenu || 'newsletter'),
            contentText: fields.contenu_text || '',
            hasImage: imageData.hasImage,
            imageUrl: imageData.imageUrl,
            imageSource: imageData.imageSource,
            statut: fields.statut || 'en attente',
            dateDePublication: fields.date_de_publication ? new Date(fields.date_de_publication) : new Date(),
            createdAt: new Date()
          } as EditorialContent;
          
          return {
            success: true,
            airtableId,
            content
          };
        } catch (error: any) {
          console.error(`Erreur lors de la mise à jour du contenu ${airtableId}:`, error);
          return {
            success: false,
            airtableId,
            error: error.message || 'Erreur lors de la mise à jour'
          };
        }
      });

      // Attendre toutes les mises à jour
      const results = await Promise.all(updatePromises);
      
      // Séparer les succès et les échecs
      const successfulUpdates = results.filter(result => result.success);
      const failedUpdates = results.filter(result => !result.success);
      
      console.log(`✅ ${successfulUpdates.length}/${airtableIds.length} contenus mis à jour avec succès`);
      
      if (failedUpdates.length > 0) {
        console.warn(`⚠️ ${failedUpdates.length} mises à jour ont échoué:`);
        failedUpdates.forEach(failure => {
          console.warn(`  - ${failure.airtableId}: ${failure.error}`);
        });
      }

      // Retourner seulement les contenus mis à jour avec succès
      return successfulUpdates.map(result => result.content!).filter(Boolean);
    } catch (error) {
      console.error('Erreur critique lors de la mise à jour en lot:', error);
      console.error('Type d\'erreur:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('Message d\'erreur:', error instanceof Error ? error.message : String(error));
      
      // Au lieu de lancer une exception fatale, retourner un tableau vide
      // et laisser la route gérer le cas où aucune mise à jour n'a réussi
      console.warn('❌ Aucune mise à jour n\'a pu être effectuée à cause d\'une erreur critique');
      return [];
    }
  }

  /**
   * GESTION DES PROMPTS SYSTÈME
   */

  /**
   * Récupère tous les prompts système depuis la table "Gestion prompt"
   */
  async getAllSystemPrompts(): Promise<SystemPrompt[]> {
    try {
      const { base } = initializeAirtable();
      const promptsTable = base('Gestion prompt');
      
      // Récupération sans tri pour éviter les erreurs de champs inconnus
      const records = await promptsTable.select().all();

      console.log(`✅ ${records.length} prompts système récupérés depuis Airtable`);

      return records.map((record: any) => {
        const fields = record.fields as any;
        
        return {
          id: record.id,
          promptSystem: fields['Prompt system'] || fields['prompt_system'] || '',
          structureSortie: fields['structure_sortie'] || '',
          nom: fields['Name'] || fields['nom'] || fields['name'] || '',
          description: fields['Description'] || fields['description'] || '',
          actif: fields['Active'] || fields['actif'] || fields['active'] || false,
          createdAt: new Date(), // Valeur par défaut
          updatedAt: new Date()  // Valeur par défaut
        } as SystemPrompt;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des prompts système:', error);
      throw new Error('Impossible de récupérer les prompts système depuis Airtable');
    }
  }

  /**
   * Récupère le prompt système actif (utilisé par défaut)
   */
  async getActiveSystemPrompt(): Promise<SystemPrompt | null> {
    try {
      const { base } = initializeAirtable();
      const promptsTable = base('Gestion prompt');
      
      const records = await promptsTable.select({
        filterByFormula: '{actif} = TRUE()',
        maxRecords: 1
      }).firstPage();

      if (records.length === 0) {
        console.log('⚠️ Aucun prompt système actif trouvé');
        return null;
      }

      const record = records[0];
      const fields = record.fields as any;
      
      console.log('✅ Prompt système actif récupéré:', fields['Name'] || fields['nom'] || fields['name'] || 'Sans nom');
      
      return {
        id: record.id,
        promptSystem: fields['Prompt system'] || fields['prompt_system'] || '',
        structureSortie: fields['structure_sortie'] || '',
        nom: fields['Name'] || fields['nom'] || fields['name'] || '',
        description: fields['Description'] || fields['description'] || '',
        actif: fields['Active'] || fields['actif'] || fields['active'] || false,
        createdAt: new Date(), // Valeur par défaut
        updatedAt: new Date()  // Valeur par défaut
      } as SystemPrompt;
    } catch (error) {
      console.error('Erreur lors de la récupération du prompt système actif:', error);
      return null;
    }
  }

  /**
   * Met à jour un prompt système
   */
  async updateSystemPrompt(id: string, updateData: Partial<InsertSystemPrompt>): Promise<SystemPrompt> {
    try {
      const { base } = initializeAirtable();
      const promptsTable = base('Gestion prompt');
      
      const fieldsToUpdate: any = {};
      
      if (updateData.promptSystem !== undefined) {
        fieldsToUpdate['Prompt system'] = updateData.promptSystem;
      }
      if (updateData.structureSortie !== undefined) {
        fieldsToUpdate['structure_sortie'] = updateData.structureSortie;
      }

      console.log('🔄 Mise à jour du prompt système:', id);
      console.log('Champs à mettre à jour:', fieldsToUpdate);

      const updatedRecord = await promptsTable.update(id, fieldsToUpdate);
      const fields = updatedRecord.fields as any;

      console.log('✅ Prompt système mis à jour avec succès');

      return {
        id: updatedRecord.id,
        promptSystem: fields['Prompt system'] || '',
        structureSortie: fields['structure_sortie'] || '',
        nom: fields['nom'] || '',
        description: fields['description'] || '',
        actif: fields['actif'] || false,
        createdAt: fields['Created time'] ? new Date(fields['Created time']) : undefined,
        updatedAt: fields['Last modified time'] ? new Date(fields['Last modified time']) : undefined
      } as SystemPrompt;
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du prompt système:', error);
      throw new Error('Impossible de mettre à jour le prompt système');
    }
  }

  /**
   * Crée un nouveau prompt système
   */
  async createSystemPrompt(promptData: InsertSystemPrompt): Promise<SystemPrompt> {
    try {
      const { base } = initializeAirtable();
      const promptsTable = base('Gestion prompt');
      
      const fieldsToCreate: any = {
        'Prompt system': promptData.promptSystem,
        'structure_sortie': promptData.structureSortie || '',
        'Name': promptData.nom || '', // Essayer 'Name' au lieu de 'nom'
        'Description': promptData.description || '',
        'Active': promptData.actif || false // Essayer 'Active' au lieu de 'actif'
      };

      console.log('🆕 Création d\'un nouveau prompt système');
      console.log('Données:', fieldsToCreate);

      const createdRecord = await promptsTable.create(fieldsToCreate);
      const fields = createdRecord.fields as any;

      console.log('✅ Prompt système créé avec succès');

      return {
        id: createdRecord.id,
        promptSystem: fields['Prompt system'] || '',
        structureSortie: fields['structure_sortie'] || '',
        nom: fields['nom'] || '',
        description: fields['description'] || '',
        actif: fields['actif'] || false,
        createdAt: fields['Created time'] ? new Date(fields['Created time']) : undefined,
        updatedAt: fields['Last modified time'] ? new Date(fields['Last modified time']) : undefined
      } as SystemPrompt;
    } catch (error) {
      console.error('❌ Erreur lors de la création du prompt système:', error);
      throw new Error('Impossible de créer le prompt système');
    }
  }

  /**
   * Supprime un prompt système
   */
  async deleteSystemPrompt(id: string): Promise<boolean> {
    try {
      const { base } = initializeAirtable();
      const promptsTable = base('Gestion prompt');
      
      console.log('🗑️ Suppression du prompt système:', id);
      
      await promptsTable.destroy(id);
      
      console.log('✅ Prompt système supprimé avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du prompt système:', error);
      throw new Error('Impossible de supprimer le prompt système');
    }
  }
}

export const airtableService = new AirtableService();
