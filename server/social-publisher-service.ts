/**
 * Service de publication automatique sur les réseaux sociaux
 * Cherche les contenus du jour et publie selon les paramètres stockés en base
 */

import type { EditorialContent } from '@shared/schema';
import { supabaseService } from './supabase-service';

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

    private async publishX(content: EditorialContent, config?: { access_token?: string }): Promise<PublishResult> {
        if (!config?.access_token) {
            return {
                contentId: content.id,
                platform: 'xtwitter',
                success: false,
                message: 'Config X/Twitter manquante (access_token)'
            };
        }

        try {
            const response = await fetch('https://api.twitter.com/2/tweets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${config.access_token}`
                },
                body: JSON.stringify({ text: content.contentText })
            });
            const data = await response.json();
            if (!response.ok) {
                return {
                    contentId: content.id,
                    platform: 'xtwitter',
                    success: false,
                    message: data?.detail || data?.error || 'Erreur X/Twitter'
                };
            }

            return {
                contentId: content.id,
                platform: 'xtwitter',
                success: true,
                message: 'Publié sur X/Twitter',
                externalId: data?.data?.id
            };
        } catch (error: any) {
            return {
                contentId: content.id,
                platform: 'xtwitter',
                success: false,
                message: error?.message || 'Erreur X/Twitter'
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
}

export const socialPublisherService = new SocialPublisherService();
