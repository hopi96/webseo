import Airtable from 'airtable';
import type { EditorialContent, InsertEditorialContent } from '@shared/schema';

// Configuration Airtable avec initialisation paresseuse
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
          typeContent: fields.type_contenu || 'twitter',
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
          typeContent: fields.type_contenu || 'twitter',
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
          typeContent: fields.type_contenu || 'twitter',
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
        typeContent: fields.type_contenu || 'twitter',
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
      console.log('🔧 Test connexion Airtable...');
      const { table } = initializeAirtable();
      
      // Teste en récupérant un seul enregistrement
      const records = await table.select({
        maxRecords: 1
      }).all();
      
      console.log('✅ Connexion Airtable réussie, enregistrements trouvés:', records.length);
      if (records.length > 0) {
        console.log('Premier enregistrement:', JSON.stringify(records[0].fields, null, 2));
      }
      return true;
    } catch (error: any) {
      console.error('❌ Erreur de connexion Airtable:', {
        message: error.message,
        error: error.error,
        statusCode: error.statusCode,
        type: error.constructor.name
      });
      return false;
    }
  }
}

export const airtableService = new AirtableService();