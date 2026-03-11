/**
 * Service de publication automatique sur les réseaux sociaux
 * Cherche les contenus du jour et publie selon les paramètres stockés en base
 */

import type { EditorialContent } from '@shared/schema';
import { supabaseService } from './supabase-service';
import { TwitterApi } from 'twitter-api-v2';

type PublishResult = {
    contentId: number | string;
    platform: string;
    success: boolean;
    message: string;
    externalId?: string;
};

type SocialParams = Record<string, any>;

const DEFAULT_INTERVAL_MS = Number(process.env.PUBLISHER_INTERVAL_MS || 5 * 60 * 1000);
const DEFAULT_STATUSES = (process.env.PUBLISHER_STATUSES || 'validé')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

const PUBLISHER_ENABLED = process.env.PUBLISHER_ENABLED !== 'false';
const PUBLISHER_DRY_RUN = process.env.PUBLISHER_DRY_RUN === 'true';

const FB_GRAPH_VERSION = process.env.FB_GRAPH_VERSION || 'v19.0';

export class SocialPublisherService {
    private intervalId?: NodeJS.Timeout;
    private isRunning = false;
    private inFlight = new Set<number>();

    start() {
        if (!PUBLISHER_ENABLED) {
            console.log('⏸️ SocialPublisher désactivé (PUBLISHER_ENABLED=false)');
            return;
        }

        if (this.intervalId) return;

        console.log(`🕒 SocialPublisher démarré (intervalle ${DEFAULT_INTERVAL_MS}ms)`);

        // run once shortly after startup
        setTimeout(() => {
            this.runOnce().catch(err => console.error('❌ SocialPublisher runOnce error:', err));
        }, 2000);

        this.intervalId = setInterval(() => {
            this.runOnce().catch(err => console.error('❌ SocialPublisher runOnce error:', err));
        }, DEFAULT_INTERVAL_MS);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }

    async runOnce(): Promise<{ published: number; failed: number; results: PublishResult[] }> {
        if (this.isRunning) {
            return { published: 0, failed: 0, results: [] };
        }

        this.isRunning = true;
        try {
            const now = new Date();
            const start = new Date(now);
            start.setHours(0, 0, 0, 0);
            const end = new Date(now);
            end.setHours(23, 59, 59, 999);

            const contents = await supabaseService.getContentForPublishing({
                start,
                end,
                statuses: DEFAULT_STATUSES,
                limit: 200
            });

            if (contents.length === 0) {
                return { published: 0, failed: 0, results: [] };
            }

            const results: PublishResult[] = [];
            let published = 0;
            let failed = 0;

            for (const content of contents) {
                if (content.dateDePublication > now) {
                    continue;
                }
                if (this.inFlight.has(content.id)) {
                    continue;
                }

                this.inFlight.add(content.id);
                try {
                    const result = await this.publishContent(content);
                    results.push(result);

                    if (!PUBLISHER_DRY_RUN) {
                        await supabaseService.createPublicationLog({
                            contentId: typeof content.id === 'string' ? parseInt(content.id) : content.id,
                            siteId: content.idSite,
                            platform: result.platform,
                            status: result.success ? 'success' : 'failed',
                            message: result.message,
                            externalId: result.externalId,
                            publicationDate: content.dateDePublication,
                            contentExcerpt: (content.contentText || '').slice(0, 140)
                        });
                    }

                    if (result.success) {
                        published += 1;
                        if (!PUBLISHER_DRY_RUN) {
                            await supabaseService.updateContent(content.id, {
                                statut: 'publié'
                            });
                        }
                    } else {
                        failed += 1;
                    }
                } finally {
                    this.inFlight.delete(content.id);
                }
            }

            return { published, failed, results };
        } finally {
            this.isRunning = false;
        }
    }

