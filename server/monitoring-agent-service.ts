/**
 * Agent IA de monitoring: résume l'état des contenus et alertes
 */

import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const DEFAULT_MODEL = process.env.MONITORING_MODEL || 'gpt-4o';

export interface MonitoringSummary {
  resume: string;
  alertes: string[];
  actions: string[];
}

export async function buildMonitoringSummary(payload: any): Promise<MonitoringSummary | null> {
  if (!openai) {
    console.warn('⚠️ Monitoring agent désactivé: OPENAI_API_KEY manquante.');
    return null;
  }

  const prompt = `Tu es un agent IA de monitoring pour une application de gestion de contenus.
Tu dois résumer l'état de la publication et proposer des actions concrètes.
Réponds uniquement avec un JSON valide, en français, sans markdown.

DONNÉES:
${JSON.stringify(payload, null, 2)}

FORMAT JSON ATTENDU:
{
  "resume": "Résumé court et utile",
  "alertes": ["Alerte 1", "Alerte 2"],
  "actions": ["Action 1", "Action 2"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const raw = response.choices[0]?.message?.content || '';
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const summary: MonitoringSummary = {
      resume: typeof parsed.resume === 'string' ? parsed.resume : '',
      alertes: Array.isArray(parsed.alertes) ? parsed.alertes.filter(Boolean) : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions.filter(Boolean) : []
    };

    if (!summary.resume) return null;
    return summary;
  } catch (error) {
    console.warn('⚠️ Monitoring agent error:', error);
    return null;
  }
}
