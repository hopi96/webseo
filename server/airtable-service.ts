import Airtable from 'airtable';
import { EditorialContent, AirtableSite } from '@shared/schema';

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
  // Garder xtwitter tel quel puisque c'est la valeur autorisée en base
  return type || 'xtwitter';
}

/**
 * Extrait l'URL de l'image depuis les champs Airtable
 */
function extractImageData(fields: any): { hasImage: boolean; imageUrl: string | null } {
  const imageData = fields.image;
  
  // D'abord vérifier le champ "image" qui est le champ principal d'Airtable
  if (imageData && Array.isArray(imageData) && imageData.length > 0) {
    return {
      hasImage: true,
      imageUrl: imageData[0].url
    };
  }
  
  // Fallback vers image_url si le champ image n'est pas disponible (rétrocompatibilité)
  if (fields.image_url) {
    return {
      hasImage: true,
      imageUrl: fields.image_url
    };
  }
  
  return {
    hasImage: false,
    imageUrl: null
  };
}

export class AirtableService {
  /**
   * Récupère tous les sites depuis la table analyse SEO d'Airtable avec données d'analyse SEO
   */
  async getAllSites(): Promise<AirtableSite[]> {
    try {
      const { base } = initializeAirtable();
      const analyseSeoTable = base('analyse SEO');
      
      const records = await analyseSeoTable.select({
        fields: ['ID site', 'Nom_site_web', 'URL', 'Analyse_SEO'],
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
          seoAnalysis: seoAnalysis
        };
      }).filter(site => site.id > 0); // Filtrer les sites avec un ID valide
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
          typeContent: normalizeContentType(fields.type_contenu || 'xtwitter'),
          contentText: fields.contenu_text || '',
          hasImage: imageData.hasImage,
          imageUrl: imageData.imageUrl,
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
          typeContent: normalizeContentType(fields.type_contenu || 'xtwitter'),
          contentText: fields.contenu_text || '',
          hasImage: imageData.hasImage,
          imageUrl: imageData.imageUrl,
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
          typeContent: normalizeContentType(fields.type_contenu || 'xtwitter'),
          contentText: fields.contenu_text || '',
          hasImage: imageData.hasImage,
          imageUrl: imageData.imageUrl,
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

      // Gérer l'image : si imageUrl est fournie, créer un attachment Airtable
      if (contentData.imageUrl) {
        // Pour les attachements Airtable, l'URL doit être accessible publiquement
        // Si c'est un chemin local, on utilise l'URL du serveur
        let fullImageUrl = contentData.imageUrl;
        if (contentData.imageUrl.startsWith('/uploads/')) {
          // Construire l'URL complète pour le serveur
          const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
          fullImageUrl = `https://${domain}${contentData.imageUrl}`;
        }
        
        // Pour le champ image d'Airtable (de type attachment), créer un objet d'attachement
        if (contentData.imageUrl.startsWith('http')) {
          // Image générée par IA ou URL externe
          fieldsToCreate.image = [{
            url: contentData.imageUrl,
            filename: `image_${Date.now()}.jpg`
          }];
        } else {
          // Image uploadée localement - créer un attachement avec l'URL complète
          fieldsToCreate.image = [{
            url: fullImageUrl,
            filename: `image_${Date.now()}.${contentData.imageUrl.split('.').pop()}`
          }];
        }
      }

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
      // Gestion des images - ne mettre à jour que si imageUrl est définie
      if (updateData.imageUrl !== undefined) {
        if (updateData.imageUrl) {
          // Si une nouvelle imageUrl est fournie, créer un attachment Airtable
          fieldsToUpdate.image = [{
            url: updateData.imageUrl,
            filename: `image_${Date.now()}.jpg`
          }];
        } else {
          // Supprimer l'image si imageUrl est null ou vide
          fieldsToUpdate.image = null;
        }
      }
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
        typeContent: normalizeContentType(fields.type_contenu || 'xtwitter'),
        contentText: fields.contenu_text || '',
        hasImage: imageData.hasImage,
        imageUrl: imageData.imageUrl,
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
}

export const airtableService = new AirtableService();