    private async publishContent(content: EditorialContent): Promise<PublishResult> {
        const platform = content.typeContent;
        const socialParams = await supabaseService.getSocialParams(content.idSite).catch(() => ({} as SocialParams));

        if (!socialParams || typeof socialParams !== 'object') {
            return {
                contentId: content.id,
                platform,
                success: false,
                message: 'Paramètres réseaux sociaux manquants'
            };
        }

        if (PUBLISHER_DRY_RUN) {
            return {
                contentId: content.id,
                platform,
                success: true,
                message: 'Dry run - publication simulée'
            };
        }

        switch (platform) {
            case 'facebook':
                return this.publishFacebook(content, socialParams.facebook);
            case 'instagram':
                return this.publishInstagram(content, socialParams.instagram);
            case 'pinterest':
                return this.publishPinterest(content, socialParams.pinterest);
            case 'xtwitter':
                return this.publishX(content, socialParams.xtwitter);
            case 'google my business':
                return this.publishGmb(content, socialParams.google_my_business);
            case 'linkedin':
                return this.publishLinkedIn(content, socialParams.linkedin);
            case 'tiktok':
                return this.publishTikTok(content, socialParams.tiktok);
            case 'blog':
                return this.publishWordPress(content, socialParams.wordpress_blog);
            case 'newsletter':
                return {
                    contentId: content.id,
                    platform: 'newsletter',
                    success: false,
                    message: 'Publication Newsletter Brevo non implémentée'
                };
            case 'youtube':
                return {
                    contentId: content.id,
                    platform: 'youtube',
                    success: false,
                    message: 'Publication YouTube non implémentée'
                };
            default:
                return {
                    contentId: content.id,
                    platform,
                    success: false,
                    message: `Plateforme non supportée: ${platform}`
                };
        }
    }

