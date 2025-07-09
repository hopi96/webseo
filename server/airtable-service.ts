import Airtable from 'airtable';
import { EditorialContent } from '@shared/schema';

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
  statut?: string;
  date_de_publication?: string;
}

// Fonction utilitaire pour normaliser les types de contenu
function normalizeContentType(type: string): string {
  // Garder xtwitter tel quel puisque c'est la valeur autorisée en base
  return type || 'xtwitter';
}

export class AirtableService {
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
        
        return {
          id: record.id, // Utilisation de l'ID Airtable unique
          airtableId: record.id, // Stockage de l'ID Airtable pour les mises à jour
          idSite: fields.ID_SITE || 1,
          typeContent: normalizeContentType(fields.type_contenu || 'xtwitter'),
          contentText: fields.contenu_text || '',
          hasImage: fields.image || false,
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
        
        return {
          id: record.id, // Utilisation de l'ID Airtable unique
          airtableId: record.id, // Stockage de l'ID Airtable pour les mises à jour
          idSite: fields.ID_SITE || 1,
          typeContent: normalizeContentType(fields.type_contenu || 'xtwitter'),
          contentText: fields.contenu_text || '',
          hasImage: fields.image || false,
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
        filterByFormula: `{ID_SITE} = ${siteId}`
      }).all();

      return records.map((record: any) => {
        const fields = record.fields as any;
        
        return {
          id: record.id, // Utilisation de l'ID Airtable unique
          airtableId: record.id, // Stockage de l'ID Airtable pour les mises à jour
          idSite: fields.ID_SITE || 1,
          typeContent: normalizeContentType(fields.type_contenu || 'xtwitter'),
          contentText: fields.contenu_text || '',
          hasImage: fields.image || false,
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
      
      // Préparer les champs pour Airtable (omission complète d'ID_SITE)
      const fieldsToCreate: Record<string, any> = {
        type_contenu: contentData.typeContent,
        contenu_text: contentData.contentText,
        statut: contentData.statut || 'brouillon',
        image: contentData.hasImage || false
      };

      // ID_SITE complètement omis - peut être auto-généré ou lié à une autre table

      // Formater la date pour Airtable (YYYY-MM-DD)
      if (contentData.dateDePublication) {
        const date = new Date(contentData.dateDePublication);
        fieldsToCreate.date_de_publication = date.toISOString().split('T')[0];
      }

      console.log('Champs à créer dans Airtable:', fieldsToCreate);

      // Créer l'enregistrement
      const record = await table.create(fieldsToCreate);
      
      console.log('✅ Contenu créé dans Airtable avec ID:', record.id);

      // Retourner l'objet EditorialContent
      const createdContent: EditorialContent = {
        id: record.id,
        airtableId: record.id,
        siteId: record.fields.ID_SITE as number || contentData.siteId || 1,
        typeContent: normalizeContentType(record.fields.type_contenu as string),
        contentText: record.fields.contenu_text as string,
        statut: record.fields.statut as string,
        hasImage: record.fields.image as boolean,
        dateDePublication: record.fields.date_de_publication 
          ? new Date(record.fields.date_de_publication as string).toISOString()
          : new Date().toISOString()
      };

      return createdContent;
    } catch (error: any) {
      console.error('❌ Erreur lors de la création du contenu:', {
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Impossible de créer le contenu dans Airtable: ${error.message}`);
    }
  }

  /**
   * Supprime un contenu dans Airtable
   */
  async deleteContent(airtableId: string): Promise<boolean> {
    console.log(`🗑️ Suppression du contenu Airtable ID: ${airtableId}`);
    
    try {
      const { table } = initializeAirtable();
      
      // Supprimer l'enregistrement
      await table.destroy(airtableId);
      
      console.log('✅ Contenu supprimé avec succès de Airtable');
      return true;
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression du contenu:', {
        error: error.message,
        airtableId
      });
      throw new Error(`Impossible de supprimer le contenu: ${error.message}`);
    }
  }

  /**
   * Met à jour un contenu dans Airtable
   */
  async updateContent(airtableId: string, updateData: Partial<EditorialContent>): Promise<EditorialContent> {
    try {
      console.log(`🔄 Mise à jour du contenu Airtable ID: ${airtableId}`);
      console.log('Données à mettre à jour:', updateData);
      
      const { table } = initializeAirtable();
      
      // Préparer les données pour Airtable
      const fieldsToUpdate: any = {};
      
      if (updateData.contentText !== undefined) {
        fieldsToUpdate.contenu_text = updateData.contentText;
      }
      
      if (updateData.statut !== undefined) {
        fieldsToUpdate.statut = updateData.statut;
      }
      
      if (updateData.typeContent !== undefined) {
        // Garder xxtwitter comme valeur pour l'enregistrement en base
        fieldsToUpdate.type_contenu = updateData.typeContent;
      }
      
      if (updateData.hasImage !== undefined) {
        fieldsToUpdate.image = updateData.hasImage;
      }
      
      if (updateData.dateDePublication !== undefined) {
        // Gérer le cas où dateDePublication peut être une chaîne ISO ou un objet Date
        const date = typeof updateData.dateDePublication === 'string' 
          ? new Date(updateData.dateDePublication) 
          : updateData.dateDePublication;
        fieldsToUpdate.date_de_publication = date.toISOString().split('T')[0];
      }
      
      console.log('Champs à mettre à jour dans Airtable:', fieldsToUpdate);
      
      // Mettre à jour l'enregistrement (selon la documentation Airtable 2024)
      const updatedRecord = await table.update(airtableId, fieldsToUpdate);
      
      if (!updatedRecord) {
        throw new Error('Aucun enregistrement mis à jour');
      }
      
      const record = updatedRecord;
      const fields = record.fields as any;
      
      console.log(`✅ Contenu ${airtableId} mis à jour dans Airtable`);
      
      return {
        id: record.id,
        airtableId: record.id,
        idSite: fields.ID_SITE || 1,
        typeContent: normalizeContentType(fields.type_contenu || 'xtwitter'),
        contentText: fields.contenu_text || '',
        hasImage: fields.image || false,
        statut: fields.statut || 'en attente',
        dateDePublication: fields.date_de_publication ? new Date(fields.date_de_publication) : new Date(),
        createdAt: new Date()
      } as EditorialContent;
      
    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour du contenu:', {
        airtableId,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Impossible de mettre à jour le contenu dans Airtable: ${error.message}`);
    }
  }

  /**
   * Teste la connexion Airtable
   */
  async testConnection(): Promise<boolean> {
    try {
      const { table } = initializeAirtable();
      // Teste en récupérant un seul enregistrement
      await table.select({ maxRecords: 1 }).all();
      return true;
    } catch (error) {
      console.error('Erreur de connexion Airtable:', error);
      return false;
    }
  }
}

export const airtableService = new AirtableService();