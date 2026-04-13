import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSite } from "@/lib/site-context";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Zap, Sparkles, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

interface ExpressContentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedDate: string; // YYYY-MM-DD
}

const PLATFORMS = [
    { value: "blog", label: "📝 Article de Blog" },
    { value: "newsletter", label: "📧 Newsletter" },
    { value: "instagram", label: "📸 Instagram" },
    { value: "facebook", label: "👥 Facebook" },
    { value: "linkedin", label: "💼 LinkedIn" },
    { value: "xtwitter", label: "🐦 X (Twitter)" },
    { value: "youtube", label: "🎬 YouTube" },
    { value: "tiktok", label: "🎵 TikTok" },
    { value: "pinterest", label: "📌 Pinterest" },
    { value: "google my business", label: "🏢 Google My Business" },
] as const;

export function ExpressContentDialog({
    open,
    onOpenChange,
    selectedDate,
}: ExpressContentDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { currentSite, selectedSiteId } = useSite();
    const activeSiteId = selectedSiteId ?? currentSite?.id ?? null;

    const [platform, setPlatform] = useState<string>("");
    const [topic, setTopic] = useState<string>("");
    const [systemPrompt, setSystemPrompt] = useState<string>("");
    const [showPromptSection, setShowPromptSection] = useState(false);
    const [isAdaptingPrompt, setIsAdaptingPrompt] = useState(false);
    const [newsletterSectionCount, setNewsletterSectionCount] = useState(3);
    const [newsletterImageSections, setNewsletterImageSections] = useState(true);
    const [newsletterVideoSections, setNewsletterVideoSections] = useState(true);

    // Fetch system prompts for the selected site
    const { data: sitePrompts = [] } = useQuery<any[]>({
        queryKey: ["/api/sites", activeSiteId, "prompts"],
        enabled: !!activeSiteId && open,
        queryFn: async () => {
            if (!activeSiteId) return [];
            const response = await apiRequest(
                "GET",
                `/api/sites/${activeSiteId}/prompts`
            );
            const data = await response.json();
            return data.prompts || [];
        },
    });

    // When platform changes, auto-fill the system prompt from DB
    useEffect(() => {
        if (platform && sitePrompts.length > 0) {
            // Find prompt matching the selected platform
            const matchingPrompt = sitePrompts.find(
                (p: any) => p.platform?.toLowerCase() === platform.toLowerCase()
            );
            if (matchingPrompt?.promptSystem) {
                setSystemPrompt(matchingPrompt.promptSystem);
                setShowPromptSection(true);
            } else {
                setSystemPrompt("");
            }
        }
    }, [platform, sitePrompts]);

    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            // Small delay to avoid visual flicker
            const timer = setTimeout(() => {
                setPlatform("");
                setTopic("");
                setSystemPrompt("");
                setShowPromptSection(false);
                setIsAdaptingPrompt(false);
                setNewsletterSectionCount(3);
                setNewsletterImageSections(true);
                setNewsletterVideoSections(true);
                expressMutation.reset();
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [open]);

    const expressMutation = useMutation({
        mutationFn: async (data: {
            siteId: number;
            platform: string;
            topic: string;
            publicationDate: string;
            systemPrompt?: string;
            newsletterMediaPlan?: {
                sectionCount: number;
                includeImageSections: boolean;
                includeVideoSections: boolean;
            };
        }) => {
            const response = await apiRequest("POST", "/api/express-content", data);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erreur lors de la génération");
            }
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "⚡ Contenu généré !",
                description: `Contenu ${getPlatformLabel(platform)} créé pour le ${new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR")}`,
            });

            // Refresh calendar data
            queryClient.invalidateQueries({
                queryKey: ["/api/editorial-content"],
            });
            onOpenChange(false);
        },
        onError: (error: any) => {
            // Error is displayed in the dialog UI, no toast needed
            console.error("Express generation error:", error);
        },
    });

    const getPlatformLabel = (value: string) => {
        return PLATFORMS.find((p) => p.value === value)?.label || value;
    };

    const handleAdaptPrompt = async () => {
        if (!platform || !topic.trim()) return;

        setIsAdaptingPrompt(true);
        setShowPromptSection(true); // Open section to show progress/result

        try {
            // Get the base prompt for this platform (either from DB or from quick suggestions)
            let basePrompt = systemPrompt;
            if (!basePrompt) {
                const matchingPrompt = sitePrompts.find(
                    (p: any) => p.platform?.toLowerCase() === platform.toLowerCase()
                );
                if (matchingPrompt?.promptSystem) {
                    basePrompt = matchingPrompt.promptSystem;
                } else {
                    basePrompt = getQuickPrompts(platform)[0] || "";
                }
            }

            const response = await apiRequest("POST", "/api/adapt-prompt", {
                basePrompt,
                topic: topic.trim(),
                platform,
            });

            if (!response.ok) {
                throw new Error("Erreur de l'API d'adaptation du prompt");
            }

            const data = await response.json();
            if (data.prompt) {
                setSystemPrompt(data.prompt);
                toast({
                    title: "✨ Prompt adapté !",
                    description: "L'IA a optimisé vos instructions pour ce sujet précis.",
                });
            }
        } catch (error) {
            console.error("Erreur adaptPrompt:", error);
            toast({
                title: "Erreur",
                description: "Impossible d'adapter le prompt. Veuillez réessayer.",
                variant: "destructive",
            });
        } finally {
            setIsAdaptingPrompt(false);
        }
    };

    const handleGenerate = () => {
        if (!activeSiteId) {
            toast({
                title: "Site requis",
                description: "Veuillez sélectionner un site dans le menu principal.",
                variant: "destructive",
            });
            return;
        }

        if (!platform) {
            toast({
                title: "Plateforme requise",
                description: "Veuillez sélectionner une plateforme.",
                variant: "destructive",
            });
            return;
        }

        if (!topic.trim()) {
            toast({
                title: "Sujet requis",
                description: "Veuillez renseigner le sujet du contenu.",
                variant: "destructive",
            });
            return;
        }

        expressMutation.mutate({
            siteId: activeSiteId,
            platform,
            topic: topic.trim(),
            publicationDate: selectedDate,
            systemPrompt: systemPrompt.trim() || undefined,
            newsletterMediaPlan: platform === "newsletter" ? {
                sectionCount: newsletterSectionCount,
                includeImageSections: newsletterImageSections,
                includeVideoSections: newsletterVideoSections,
            } : undefined,
        });
    };

    const handleClose = () => {
        if (!expressMutation.isPending) {
            onOpenChange(false);
        }
    };

    const formattedDate = selectedDate
        ? new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : "";

    // Get available prompts for the platform selector badge
    const getPromptForPlatform = (platformValue: string) => {
        return sitePrompts.find(
            (p: any) => p.platform?.toLowerCase() === platformValue.toLowerCase()
        );
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/25">
                            <Zap className="h-4 w-4 text-white" />
                        </div>
                        Contenu Express
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Générez du contenu IA en un clic pour le{" "}
                        <span className="font-semibold text-foreground">
                            {formattedDate}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                {expressMutation.isPending ? (
                    /* Loading state */
                    <div className="flex flex-col items-center justify-center py-12 space-y-6">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-orange-200 dark:border-orange-900 animate-spin border-t-orange-500" />
                            <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-orange-500 animate-pulse" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                Génération en cours...
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[280px]">
                                L'IA analyse le contexte, recherche des informations et rédige
                                votre contenu. Cela peut prendre jusqu'à 30 secondes.
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div
                                className="w-2 h-2 rounded-full bg-orange-500 animate-bounce"
                                style={{ animationDelay: "0ms" }}
                            />
                            <div
                                className="w-2 h-2 rounded-full bg-orange-400 animate-bounce"
                                style={{ animationDelay: "150ms" }}
                            />
                            <div
                                className="w-2 h-2 rounded-full bg-orange-300 animate-bounce"
                                style={{ animationDelay: "300ms" }}
                            />
                        </div>
                    </div>
                ) : expressMutation.isSuccess ? (
                    /* Success state */
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                Contenu créé avec succès !
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Le contenu a été ajouté à votre calendrier.
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleClose}>
                            Fermer
                        </Button>
                    </div>
                ) : expressMutation.isError ? (
                    /* Error state */
                    <div className="space-y-6">
                        <div className="flex flex-col items-center justify-center py-6 space-y-3">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                                    Erreur de génération
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[320px]">
                                    {(expressMutation.error as any)?.message ||
                                        "Une erreur est survenue. Veuillez réessayer."}
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose}>
                                Fermer
                            </Button>
                            <Button
                                onClick={() => expressMutation.reset()}
                                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                            >
                                Réessayer
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    /* Form state */
                    <div className="space-y-4 pt-2">
                        {/* Platform selector */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="express-platform"
                                className="text-sm font-medium"
                            >
                                Plateforme
                            </Label>
                            <Select value={platform} onValueChange={setPlatform}>
                                <SelectTrigger id="express-platform" className="h-11">
                                    <SelectValue placeholder="Choisir la plateforme..." />
                                </SelectTrigger>
                                <SelectContent className="smart-scroll-vertical max-h-60">
                                    {PLATFORMS.map((p) => {
                                        const hasPrompt = getPromptForPlatform(p.value);
                                        return (
                                            <SelectItem key={p.value} value={p.value}>
                                                <span className="flex items-center gap-2">
                                                    {p.label}
                                                    {hasPrompt && (
                                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" title="Prompt système configuré" />
                                                    )}
                                                </span>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Topic input */}
                        <div className="space-y-2">
                            <Label htmlFor="express-topic" className="text-sm font-medium">
                                Sujet / Thème
                            </Label>
                            <Input
                                id="express-topic"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="Ex: Les 5 tendances SEO de 2026..."
                                className="h-11"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleGenerate();
                                    }
                                }}
                            />
                        </div>

                        {platform === "newsletter" && (
                            <div className="space-y-3 rounded-lg border p-3">
                                <div>
                                    <Label className="text-sm font-medium">Sections média newsletter</Label>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Ajoute des emplacements propres pour insérer ensuite des images ou des vidéos dans la newsletter.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Nombre de sections</Label>
                                        <Select
                                            value={String(newsletterSectionCount)}
                                            onValueChange={(value) => setNewsletterSectionCount(Number(value))}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="2">2</SelectItem>
                                                <SelectItem value="3">3</SelectItem>
                                                <SelectItem value="4">4</SelectItem>
                                                <SelectItem value="5">5</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center justify-between rounded-md border px-3 py-2">
                                        <Label htmlFor="newsletter-images" className="text-sm">
                                            Images
                                        </Label>
                                        <Switch
                                            id="newsletter-images"
                                            checked={newsletterImageSections}
                                            onCheckedChange={setNewsletterImageSections}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between rounded-md border px-3 py-2">
                                        <Label htmlFor="newsletter-videos" className="text-sm">
                                            Vidéos
                                        </Label>
                                        <Switch
                                            id="newsletter-videos"
                                            checked={newsletterVideoSections}
                                            onCheckedChange={setNewsletterVideoSections}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* System prompt section - collapsible */}
                        <div className="border rounded-lg overflow-hidden">
                            <button
                                type="button"
                                className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                onClick={() => setShowPromptSection(!showPromptSection)}
                            >
                                <span className="flex items-center gap-2">
                                    <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                                    Prompt système
                                    {systemPrompt && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                                            Personnalisé
                                        </span>
                                    )}
                                </span>
                                {showPromptSection ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </button>

                            {showPromptSection && (
                                <div className="px-3 pb-3 space-y-2 border-t">
                                    <div className="flex items-center justify-between pt-2">
                                        <p className="text-xs text-muted-foreground">
                                            {systemPrompt
                                                ? "Prompt chargé depuis la base. Modifiez-le ou enrichissez-le avec l'IA."
                                                : "Aucun prompt configuré. Ajoutez des instructions ou générez-en avec l'IA."}
                                        </p>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="h-7 text-xs bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 dark:text-orange-400 dark:border-orange-800"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAdaptPrompt();
                                            }}
                                            disabled={!platform || !topic.trim() || isAdaptingPrompt}
                                        >
                                            {isAdaptingPrompt ? (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-3 h-3 rounded-full border-2 border-orange-200 dark:border-orange-900 animate-spin border-t-orange-500" />
                                                    Adaptation...
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5">
                                                    <Sparkles className="h-3 w-3" />
                                                    Adapter au sujet
                                                </div>
                                            )}
                                        </Button>
                                    </div>
                                    <Textarea
                                        value={systemPrompt}
                                        onChange={(e) => setSystemPrompt(e.target.value)}
                                        placeholder="Ex: Tu es un expert en marketing digital. Génère du contenu engageant et optimisé SEO..."
                                        className="min-h-[100px] text-sm resize-y"
                                        disabled={isAdaptingPrompt}
                                    />
                                    {/* Quick prompt suggestions based on platform */}
                                    {!systemPrompt && platform && (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {getQuickPrompts(platform).map((suggestion, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    className="text-[11px] px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20 dark:hover:text-orange-400 transition-colors"
                                                    onClick={() => setSystemPrompt(suggestion)}
                                                >
                                                    {suggestion.length > 60
                                                        ? suggestion.substring(0, 60) + "..."
                                                        : suggestion}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="outline" onClick={handleClose}>
                                Annuler
                            </Button>
                            <Button
                                onClick={handleGenerate}
                                disabled={!platform || !topic.trim() || !activeSiteId}
                                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-orange-500/25 transition-all"
                            >
                                <Zap className="h-4 w-4 mr-2" />
                                Générer le contenu
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

/** Quick prompt suggestions per platform when no DB prompt is found */
function getQuickPrompts(platform: string): string[] {
    switch (platform) {
        case "blog":
            return [
                "Tu es un rédacteur web expert en SEO. Rédige un article de blog complet, structuré avec des titres H2/H3, optimisé pour le référencement naturel.",
                "Rédige un article expert avec des données chiffrées, des exemples concrets et un ton professionnel adapté au web.",
            ];
        case "newsletter":
            return [
                "Tu es un copywriter spécialisé en email marketing. Rédige une newsletter engageante avec un objet accrocheur, une introduction percutante et un CTA clair.",
                "Crée une newsletter informative et concise qui apporte de la valeur aux abonnés avec un ton chaleureux et professionnel.",
            ];
        case "instagram":
            return [
                "Crée un post Instagram engageant avec des emojis, des hashtags pertinents et un appel à l'action. Le texte doit être accrocheur dès la première ligne.",
                "Rédige une légende Instagram qui génère de l'engagement avec un storytelling captivant et 15-20 hashtags ciblés.",
            ];
        case "linkedin":
            return [
                "Rédige un post LinkedIn professionnel et engageant avec un hook d'ouverture puissant, un contenu à valeur ajoutée et un CTA discret.",
                "Crée un post LinkedIn thought leadership avec des insights business, un ton expert et authentique.",
            ];
        case "xtwitter":
            return [
                "Rédige un tweet percutant et viral de 280 caractères max avec un angle original et des hashtags pertinents.",
                "Crée un thread Twitter informatif et engageant en 5-7 tweets sur le sujet donné.",
            ];
        case "facebook":
            return [
                "Crée un post Facebook engageant qui encourage les interactions (likes, commentaires, partages) avec un ton conversationnel.",
            ];
        case "youtube":
            return [
                "Rédige un script vidéo YouTube structuré : hook d'intro (15s), contenu principal avec transitions, et CTA final avec description SEO.",
            ];
        case "tiktok":
            return [
                "Crée un script TikTok court et viral avec un hook dans les 3 premières secondes, un contenu dynamique et un CTA engageant.",
            ];
        default:
            return [
                "Génère du contenu professionnel, engageant et optimisé pour cette plateforme. Adapte le ton et le format au public cible.",
            ];
    }
}
