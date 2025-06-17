import { InsertSeoAnalysis } from "@shared/schema";

export interface RealSeoData {
  overallScore: number;
  technicalSeo: {
    mobileFriendly: boolean;
    httpsSecure: boolean;
    xmlSitemap: boolean;
    robotsTxt: boolean;
  };
  pageSpeed: number;
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    category: string;
  }>;
}

// Google PageSpeed Insights API
export async function analyzePageSpeed(url: string): Promise<{
  mobileScore: number;
  desktopScore: number;
  recommendations: any[];
}> {
  try {
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
    if (!apiKey) {
      throw new Error('Google PageSpeed API key is required');
    }

    const mobileResponse = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=mobile&category=performance&category=accessibility&category=best-practices&category=seo`
    );
    
    const desktopResponse = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=desktop&category=performance&category=accessibility&category=best-practices&category=seo`
    );

    if (!mobileResponse.ok || !desktopResponse.ok) {
      throw new Error('Failed to fetch PageSpeed data');
    }

    const mobileData = await mobileResponse.json();
    const desktopData = await desktopResponse.json();

    const mobileScore = Math.round(mobileData.lighthouseResult.categories.performance.score * 100);
    const desktopScore = Math.round(desktopData.lighthouseResult.categories.performance.score * 100);

    const recommendations = extractRecommendations(mobileData.lighthouseResult.audits);

    return {
      mobileScore,
      desktopScore,
      recommendations
    };
  } catch (error) {
    console.error('PageSpeed analysis failed:', error);
    throw error;
  }
}

// Analyze basic technical SEO
export async function analyzeTechnicalSeo(url: string): Promise<{
  mobileFriendly: boolean;
  httpsSecure: boolean;
  xmlSitemap: boolean;
  robotsTxt: boolean;
}> {
  try {
    const httpsSecure = url.startsWith('https://');
    
    // Check robots.txt
    let robotsTxt = false;
    try {
      const robotsUrl = new URL('/robots.txt', url).toString();
      const robotsResponse = await fetch(robotsUrl);
      robotsTxt = robotsResponse.ok;
    } catch (e) {
      robotsTxt = false;
    }

    // Check XML sitemap
    let xmlSitemap = false;
    try {
      const sitemapUrl = new URL('/sitemap.xml', url).toString();
      const sitemapResponse = await fetch(sitemapUrl);
      xmlSitemap = sitemapResponse.ok;
    } catch (e) {
      xmlSitemap = false;
    }

    // Mobile-friendly test using Google Mobile-Friendly Test API
    let mobileFriendly = true; // Default to true, would need Mobile-Friendly Test API
    
    return {
      mobileFriendly,
      httpsSecure,
      xmlSitemap,
      robotsTxt
    };
  } catch (error) {
    console.error('Technical SEO analysis failed:', error);
    return {
      mobileFriendly: false,
      httpsSecure: false,
      xmlSitemap: false,
      robotsTxt: false
    };
  }
}

// Extract recommendations from PageSpeed insights
function extractRecommendations(audits: any): Array<{
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}> {
  const recommendations = [];
  
  // Recommandations de performance
  if (audits['first-contentful-paint']?.score < 0.9) {
    recommendations.push({
      id: 'fcp',
      title: 'Améliorer le Premier Contenu Affiché',
      description: 'Optimisez les images et réduisez le temps de réponse du serveur pour améliorer la vitesse de chargement.',
      priority: 'high' as const,
      category: 'Performance'
    });
  }

  if (audits['largest-contentful-paint']?.score < 0.9) {
    recommendations.push({
      id: 'lcp',
      title: 'Optimiser le Plus Grand Élément Affiché',
      description: 'Réduisez les ressources bloquant le rendu et optimisez les images critiques.',
      priority: 'high' as const,
      category: 'Performance'
    });
  }

  if (audits['cumulative-layout-shift']?.score < 0.9) {
    recommendations.push({
      id: 'cls',
      title: 'Minimiser les Décalages de Mise en Page',
      description: 'Assurez-vous que les images et publicités ont des dimensions définies pour éviter les décalages.',
      priority: 'medium' as const,
      category: 'Performance'
    });
  }

  // Recommandations SEO
  if (audits['meta-description']?.score === null || audits['meta-description']?.score < 1) {
    recommendations.push({
      id: 'meta-description',
      title: 'Ajouter des Méta-Descriptions',
      description: 'Ajoutez des méta-descriptions uniques pour améliorer le taux de clic dans les résultats de recherche.',
      priority: 'high' as const,
      category: 'SEO'
    });
  }

  if (audits['document-title']?.score < 1) {
    recommendations.push({
      id: 'page-title',
      title: 'Optimiser les Titres de Page',
      description: 'Assurez-vous que toutes les pages ont des titres uniques et descriptifs.',
      priority: 'high' as const,
      category: 'SEO'
    });
  }

  return recommendations;
}

// Comprehensive SEO analysis combining multiple sources
export async function performComprehensiveSeoAnalysis(url: string): Promise<InsertSeoAnalysis> {
  try {
    console.log(`Starting real SEO analysis for: ${url}`);
    
    const [pageSpeedData, technicalData] = await Promise.all([
      analyzePageSpeed(url),
      analyzeTechnicalSeo(url)
    ]);

    const avgPageSpeed = Math.round((pageSpeedData.mobileScore + pageSpeedData.desktopScore) / 2);
    
    // Calculate overall score based on various factors
    const overallScore = calculateOverallScore({
      pageSpeed: avgPageSpeed,
      technicalSeo: technicalData,
      recommendations: pageSpeedData.recommendations
    });

    console.log(`SEO analysis completed. PageSpeed: ${avgPageSpeed}, Overall Score: ${overallScore}`);

    return {
      overallScore,
      organicTraffic: 0, // Would need Google Analytics API
      keywordsRanking: 0, // Would need Search Console API
      backlinks: 0, // Would need backlink analysis API
      pageSpeed: avgPageSpeed,
      technicalSeo: technicalData,
      recommendations: pageSpeedData.recommendations,
      keywords: [], // Would need Search Console API
      trafficData: [] // Would need Analytics API
    } as any;
  } catch (error) {
    console.error('Comprehensive SEO analysis failed:', error);
    
    // Return fallback data with error indication
    return {
      overallScore: 0,
      organicTraffic: 0,
      keywordsRanking: 0,
      backlinks: 0,
      pageSpeed: 0,
      technicalSeo: {
        mobileFriendly: false,
        httpsSecure: false,
        xmlSitemap: false,
        robotsTxt: false
      },
      recommendations: [{
        id: 'api-error',
        title: 'Erreur d\'Analyse',
        description: 'Impossible d\'analyser le site web. Veuillez vérifier l\'URL et réessayer.',
        priority: 'high' as const,
        category: 'Erreur'
      }],
      keywords: [],
      trafficData: []
    } as any;
  }
}

function calculateOverallScore(data: {
  pageSpeed: number;
  technicalSeo: any;
  recommendations: any[];
}): number {
  let score = 0;
  
  // Page speed (40% weight)
  score += data.pageSpeed * 0.4;
  
  // Technical SEO (30% weight)
  const techScore = Object.values(data.technicalSeo).filter(Boolean).length / 4 * 100;
  score += techScore * 0.3;
  
  // Recommendations impact (30% weight)
  const highPriorityIssues = data.recommendations.filter(r => r.priority === 'high').length;
  const recommendationScore = Math.max(0, 100 - (highPriorityIssues * 15));
  score += recommendationScore * 0.3;
  
  return Math.round(Math.max(0, Math.min(100, score)));
}