import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ContentRenderer, getFormatLabel, detectContentFormat } from "@/lib/content-renderer";
import {
    Twitter,
    Instagram,
    Facebook,
    Linkedin,
    FileText,
    Mail,
    Youtube,
    Image,
    Clock,
    Heart,
    MessageCircle,
    Share2,
    MoreHorizontal,
    ThumbsUp,
    Send,
    Code
} from "lucide-react";
import type { EditorialContent } from "@shared/schema";

interface ArticlePreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    article: EditorialContent | null;
    siteName?: string;
}

export function ArticlePreviewDialog({
    open,
    onOpenChange,
    article,
    siteName = "Mon Site"
}: ArticlePreviewDialogProps) {
    if (!article) return null;

    const publicationDate = new Date(article.dateDePublication).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const getPreviewType = (type: string) => {
        switch (type) {
            case 'xtwitter': return 'twitter';
            case 'instagram': return 'instagram';
            case 'facebook': return 'facebook';
            case 'linkedin': return 'linkedin';
            case 'blog': return 'blog';
            case 'newsletter': return 'newsletter';
            case 'youtube': return 'youtube';
            default: return 'generic';
        }
    };

    const previewType = getPreviewType(article.typeContent);
    const contentFormat = detectContentFormat(article.contentText);
    const formatLabel = getFormatLabel(article.contentText);

    // Extract plain text for social media previews (strip HTML/Markdown)
    const getPlainText = (content: string, maxLength?: number): string => {
        let text = content;

        // Remove HTML tags
        text = text.replace(/<[^>]*>/g, '');

        // Remove Markdown syntax
        text = text.replace(/#{1,6}\s*/g, ''); // Headers
        text = text.replace(/\*\*([^*]+)\*\*/g, '$1'); // Bold
        text = text.replace(/\*([^*]+)\*/g, '$1'); // Italic
        text = text.replace(/__([^_]+)__/g, '$1'); // Bold
        text = text.replace(/_([^_]+)_/g, '$1'); // Italic
        text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Links
        text = text.replace(/`{1,3}[^`]+`{1,3}/g, ''); // Code
        text = text.replace(/^\s*[-*+]\s+/gm, ''); // List items
        text = text.replace(/^\s*\d+\.\s+/gm, ''); // Numbered lists
        text = text.replace(/^\s*>\s+/gm, ''); // Blockquotes

        // Clean up extra whitespace
        text = text.replace(/\n{3,}/g, '\n\n').trim();

        if (maxLength && text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }
        return text;
    };

    // Preview Twitter/X
    const TwitterPreview = () => (
        <Card className="max-w-[500px] mx-auto p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
            <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {siteName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white">{siteName}</span>
                        <span className="text-gray-500">@{siteName.toLowerCase().replace(/\s/g, '')}</span>
                        <span className="text-gray-500">·</span>
                        <span className="text-gray-500 text-sm">{publicationDate}</span>
                    </div>
                    <p className="text-gray-900 dark:text-white mt-2 whitespace-pre-wrap">
                        {getPlainText(article.contentText, 280)}
                    </p>
                    {article.hasImage && article.imageUrl && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                            <img src={article.imageUrl} alt="Post image" className="w-full h-auto max-h-[300px] object-cover" />
                        </div>
                    )}
                    <div className="flex items-center justify-between mt-4 text-gray-500">
                        <div className="flex items-center gap-2 hover:text-blue-500 cursor-pointer">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-sm">0</span>
                        </div>
                        <div className="flex items-center gap-2 hover:text-green-500 cursor-pointer">
                            <Share2 className="h-4 w-4" />
                            <span className="text-sm">0</span>
                        </div>
                        <div className="flex items-center gap-2 hover:text-red-500 cursor-pointer">
                            <Heart className="h-4 w-4" />
                            <span className="text-sm">0</span>
                        </div>
                        <MoreHorizontal className="h-4 w-4 hover:text-blue-500 cursor-pointer" />
                    </div>
                </div>
            </div>
        </Card>
    );

    // Preview Instagram
    const InstagramPreview = () => (
        <Card className="max-w-[400px] mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="flex items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs">
                    {siteName.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{siteName.toLowerCase().replace(/\s/g, '_')}</span>
                <MoreHorizontal className="h-4 w-4 ml-auto text-gray-500" />
            </div>
            {article.hasImage && article.imageUrl ? (
                <img src={article.imageUrl} alt="Post image" className="w-full aspect-square object-cover" />
            ) : (
                <div className="w-full aspect-square bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                    <Image className="h-16 w-16 text-gray-400" />
                </div>
            )}
            <div className="p-3">
                <div className="flex items-center gap-4 mb-2">
                    <Heart className="h-6 w-6 text-gray-700 dark:text-gray-300 hover:text-red-500 cursor-pointer" />
                    <MessageCircle className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                    <Send className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </div>
                <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-semibold">{siteName.toLowerCase().replace(/\s/g, '_')}</span>{" "}
                    {getPlainText(article.contentText, 150)}
                </p>
                <p className="text-xs text-gray-500 mt-2">{publicationDate}</p>
            </div>
        </Card>
    );

    // Preview Facebook
    const FacebookPreview = () => (
        <Card className="max-w-[500px] mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {siteName.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{siteName}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>{publicationDate}</span>
                        <span>·</span>
                        <span>🌐</span>
                    </div>
                </div>
                <MoreHorizontal className="h-5 w-5 ml-auto text-gray-500" />
            </div>
            <div className="px-3 pb-3">
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{getPlainText(article.contentText)}</p>
            </div>
            {article.hasImage && article.imageUrl && (
                <img src={article.imageUrl} alt="Post image" className="w-full h-auto max-h-[400px] object-cover" />
            )}
            <div className="flex items-center justify-between p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-gray-500 hover:text-blue-600 cursor-pointer">
                    <ThumbsUp className="h-5 w-5" />
                    <span>J'aime</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 hover:text-blue-600 cursor-pointer">
                    <MessageCircle className="h-5 w-5" />
                    <span>Commenter</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 hover:text-blue-600 cursor-pointer">
                    <Share2 className="h-5 w-5" />
                    <span>Partager</span>
                </div>
            </div>
        </Card>
    );

    // Preview LinkedIn
    const LinkedinPreview = () => (
        <Card className="max-w-[500px] mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="flex items-center gap-3 p-4">
                <div className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-lg">
                    {siteName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{siteName}</p>
                    <p className="text-xs text-gray-500">Marketing Digital</p>
                    <p className="text-xs text-gray-500">{publicationDate} • 🌐</p>
                </div>
                <MoreHorizontal className="h-5 w-5 text-gray-500" />
            </div>
            <div className="px-4 pb-3">
                <ContentRenderer
                    content={article.contentText}
                    className="text-gray-900 dark:text-white"
                />
            </div>
            {article.hasImage && article.imageUrl && (
                <img src={article.imageUrl} alt="Post image" className="w-full h-auto max-h-[400px] object-cover" />
            )}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
                👍 0 • 💬 0 commentaires
            </div>
            <div className="flex items-center justify-around p-2 border-t border-gray-200 dark:border-gray-700">
                {['👍 J\'aime', '💬 Commenter', '🔄 Partager', '📨 Envoyer'].map((action) => (
                    <button key={action} className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                        {action}
                    </button>
                ))}
            </div>
        </Card>
    );

    // Preview Blog Article - Full HTML/Markdown rendering
    const BlogPreview = () => (
        <Card className="max-w-[700px] mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {article.hasImage && article.imageUrl && (
                <img src={article.imageUrl} alt="Featured image" className="w-full h-56 object-cover" />
            )}
            <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">Blog</Badge>
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Code className="h-3 w-3" />
                        {formatLabel}
                    </Badge>
                    <span className="text-xs text-gray-500">{publicationDate}</span>
                </div>

                {/* Rendered content with proper HTML/Markdown support */}
                <article className="prose dark:prose-invert max-w-none">
                    <ContentRenderer content={article.contentText} />
                </article>

                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        {siteName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">{siteName}</p>
                        <p className="text-sm text-gray-500">Auteur</p>
                    </div>
                </div>
            </div>
        </Card>
    );

    // Preview Newsletter - Full HTML/Markdown rendering
    const NewsletterPreview = () => (
        <Card className="max-w-[600px] mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white text-center">
                <h1 className="text-2xl font-bold">{siteName}</h1>
                <p className="text-sm opacity-80">Newsletter du {publicationDate}</p>
            </div>
            {article.hasImage && article.imageUrl && (
                <img src={article.imageUrl} alt="Newsletter image" className="w-full h-48 object-cover" />
            )}
            <div className="p-6">
                {/* Rendered content with proper HTML/Markdown support */}
                <ContentRenderer
                    content={article.contentText}
                    className="text-gray-700 dark:text-gray-300 leading-relaxed"
                />
                <div className="mt-6 text-center">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
                        En savoir plus
                    </button>
                </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 text-center text-xs text-gray-500">
                © {new Date().getFullYear()} {siteName}. Tous droits réservés.
            </div>
        </Card>
    );

    // Preview YouTube
    const YoutubePreview = () => (
        <Card className="max-w-[500px] mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="relative aspect-video bg-gray-900 flex items-center justify-center">
                {article.hasImage && article.imageUrl ? (
                    <img src={article.imageUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : (
                    <Youtube className="h-16 w-16 text-red-600" />
                )}
                <div className="absolute bottom-2 right-2 bg-black text-white text-xs px-1 rounded">
                    3:45
                </div>
            </div>
            <div className="p-3 flex gap-3">
                <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {siteName.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                        {getPlainText(article.contentText).split('\n')[0] || 'Titre de la vidéo'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{siteName}</p>
                    <p className="text-sm text-gray-500">0 vues • {publicationDate}</p>
                </div>
            </div>
        </Card>
    );

    // Generic Preview with content detection
    const GenericPreview = () => (
        <Card className="max-w-[600px] mx-auto p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    {siteName.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{siteName}</p>
                    <p className="text-sm text-gray-500">{publicationDate}</p>
                </div>
                <Badge variant="outline" className="ml-auto text-xs flex items-center gap-1">
                    <Code className="h-3 w-3" />
                    {formatLabel}
                </Badge>
            </div>
            <ContentRenderer
                content={article.contentText}
                className="text-gray-900 dark:text-white"
            />
            {article.hasImage && article.imageUrl && (
                <img src={article.imageUrl} alt="Image" className="mt-4 rounded-lg w-full h-auto max-h-[300px] object-cover" />
            )}
        </Card>
    );

    const renderPreview = () => {
        switch (previewType) {
            case 'twitter': return <TwitterPreview />;
            case 'instagram': return <InstagramPreview />;
            case 'facebook': return <FacebookPreview />;
            case 'linkedin': return <LinkedinPreview />;
            case 'blog': return <BlogPreview />;
            case 'newsletter': return <NewsletterPreview />;
            case 'youtube': return <YoutubePreview />;
            default: return <GenericPreview />;
        }
    };

    const getPlatformIcon = (type: string) => {
        switch (type) {
            case 'twitter': return <Twitter className="h-4 w-4" />;
            case 'instagram': return <Instagram className="h-4 w-4" />;
            case 'facebook': return <Facebook className="h-4 w-4" />;
            case 'linkedin': return <Linkedin className="h-4 w-4" />;
            case 'blog': return <FileText className="h-4 w-4" />;
            case 'newsletter': return <Mail className="h-4 w-4" />;
            case 'youtube': return <Youtube className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {getPlatformIcon(previewType)}
                        Prévisualisation - {article.typeContent}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Info bar */}
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {publicationDate}
                        </Badge>
                        <Badge variant="secondary">{article.statut}</Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Code className="h-3 w-3" />
                            Format: {formatLabel}
                        </Badge>
                        {article.hasImage && (
                            <Badge variant="outline" className="flex items-center gap-1">
                                <Image className="h-3 w-3" />
                                Avec image
                            </Badge>
                        )}
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 overflow-x-auto">
                        {renderPreview()}
                    </div>

                    {/* Raw content toggle for debugging */}
                    <details className="border-t pt-4">
                        <summary className="font-medium text-gray-900 dark:text-white mb-2 cursor-pointer hover:text-blue-600">
                            📄 Voir le contenu source
                        </summary>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-[200px] overflow-y-auto mt-2">
                            <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                                {article.contentText}
                            </pre>
                        </div>
                    </details>
                </div>
            </DialogContent>
        </Dialog>
    );
}
