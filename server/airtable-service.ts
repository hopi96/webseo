import Airtable from 'airtable';
import type { EditorialContent, InsertEditorialContent } from '@shared/schema';

// Configuration Airtable avec validation
if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
  console.warn('⚠️ Variables d\'environnement Airtable manquantes. Utilisation des données locales.');
}

const airtable = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
});

const base = airtable.base(process.env.AIRTABLE_BASE_ID!);
const table = base('content'); // Nom de votre table

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
      const records = await table.select({
        // Optionnel: filtrer par statut ou date
        // filterByFormula: "NOT({statut} = 'publié')"
      }).all();

      return records.map(record => {
        const fields = record.fields as any; // Utilisation d'any pour éviter les conflits de type Airtable
        
        return {
          id: fields.ID_contenu || 0,
          idSite: fields.ID_SITE || 1,
          typeContent: fields.type_contenu || 'twitter',
          contentText: fields.contenu_text || '',
          hasImage: fields.image || false,
          statut: fields.statut || 'en attente',
          dateDePublication: fields.date_de_publication ? new Date(fields.date_de_publication) : new Date(),
          createdAt: new Date() // Date de synchronisation
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
      const dateStr = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
      
      const records = await table.select({
        filterByFormula: `IS_SAME({date_de_publication}, DATETIME_PARSE("${dateStr}", "YYYY-MM-DD"), "day")`
      }).all();

      return records.map(record => {
        const fields = record.fields as any;
        
        return {
          id: fields.ID_contenu || 0,
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
      console.error('Erreur lors de la récupération par date:', error);
      throw new Error('Impossible de récupérer les contenus pour cette date');
    }
  }

  /**
   * Récupère les contenus pour un site spécifique
   */
  async getContentBySite(siteId: number): Promise<EditorialContent[]> {
    try {
      const records = await table.select({
        filterByFormula: `{ID_SITE} = ${siteId}`
      }).all();

      return records.map(record => {
        const fields = record.fields as any;
        
        return {
          id: fields.ID_contenu || 0,
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
      console.error('Erreur lors de la récupération par site:', error);
      throw new Error('Impossible de récupérer les contenus pour ce site');
    }
  }

  /**
   * Teste la connexion Airtable
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔧 Test connexion Airtable...');
      console.log('API Key présente:', !!process.env.AIRTABLE_API_KEY);
      console.log('Base ID présente:', !!process.env.AIRTABLE_BASE_ID);
      console.log('Longueur API Key:', process.env.AIRTABLE_API_KEY?.length || 0);
      
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