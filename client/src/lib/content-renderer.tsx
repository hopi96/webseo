import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';

type ContentFormat = 'html' | 'markdown' | 'plain';

/**
 * Detect the format of content text
 */
export function detectContentFormat(content: string): ContentFormat {
    if (!content || typeof content !== 'string') {
        return 'plain';
    }

    const trimmed = content.trim();

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
    const format = useMemo(() => detectContentFormat(content), [content]);

    const displayContent = useMemo(() => {
        if (maxLength && content.length > maxLength) {
            return content.substring(0, maxLength) + '...';
        }
        return content;
    }, [content, maxLength]);

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
