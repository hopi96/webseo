import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";

interface AIGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: string;
  existingContent?: string;
  onGenerated: (content: string) => void;
}

const aiGenerationSchema = z.object({
  prompt: z.string().min(10, "Le prompt doit faire au moins 10 caractères"),
  tone: z.enum(["professionnel", "décontracté", "engageant", "informatif", "commercial"]),
  targetAudience: z.enum(["parents", "enfants", "familles", "professionnels", "général"])
});

type AIGenerationFormData = z.infer<typeof aiGenerationSchema>;

export function AIGenerationDialog({ 
  open, 
  onOpenChange, 
  contentType, 
  existingContent, 
  onGenerated 
}: AIGenerationDialogProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const form = useForm<AIGenerationFormData>({
    resolver: zodResolver(aiGenerationSchema),
    defaultValues: {
      prompt: "",
      tone: "engageant",
      targetAudience: "parents"
    }
  });

  const generateContent = async (data: AIGenerationFormData) => {
    setIsGenerating(true);
    try {
      const response = await apiRequest('POST', '/api/generate-article', {
        keywords: data.prompt.split(' ').slice(0, 5), // Utiliser les premiers mots comme mots-clés
        topic: data.prompt,
        contentType: contentType,
        existingContent: existingContent,
        targetAudience: data.targetAudience,
        tone: data.tone
      });

      const generatedArticle = await response.json();
      
      onGenerated(generatedArticle.content);
      onOpenChange(false);
      
      toast({
        title: "Contenu généré avec succès",
        description: "Le contenu a été créé par GPT-4o selon votre prompt",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Erreur de génération",
        description: error.message || "Impossible de générer le contenu",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = (data: AIGenerationFormData) => {
    generateContent(data);
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'xtwitter': return 'X (Twitter)';
      case 'instagram': return 'Instagram';
      case 'article': return 'Article';
      case 'newsletter': return 'Newsletter';
      default: return type;
    }
  };

  const getToneLabel = (tone: string) => {
    switch (tone) {
      case 'professionnel': return 'Professionnel';
      case 'décontracté': return 'Décontracté';
      case 'engageant': return 'Engageant';
      case 'informatif': return 'Informatif';
      case 'commercial': return 'Commercial';
      default: return tone;
    }
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'parents': return 'Parents';
      case 'enfants': return 'Enfants';
      case 'familles': return 'Familles';
      case 'professionnels': return 'Professionnels';
      case 'général': return 'Grand public';
      default: return audience;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Générer du contenu avec GPT-4o
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Type de contenu : {getContentTypeLabel(contentType)}
          </p>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Votre prompt *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Décrivez le contenu que vous souhaitez générer..."
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ton</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir le ton" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="professionnel">Professionnel</SelectItem>
                        <SelectItem value="décontracté">Décontracté</SelectItem>
                        <SelectItem value="engageant">Engageant</SelectItem>
                        <SelectItem value="informatif">Informatif</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audience cible</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir l'audience" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="parents">Parents</SelectItem>
                        <SelectItem value="enfants">Enfants</SelectItem>
                        <SelectItem value="familles">Familles</SelectItem>
                        <SelectItem value="professionnels">Professionnels</SelectItem>
                        <SelectItem value="général">Grand public</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isGenerating}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isGenerating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer le contenu
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}