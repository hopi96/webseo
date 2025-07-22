/**
 * Utilitaires pour la gestion avancée des images dans l'application
 * Support des champs image (upload) et image_url (DALL-E) d'Airtable
 */

export interface ImageData {
  hasImage: boolean;
  imageUrl: string | null;
  imageSource: 'upload' | 'ai' | null;
}

export interface FormImageState {
  generatedImageUrl: string;
  uploadedImageUrl: string;
  formHasImage: boolean;
  formImageUrl: string;
}

/**
 * Détermine le type d'image et retourne les informations appropriées
 */
export function analyzeImageSource(imageUrl: string): {
  source: 'upload' | 'ai' | 'external';
  isDALLE: boolean;
  isLocal: boolean;
  isExternal: boolean;
} {
  if (!imageUrl) {
    return {
      source: 'external',
      isDALLE: false,
      isLocal: false,
      isExternal: false
    };
  }

  const isDALLE = imageUrl.includes('oaidalleapi') || imageUrl.includes('openai.com');
  const isLocal = imageUrl.startsWith('/uploads/');
  const isExternal = imageUrl.startsWith('http') && !isDALLE && !isLocal;

  let source: 'upload' | 'ai' | 'external' = 'external';
  if (isDALLE) source = 'ai';
  else if (isLocal) source = 'upload';

  return {
    source,
    isDALLE,
    isLocal,
    isExternal
  };
}

/**
 * Prépare les données d'image pour l'envoi à l'API Airtable
 * Selon la logique : Upload → champ image, DALL-E → les deux champs
 */
export function prepareImageDataForSubmission(formState: FormImageState): {
  hasImage: boolean;
  imageUrl: string | null;
  imageSource: 'upload' | 'ai' | null;
} {
  // Priorité 1: Image générée par DALL-E
  if (formState.generatedImageUrl) {
    return {
      hasImage: true,
      imageUrl: formState.generatedImageUrl,
      imageSource: 'ai'
    };
  }

  // Priorité 2: Image uploadée
  if (formState.uploadedImageUrl) {
    return {
      hasImage: true,
      imageUrl: formState.uploadedImageUrl,
      imageSource: 'upload'
    };
  }

  // Priorité 3: Image du formulaire (URL existante)
  if (formState.formHasImage && formState.formImageUrl) {
    const analysis = analyzeImageSource(formState.formImageUrl);
    return {
      hasImage: true,
      imageUrl: formState.formImageUrl,
      imageSource: analysis.source === 'ai' ? 'ai' : analysis.source === 'upload' ? 'upload' : null
    };
  }

  // Pas d'image
  return {
    hasImage: false,
    imageUrl: null,
    imageSource: null
  };
}

/**
 * Initialise l'état du formulaire d'image à partir des données existantes
 */
export function initializeImageFormState(existingData?: {
  hasImage?: boolean;
  imageUrl?: string | null;
  imageSource?: string | null;
}): FormImageState {
  if (!existingData?.hasImage || !existingData.imageUrl) {
    return {
      generatedImageUrl: "",
      uploadedImageUrl: "",
      formHasImage: false,
      formImageUrl: ""
    };
  }

  const analysis = analyzeImageSource(existingData.imageUrl);
  
  if (analysis.isDALLE) {
    return {
      generatedImageUrl: existingData.imageUrl,
      uploadedImageUrl: "",
      formHasImage: true,
      formImageUrl: existingData.imageUrl
    };
  } else if (analysis.isLocal) {
    return {
      generatedImageUrl: "",
      uploadedImageUrl: existingData.imageUrl,
      formHasImage: true,
      formImageUrl: existingData.imageUrl
    };
  } else {
    return {
      generatedImageUrl: "",
      uploadedImageUrl: "",
      formHasImage: true,
      formImageUrl: existingData.imageUrl
    };
  }
}

/**
 * Réinitialise l'état des images
 */
export function resetImageState(): FormImageState {
  return {
    generatedImageUrl: "",
    uploadedImageUrl: "",
    formHasImage: false,
    formImageUrl: ""
  };
}

/**
 * Valide si une URL d'image est accessible
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch {
    return false;
  }
}

/**
 * Retourne l'URL de l'image à afficher en priorité
 */
export function getDisplayImageUrl(formState: FormImageState): string | null {
  if (formState.generatedImageUrl) return formState.generatedImageUrl;
  if (formState.uploadedImageUrl) return formState.uploadedImageUrl;
  if (formState.formHasImage && formState.formImageUrl) return formState.formImageUrl;
  return null;
}

/**
 * Retourne le libellé de la source d'image pour l'affichage
 */
export function getImageSourceLabel(imageUrl: string): {
  label: string;
  color: string;
} {
  const analysis = analyzeImageSource(imageUrl);
  
  if (analysis.isDALLE) {
    return { label: "IA", color: "purple" };
  } else if (analysis.isLocal) {
    return { label: "Upload", color: "blue" };
  } else {
    return { label: "Image actuelle", color: "green" };
  }
}