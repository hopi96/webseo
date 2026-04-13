import { ArrowDown, ArrowUp, Image as ImageIcon, Link, Plus, Trash2, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  appendNewsletterMediaBlock,
  getNewsletterMediaBlocks,
  insertNewsletterMediaBlockAfterPart,
  moveNewsletterMediaPart,
  removeNewsletterMediaBlock,
  replaceNewsletterMediaBlock,
  serializeNewsletterMediaParts,
  splitNewsletterMediaContent,
  type NewsletterMediaBlock,
  type NewsletterMediaPart,
  type NewsletterMediaType
} from "@shared/newsletter-media";

type NewsletterMediaEditorProps = {
  content: string;
  onContentChange: (content: string) => void;
};

function isUsableUrl(url?: string): url is string {
  return Boolean(url && url.trim() && !/^URL\s+à\s+ajouter$/i.test(url.trim()) && !/^URL\s+a\s+ajouter$/i.test(url.trim()));
}

function isDirectVideoUrl(url: string): boolean {
  return url.startsWith("/uploads/") || /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

function createMediaBlock(type: NewsletterMediaType): NewsletterMediaBlock {
  return {
    type,
    description: type === "video" ? "Vidéo complémentaire à intégrer" : "Visuel de section à ajouter",
    ...(type === "video" ? { url: "URL à ajouter" } : {})
  };
}

export function NewsletterMediaEditor({ content, onContentChange }: NewsletterMediaEditorProps) {
  const { toast } = useToast();
  const blocks = getNewsletterMediaBlocks(content || "");
  const parts = splitNewsletterMediaContent(content || "");

  const updateBlock = (index: number, updates: Partial<NewsletterMediaBlock>) => {
    const currentBlock = blocks[index];
    if (!currentBlock) return;
    onContentChange(replaceNewsletterMediaBlock(content, index, { ...currentBlock, ...updates }));
  };

  const addBlock = (type: NewsletterMediaType) => {
    onContentChange(appendNewsletterMediaBlock(content || "", createMediaBlock(type)));
  };

  const addBlockAfterPart = (partIndex: number, type: NewsletterMediaType) => {
    onContentChange(insertNewsletterMediaBlockAfterPart(content || "", partIndex, createMediaBlock(type)));
  };

  const updateTextPart = (partIndex: number, nextText: string) => {
    const nextParts = [...parts] as NewsletterMediaPart[];
    const currentPart = nextParts[partIndex];
    if (!currentPart || currentPart.kind !== "text") return;
    nextParts[partIndex] = { ...currentPart, text: nextText };
    onContentChange(serializeNewsletterMediaParts(nextParts));
  };

  const removeBlock = (index: number) => {
    onContentChange(removeNewsletterMediaBlock(content, index));
  };

  const moveMedia = (partIndex: number, direction: "up" | "down") => {
    onContentChange(moveNewsletterMediaPart(content || "", partIndex, direction));
  };

  const uploadMedia = async (index: number, file: File | undefined) => {
    if (!file) return;
    const block = blocks[index];
    if (!block) return;

    const expectedType = block.type === "video" ? "video/" : "image/";
    if (!file.type.startsWith(expectedType)) {
      toast({
        title: "Fichier incompatible",
        description: block.type === "video" ? "Sélectionnez une vidéo." : "Sélectionnez une image.",
        variant: "destructive"
      });
      return;
    }

    const maxSize = block.type === "video" ? 50 * 1024 * 1024 : 8 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Fichier trop lourd",
        description: block.type === "video" ? "La vidéo ne peut pas dépasser 50MB." : "L'image ne peut pas dépasser 8MB.",
        variant: "destructive"
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("media", file);

      const response = await fetch("/api/upload-newsletter-media", {
        method: "POST",
        body: formData
      });

      if (!response.ok) throw new Error(await response.text());

      const result = await response.json();
      if (!result.mediaUrl) throw new Error("Aucune URL média retournée");

      updateBlock(index, { url: result.mediaUrl });
      toast({
        title: "Média ajouté",
        description: "Le bloc newsletter a été mis à jour."
      });
    } catch (error: any) {
      toast({
        title: "Upload impossible",
        description: error?.message || "Impossible d'uploader ce média.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Label className="text-sm font-medium">Éditeur newsletter</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Placez les images et vidéos entre les paragraphes, puis déplacez-les avec les flèches.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => addBlock("image")}>
            <Plus className="mr-1 h-4 w-4" />
            Image en fin
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => addBlock("video")}>
            <Plus className="mr-1 h-4 w-4" />
            Vidéo en fin
          </Button>
        </div>
      </div>

      {blocks.length === 0 && (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          Aucun bloc multimédia. Ajoutez une image ou une vidéo après le paragraphe souhaité.
        </div>
      )}

      <div className="space-y-3">
        {parts.map((part, partIndex) => {
          if (part.kind === "text") {
            return (
              <div key={`text-${partIndex}`} className="rounded-lg border bg-background p-3">
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Paragraphe / section
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => addBlockAfterPart(partIndex, "image")}>
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Image ici
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => addBlockAfterPart(partIndex, "video")}>
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Vidéo ici
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={part.text}
                  onChange={(event) => updateTextPart(partIndex, event.target.value)}
                  className="min-h-[110px]"
                  placeholder="Texte de la section..."
                />
              </div>
            );
          }

          const block = part.block;
          const mediaIndex = part.index;
          const inputId = `newsletter-media-upload-${mediaIndex}-${block.type}`;
          const Icon = block.type === "video" ? Video : ImageIcon;
          const url = isUsableUrl(block.url) ? block.url : "";

          return (
            <div key={`${block.type}-${mediaIndex}-${partIndex}`} className="rounded-lg border bg-muted/30 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="h-4 w-4" />
                  {block.type === "video" ? "Section vidéo" : "Section image"}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={partIndex === 0}
                    onClick={() => moveMedia(partIndex, "up")}
                    title="Monter la section"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={partIndex >= parts.length - 1}
                    onClick={() => moveMedia(partIndex, "down")}
                    title="Descendre la section"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeBlock(mediaIndex)} title="Supprimer la section">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea
                    value={block.description}
                    onChange={(event) => updateBlock(mediaIndex, { description: event.target.value })}
                    className="min-h-[70px]"
                    placeholder="Décrivez le média à insérer dans cette section..."
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Link className="h-3 w-3" />
                      URL
                    </Label>
                    <Input
                      value={url}
                      onChange={(event) => updateBlock(mediaIndex, { url: event.target.value })}
                      placeholder={block.type === "video" ? "https://youtube.com/..." : "https://... ou /uploads/..."}
                    />
                  </div>
                  <div className="flex items-end">
                    <Input
                      id={inputId}
                      type="file"
                      accept={block.type === "video" ? "video/*" : "image/*"}
                      className="hidden"
                      onChange={(event) => uploadMedia(mediaIndex, event.target.files?.[0])}
                    />
                    <Button type="button" variant="outline" onClick={() => document.getElementById(inputId)?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Uploader
                    </Button>
                  </div>
                </div>

                {block.type === "image" && url && (
                  <img src={url} alt={block.description} className="max-h-48 w-full rounded-md object-cover" />
                )}
                {block.type === "video" && url && isDirectVideoUrl(url) && (
                  <video src={url} controls className="max-h-56 w-full rounded-md bg-black" />
                )}
                {block.type === "video" && url && !isDirectVideoUrl(url) && (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                    Ouvrir le lien vidéo
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