    private getPublicImageUrl(imageUrl?: string | null): string | null {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
        }
        if (imageUrl.startsWith('/uploads')) {
            const baseUrl = process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL;
            if (!baseUrl) return null;
            return `${baseUrl}${imageUrl}`;
        }
        return null;
    }

    private async publishFacebook(content: EditorialContent, config?: { page_id?: string; access_token?: string }): Promise<PublishResult> {
        if (!config?.page_id || !config?.access_token) {
            return {
                contentId: content.id,
                platform: 'facebook',
                success: false,
                message: 'Config Facebook manquante (page_id/access_token)'
            };
        }

        const imageUrl = this.getPublicImageUrl(content.imageUrl || undefined);
        const endpointBase = `https://graph.facebook.com/${FB_GRAPH_VERSION}/${config.page_id}`;

        try {
            let response: Response;
            if (imageUrl) {
                const body = new URLSearchParams({
                    url: imageUrl,
                    caption: content.contentText,
                    access_token: config.access_token
                });
                response = await fetch(`${endpointBase}/photos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body
                });
            } else {
                const body = new URLSearchParams({
                    message: content.contentText,
                    access_token: config.access_token
                });
                response = await fetch(`${endpointBase}/feed`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body
                });
            }

            const data = await response.json();
            if (!response.ok) {
                return {
                    contentId: content.id,
                    platform: 'facebook',
                    success: false,
                    message: data?.error?.message || 'Erreur Facebook'
                };
            }

            return {
                contentId: content.id,
                platform: 'facebook',
                success: true,
                message: 'Publié sur Facebook',
                externalId: data?.id
            };
        } catch (error: any) {
            return {
                contentId: content.id,
                platform: 'facebook',
                success: false,
                message: error?.message || 'Erreur Facebook'
            };
        }
    }

    private async publishInstagram(content: EditorialContent, config?: { user_id?: string; access_token?: string }): Promise<PublishResult> {
        if (!config?.user_id || !config?.access_token) {
            return {
                contentId: content.id,
                platform: 'instagram',
                success: false,
                message: 'Config Instagram manquante (user_id/access_token)'
            };
        }

        const imageUrl = this.getPublicImageUrl(content.imageUrl || undefined);
        if (!imageUrl) {
            return {
                contentId: content.id,
                platform: 'instagram',
                success: false,
                message: 'Instagram nécessite une image (imageUrl manquante)'
            };
        }

        try {
            const createBody = new URLSearchParams({
                image_url: imageUrl,
                caption: content.contentText,
                access_token: config.access_token
            });
            const createResponse = await fetch(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${config.user_id}/media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: createBody
            });
            const createData = await createResponse.json();
            if (!createResponse.ok || !createData?.id) {
                return {
                    contentId: content.id,
                    platform: 'instagram',
                    success: false,
                    message: createData?.error?.message || 'Erreur création média Instagram'
                };
            }

            const publishBody = new URLSearchParams({
                creation_id: createData.id,
                access_token: config.access_token
            });
            const publishResponse = await fetch(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${config.user_id}/media_publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: publishBody
            });
            const publishData = await publishResponse.json();
            if (!publishResponse.ok) {
                return {
                    contentId: content.id,
                    platform: 'instagram',
                    success: false,
                    message: publishData?.error?.message || 'Erreur publication Instagram'
                };
            }

            return {
                contentId: content.id,
                platform: 'instagram',
                success: true,
                message: 'Publié sur Instagram',
                externalId: publishData?.id
            };
        } catch (error: any) {
            return {
                contentId: content.id,
                platform: 'instagram',
                success: false,
                message: error?.message || 'Erreur Instagram'
            };
        }
    }

    private async publishPinterest(content: EditorialContent, config?: { board_id?: string; access_token?: string }): Promise<PublishResult> {
        if (!config?.board_id || !config?.access_token) {
            return {
                contentId: content.id,
                platform: 'pinterest',
                success: false,
                message: 'Config Pinterest manquante (board_id/access_token)'
            };
        }

        const imageUrl = this.getPublicImageUrl(content.imageUrl || undefined);
        if (!imageUrl) {
            return {
                contentId: content.id,
                platform: 'pinterest',
                success: false,
                message: 'Pinterest nécessite une image (imageUrl manquante)'
            };
        }

        try {
            const response = await fetch('https://api.pinterest.com/v5/pins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${config.access_token}`
                },
                body: JSON.stringify({
                    board_id: config.board_id,
                    title: content.contentText.slice(0, 90),
                    description: content.contentText.slice(0, 500),
                    media_source: {
                        source_type: 'image_url',
                        url: imageUrl
                    }
                })
            });
            const data = await response.json();
            if (!response.ok) {
                return {
                    contentId: content.id,
                    platform: 'pinterest',
                    success: false,
                    message: data?.message || 'Erreur Pinterest'
                };
            }

            return {
                contentId: content.id,
                platform: 'pinterest',
                success: true,
                message: 'Publié sur Pinterest',
                externalId: data?.id
            };
        } catch (error: any) {
            return {
                contentId: content.id,
                platform: 'pinterest',
                success: false,
                message: error?.message || 'Erreur Pinterest'
            };
        }
    }

    private async publishX(content: EditorialContent, config?: { app_key?: string; app_secret?: string; access_token?: string; access_secret?: string }): Promise<PublishResult> {
        if (!config?.app_key || !config?.app_secret || !config?.access_token || !config?.access_secret) {
            return {
                contentId: content.id,
                platform: 'xtwitter',
                success: false,
                message: 'Config X/Twitter incomplète (4 clés OAuth 1.0a requises: app_key, app_secret, access_token, access_secret)'
            };
        }

        try {
            // Instanciation du client X avec OAuth 1.0a (User Context)
            const twitterClient = new TwitterApi({
                appKey: config.app_key,
                appSecret: config.app_secret,
                accessToken: config.access_token,
                accessSecret: config.access_secret,
            });

            // L'API V2 permet de tweeter simplement du texte
            const tweet = await twitterClient.v2.tweet(content.contentText);

            return {
                contentId: content.id,
                platform: 'xtwitter',
                success: true,
                message: 'Publié sur X/Twitter',
                externalId: tweet.data.id
            };
        } catch (error: any) {
            console.error('Erreur X/Twitter détaillée:', error);
            // Extraction du message d'erreur si fourni par l'API
            const apiMessage = error?.data?.detail || error?.data?.error || error?.message || 'Erreur X/Twitter';
            
            return {
                contentId: content.id,
                platform: 'xtwitter',
                success: false,
                message: `Erreur Twitter API : ${apiMessage}`
            };
        }
    }

    private async publishGmb(content: EditorialContent, config?: { account_id?: string; location_id?: string; access_token?: string }): Promise<PublishResult> {
        if (!config?.account_id || !config?.location_id || !config?.access_token) {
            return {
                contentId: content.id,
                platform: 'google my business',
                success: false,
                message: 'Config Google My Business manquante (account_id/location_id/access_token)'
            };
        }

        const imageUrl = this.getPublicImageUrl(content.imageUrl || undefined);
        const summary = content.contentText.slice(0, 1500);

        const payload: Record<string, any> = {
            languageCode: 'fr-FR',
            summary,
            topicType: 'STANDARD'
        };

        if (imageUrl) {
            payload.media = [
                {
                    mediaFormat: 'PHOTO',
                    sourceUrl: imageUrl
                }
            ];
        }

        const endpoint = `https://mybusiness.googleapis.com/v4/accounts/${config.account_id}/locations/${config.location_id}/localPosts`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${config.access_token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) {
                return {
                    contentId: content.id,
                    platform: 'google my business',
                    success: false,
                    message: data?.error?.message || data?.message || 'Erreur Google My Business'
                };
            }

            return {
                contentId: content.id,
                platform: 'google my business',
                success: true,
                message: 'Publié sur Google My Business',
                externalId: data?.name
            };
        } catch (error: any) {
            return {
                contentId: content.id,
                platform: 'google my business',
                success: false,
                message: error?.message || 'Erreur Google My Business'
            };
        }
    }

    private async publishTikTok(content: EditorialContent, config?: { access_token?: string }): Promise<PublishResult> {
        if (!config?.access_token) {
            return {
                contentId: content.id,
                platform: 'tiktok',
                success: false,
                message: 'Config TikTok manquante (access_token)'
            };
        }

        return {
            contentId: content.id,
            platform: 'tiktok',
            success: false,
            message: 'Publication TikTok non implémentée (API à configurer)'
        };
    }

    private async publishLinkedIn(content: EditorialContent, config?: { author_urn?: string; access_token?: string; visibility?: 'PUBLIC' | 'CONNECTIONS' }): Promise<PublishResult> {
        if (!config?.author_urn || !config?.access_token) {
            return {
                contentId: content.id,
                platform: 'linkedin',
                success: false,
                message: 'Config LinkedIn manquante (author_urn/access_token)'
            };
        }

        const payload = {
            author: config.author_urn,
            lifecycleState: 'PUBLISHED',
            specificContent: {
                'com.linkedin.ugc.ShareContent': {
                    shareCommentary: {
                        text: content.contentText
                    },
                    shareMediaCategory: 'NONE'
                }
            },
            visibility: {
                'com.linkedin.ugc.MemberNetworkVisibility': config.visibility || 'PUBLIC'
            }
        };

        try {
            const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${config.access_token}`,
                    'X-Restli-Protocol-Version': '2.0.0'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                return {
                    contentId: content.id,
                    platform: 'linkedin',
                    success: false,
                    message: data?.message || data?.error?.message || 'Erreur LinkedIn'
                };
            }

            const externalId = response.headers.get('x-restli-id') || undefined;
            return {
                contentId: content.id,
                platform: 'linkedin',
                success: true,
                message: 'Publié sur LinkedIn',
                externalId
            };
        } catch (error: any) {
            return {
                contentId: content.id,
                platform: 'linkedin',
                success: false,
                message: error?.message || 'Erreur LinkedIn'
            };
        }
    }
    private async publishWordPress(content: EditorialContent, config?: { base_url?: string; username?: string; application_password?: string }): Promise<PublishResult> {
        if (!config?.base_url || !config?.username || !config?.application_password) {
            return {
                contentId: content.id,
                platform: 'blog',
                success: false,
                message: 'Config WordPress manquante (base_url/username/application_password)'
            };
        }

        // Préparer le titre à partir du contenu (première ligne ou premiers 100 caractères)
        const lines = content.contentText.split('\n').filter(l => l.trim());
        const title = lines[0]?.slice(0, 150) || 'Publication automatique';
        const body = content.contentText;

        // Construire le payload WordPress REST API
        // On publie en 'draft' (brouillon) pour que l'utilisateur puisse relire et valider l'article final dans WP
        const payload: Record<string, any> = {
            title,
            content: body,
            status: 'draft' // <-- Modifié ici (était 'publish')
        };

        // Authentification Basic Auth avec Application Password
        const credentials = Buffer.from(`${config.username}:${config.application_password}`).toString('base64');

        // Nettoyer l'URL de base (ex: si l'utilisateur a rentré /wp-admin par erreur)
        const baseUrl = config.base_url
            .replace(/\/wp-admin\/?$/, '') // enlever /wp-admin ou /wp-admin/ à la fin
            .replace(/\/$/, '');           // enlever le slash final

        const endpoint = `${baseUrl}/wp-json/wp/v2/posts`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${credentials}`
                },
                body: JSON.stringify(payload)
            });

            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                return {
                    contentId: content.id,
                    platform: 'blog',
                    success: false,
                    message: `Erreur API WordPress (réponse non-JSON): L'URL ${baseUrl} semble incorrecte ou l'API REST y est désactivée.`
                };
            }

            if (!response.ok) {
                return {
                    contentId: content.id,
                    platform: 'blog',
                    success: false,
                    message: data?.message || data?.code || 'Erreur WordPress'
                };
            }

            return {
                contentId: content.id,
                platform: 'blog',
                success: true,
                message: 'Publié sur WordPress',
                externalId: String(data?.id)
            };
        } catch (error: any) {
            return {
                contentId: content.id,
                platform: 'blog',
                success: false,
                message: error?.message || 'Erreur WordPress'
            };
        }
    }
}

export const socialPublisherService = new SocialPublisherService();
