import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import {
    getNewsletterMediaBlocks,
    splitNewsletterMediaContent,
    type NewsletterMediaBlock
} from '@shared/newsletter-media';

type ContentFormat = 'html' | 'markdown' | 'plain';

/**
 * Detect the format of content text
 */
export function detectContentFormat(content: string): ContentFormat {
    if (!content || typeof content !== 'string') {
        return 'plain';
    }

    const trimmed = content.trim();

    if (getNewsletterMediaBlocks(trimmed).length > 0) {
        return 'markdown';
    }

    // Check for HTML - look for common HTML tags
    const htmlPatterns = [
        /<\s*(!DOCTYPE|html|head|body|div|span|p|h[1-6]|ul|ol|li|a|img|br|hr|table|tr|td|th|thead|tbody|article|section|header|footer|nav|aside|main|strong|em|b|i|u|blockquote|pre|code)\s*[^>]*>/i,
        /<\/\s*(div|span|p|h[1-6]|ul|ol|li|a|table|tr|td|th|thead|tbody|article|section|header|footer|nav|aside|main|strong|em|b|i|u|blockquote|pre|code)\s*>/i,
    ];

    for (const pattern of htmlPatterns) {
        if (pattern.test(trimmed)) {
            return 'html';
        }
    }

    // Check for Markdown patterns
    const markdownPatterns = [
        /^#{1,6}\s+.+$/m,                    // Headers: # Header
        /^\s*[-*+]\s+.+$/m,                  // Unordered lists
        /^\s*\d+\.\s+.+$/m,                  // Ordered lists
        /\[.+\]\(.+\)/,                      // Links: [text](url)
        /!\[.*\]\(.+\)/,                     // Images: ![alt](url)
        /\*\*.+\*\*/,                        // Bold: **text**
        /\*.+\*/,                            // Italic: *text*
        /__.+__/,                            // Bold: __text__
        /_.+_/,                              // Italic: _text_
        /`{1,3}[^`]+`{1,3}/,                 // Code: `code` or ```code```
        /^\s*>\s+.+$/m,                      // Blockquotes: > quote
        /^\s*---+\s*$/m,                     // Horizontal rules
        /^\s*\|.+\|.+\|/m,                   // Tables: | col1 | col2 |
    ];

    let markdownScore = 0;
    for (const pattern of markdownPatterns) {
        if (pattern.test(trimmed)) {
            markdownScore++;
        }
    }

    // If multiple markdown patterns match, it's likely markdown
    if (markdownScore >= 2) {
        return 'markdown';
    }

    return 'plain';
}

interface ContentRendererProps {
    content: string;
    className?: string;
    maxLength?: number;
}

/**
 * Render content based on its detected format
 */
export function ContentRenderer({ content, className = '', maxLength }: ContentRendererProps) {
    const displayContent = useMemo(() => {
        if (maxLength && content.length > maxLength) {
            return content.substring(0, maxLength) + '...';
        }
        return content;
    }, [content, maxLength]);

    const parts = useMemo(() => splitNewsletterMediaContent(displayContent), [displayContent]);
    const hasMediaBlocks = parts.some((part) => part.kind === 'media');

    if (hasMediaBlocks) {
        return (
            <div className={className}>
                {parts.map((part, index) => (
                    part.kind === 'media' ? (
                        <NewsletterMediaBlockView key={`media-${part.index}-${index}`} block={part.block} />
                    ) : (
                        <FormattedContent key={`text-${index}`} content={part.text} className="mb-4" />
                    )
                ))}
            </div>
        );
    }

    return <FormattedContent content={displayContent} className={className} />;
}

function FormattedContent({ content, className = '' }: ContentRendererProps) {
    const format = useMemo(() => detectContentFormat(content), [content]);

    const displayContent = useMemo(() => {
        return content;
    }, [content]);

    if (format === 'html') {
        // Sanitize HTML to prevent XSS attacks
        const sanitizedHtml = DOMPurify.sanitize(displayContent, {
            ALLOWED_TAGS: [
                'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'strike',
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'ul', 'ol', 'li',
                'a', 'img',
                'blockquote', 'pre', 'code',
                'table', 'thead', 'tbody', 'tr', 'th', 'td',
                'div', 'span', 'article', 'section', 'header', 'footer',
                'hr', 'figure', 'figcaption'
            ],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel'],
            ALLOW_DATA_ATTR: false,
        });

        return (
            <div
                className={`prose dark:prose-invert max-w-none ${className}`}
                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
        );
    }

    if (format === 'markdown') {
        return (
            <div className={`prose dark:prose-invert max-w-none ${className}`}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        // Custom styling for markdown elements
                        h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl font-bold mb-3">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
                        p: ({ children }) => <p className="mb-3">{children}</p>,
                        a: ({ href, children }) => (
                            <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                {children}
                            </a>
                        ),
                        ul: ({ children }) => <ul className="list-disc list-inside mb-3">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-3">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-gray-300 pl-4 italic my-3">{children}</blockquote>
                        ),
                        code: ({ className, children }) => {
                            const isInline = !className;
                            return isInline ? (
                                <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">{children}</code>
                            ) : (
                                <code className="block bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto text-sm">{children}</code>
                            );
                        },
                        pre: ({ children }) => (
                            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto my-3">{children}</pre>
                        ),
                        table: ({ children }) => (
                            <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600 my-3">{children}</table>
                        ),
                        th: ({ children }) => (
                            <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-100 dark:bg-gray-800 font-semibold">{children}</th>
                        ),
                        td: ({ children }) => (
                            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">{children}</td>
                        ),
                        img: ({ src, alt }) => (
                            <img src={src} alt={alt || ''} className="max-w-full h-auto rounded my-3" />
                        ),
                    }}
                >
                    {displayContent}
                </ReactMarkdown>
            </div>
        );
    }

    // Plain text - preserve whitespace
    return (
        <div className={className}>
            <p className="whitespace-pre-wrap">{displayContent}</p>
        </div>
    );
}

function isUsableMediaUrl(url?: string): url is string {
    return Boolean(url && url.trim() && !/^URL\s+à\s+ajouter$/i.test(url.trim()) && !/^URL\s+a\s+ajouter$/i.test(url.trim()));
}

function getYoutubeEmbedUrl(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function isDirectVideoUrl(url: string): boolean {
    return url.startsWith('/uploads/') || /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

function NewsletterMediaBlockView({ block }: { block: NewsletterMediaBlock }) {
    const hasUrl = isUsableMediaUrl(block.url);
    const mediaUrl = hasUrl ? block.url : undefined;

    if (block.type === 'image') {
        return (
            <figure className="my-5 overflow-hidden rounded-lg border bg-muted/40">
                {mediaUrl ? (
                    <img src={mediaUrl} alt={block.description} className="w-full max-h-[360px] object-cover" />
                ) : (
                    <div className="flex min-h-[140px] items-center justify-center bg-muted px-4 text-center text-sm text-muted-foreground">
                        Image à ajouter
                    </div>
                )}
                <figcaption className="px-4 py-3 text-sm text-muted-foreground">
                    {block.description}
                </figcaption>
            </figure>
        );
    }

    const embedUrl = mediaUrl ? getYoutubeEmbedUrl(mediaUrl) : null;

    return (
        <div className="my-5 overflow-hidden rounded-lg border bg-muted/40">
            {embedUrl ? (
                <iframe
                    src={embedUrl}
                    title={block.description}
                    className="aspect-video w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            ) : mediaUrl && isDirectVideoUrl(mediaUrl) ? (
                <video src={mediaUrl} controls className="aspect-video w-full bg-black" />
            ) : mediaUrl ? (
                <a
                    href={mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-5 text-sm font-medium text-blue-600 hover:underline"
                >
                    Ouvrir la vidéo
                </a>
            ) : (
                <div className="flex min-h-[120px] items-center justify-center bg-muted px-4 text-center text-sm text-muted-foreground">
                    Vidéo à intégrer
                </div>
            )}
            <div className="px-4 py-3 text-sm text-muted-foreground">
                {block.description}
            </div>
        </div>
    );
}

/**
 * Get a label for the detected format
 */
export function getFormatLabel(content: string): string {
    const format = detectContentFormat(content);
    switch (format) {
        case 'html': return 'HTML';
        case 'markdown': return 'Markdown';
        default: return 'Texte';
    }
}
