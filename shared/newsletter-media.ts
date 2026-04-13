export type NewsletterMediaType = "image" | "video";

export type NewsletterMediaBlock = {
  type: NewsletterMediaType;
  description: string;
  url?: string;
};

export type NewsletterMediaPart =
  | { kind: "text"; text: string }
  | { kind: "media"; block: NewsletterMediaBlock; index: number };

const MEDIA_LINE_PATTERN = /^\s*\[(IMAGE|VIDEO)(?:_SECTION)?:\s*([^\]|]*?)(?:\s*\|\s*url=(.*?))?\]\s*$/i;

function cleanValue(value: string | undefined): string {
  return (value || "")
    .replace(/[\r\n\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseNewsletterMediaLine(line: string): NewsletterMediaBlock | null {
  const match = line.match(MEDIA_LINE_PATTERN);
  if (!match) return null;

  const type = match[1].toLowerCase() === "video" ? "video" : "image";
  const description = cleanValue(match[2]) || (type === "video" ? "Vidéo à intégrer" : "Image à ajouter");
  const url = cleanValue(match[3]);

  return {
    type,
    description,
    ...(url ? { url } : {})
  };
}

export function serializeNewsletterMediaBlock(block: NewsletterMediaBlock): string {
  const tag = block.type === "video" ? "VIDEO_SECTION" : "IMAGE_SECTION";
  const description = cleanValue(block.description) || (block.type === "video" ? "Vidéo à intégrer" : "Image à ajouter");
  const url = cleanValue(block.url);
  return `[${tag}: ${description}${url ? ` | url=${url}` : ""}]`;
}

export function getNewsletterMediaBlocks(content: string): NewsletterMediaBlock[] {
  return content
    .split(/\r?\n/)
    .map(parseNewsletterMediaLine)
    .filter((block): block is NewsletterMediaBlock => Boolean(block));
}

export function splitNewsletterMediaContent(content: string): NewsletterMediaPart[] {
  const parts: NewsletterMediaPart[] = [];
  const textBuffer: string[] = [];
  let mediaIndex = 0;

  const flushText = () => {
    const text = textBuffer.join("\n").trim();
    if (text) parts.push({ kind: "text", text });
    textBuffer.length = 0;
  };

  for (const line of content.split(/\r?\n/)) {
    const block = parseNewsletterMediaLine(line);
    if (block) {
      flushText();
      parts.push({ kind: "media", block, index: mediaIndex });
      mediaIndex += 1;
    } else if (!line.trim()) {
      flushText();
    } else {
      textBuffer.push(line);
    }
  }

  flushText();
  return parts.length ? parts : [{ kind: "text", text: content }];
}

export function serializeNewsletterMediaParts(parts: NewsletterMediaPart[]): string {
  return parts
    .map((part) => part.kind === "media" ? serializeNewsletterMediaBlock(part.block) : part.text.trim())
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

export function replaceNewsletterMediaBlock(
  content: string,
  blockIndex: number,
  nextBlock: NewsletterMediaBlock
): string {
  let currentIndex = 0;
  return content
    .split(/\r?\n/)
    .map((line) => {
      const block = parseNewsletterMediaLine(line);
      if (!block) return line;

      if (currentIndex === blockIndex) {
        currentIndex += 1;
        return serializeNewsletterMediaBlock(nextBlock);
      }

      currentIndex += 1;
      return line;
    })
    .join("\n");
}

export function removeNewsletterMediaBlock(content: string, blockIndex: number): string {
  let currentIndex = 0;
  return content
    .split(/\r?\n/)
    .filter((line) => {
      const block = parseNewsletterMediaLine(line);
      if (!block) return true;

      const shouldKeep = currentIndex !== blockIndex;
      currentIndex += 1;
      return shouldKeep;
    })
    .join("\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

export function appendNewsletterMediaBlock(content: string, block: NewsletterMediaBlock): string {
  const nextLine = serializeNewsletterMediaBlock(block);
  return `${content.trimEnd()}\n\n${nextLine}`;
}

export function insertNewsletterMediaBlockAfterPart(
  content: string,
  partIndex: number,
  block: NewsletterMediaBlock
): string {
  const parts = splitNewsletterMediaContent(content);
  const insertAt = Math.min(Math.max(partIndex + 1, 0), parts.length);
  parts.splice(insertAt, 0, { kind: "media", block, index: -1 });
  return serializeNewsletterMediaParts(parts);
}

export function moveNewsletterMediaPart(
  content: string,
  partIndex: number,
  direction: "up" | "down"
): string {
  const parts = splitNewsletterMediaContent(content);
  const targetIndex = direction === "up" ? partIndex - 1 : partIndex + 1;

  if (
    partIndex < 0 ||
    partIndex >= parts.length ||
    targetIndex < 0 ||
    targetIndex >= parts.length ||
    parts[partIndex]?.kind !== "media"
  ) {
    return content;
  }

  const [part] = parts.splice(partIndex, 1);
  parts.splice(targetIndex, 0, part);
  return serializeNewsletterMediaParts(parts);
}

function findInsertionIndexes(lines: string[]): number[] {
  const h2Indexes = lines
    .map((line, index) => (/^##\s+\S/.test(line.trim()) ? index : -1))
    .filter((index) => index >= 0);

  if (h2Indexes.length) {
    return h2Indexes.map((h2Index, order) => {
      const nextH2Index = h2Indexes[order + 1] ?? lines.length;
      const sectionLines = lines.slice(h2Index + 1, nextH2Index);
      const firstTextOffset = sectionLines.findIndex((line) => line.trim() && !parseNewsletterMediaLine(line));
      if (firstTextOffset < 0) return Math.min(h2Index + 1, lines.length);

      const firstTextIndex = h2Index + 1 + firstTextOffset;
      const nextBlankOffset = lines
        .slice(firstTextIndex + 1, nextH2Index)
        .findIndex((line) => !line.trim());

      if (nextBlankOffset >= 0) {
        return firstTextIndex + 1 + nextBlankOffset;
      }

      return Math.max(firstTextIndex + 1, Math.min(nextH2Index, lines.length));
    });
  }

  const firstNonEmpty = lines.findIndex((line) => line.trim());
  if (firstNonEmpty < 0) return [0];

  const firstBlankAfterParagraph = lines.slice(firstNonEmpty + 1).findIndex((line) => !line.trim());
  return [firstBlankAfterParagraph >= 0 ? firstNonEmpty + 1 + firstBlankAfterParagraph : lines.length];
}

export function ensureNewsletterMediaBlocks(
  content: string,
  options: {
    includeImages?: boolean;
    includeVideos?: boolean;
    sectionCount?: number;
  } = {}
): string {
  const includeImages = options.includeImages !== false;
  const includeVideos = options.includeVideos !== false;
  if (!includeImages && !includeVideos) return content;

  const existing = getNewsletterMediaBlocks(content);
  const needsImage = includeImages && !existing.some((block) => block.type === "image");
  const needsVideo = includeVideos && !existing.some((block) => block.type === "video");
  if (!needsImage && !needsVideo) return content;

  const lines = content.split(/\r?\n/);
  const insertionIndexes = findInsertionIndexes(lines);
  const blocksToInsert: NewsletterMediaBlock[] = [];

  if (needsImage) {
    blocksToInsert.push({
      type: "image",
      description: "Visuel principal de la section, à uploader ou renseigner"
    });
  }

  if (needsVideo) {
    blocksToInsert.push({
      type: "video",
      description: "Vidéo complémentaire à intégrer",
      url: "URL à ajouter"
    });
  }

  let offset = 0;
  blocksToInsert.forEach((block, index) => {
    const baseIndex = insertionIndexes[Math.min(index, insertionIndexes.length - 1)];
    const insertAt = Math.min(baseIndex + offset, lines.length);
    lines.splice(insertAt, 0, "", serializeNewsletterMediaBlock(block), "");
    offset += 3;
  });

  return lines.join("\n").replace(/\n{4,}/g, "\n\n\n").trim();
}
