// SEO Analysis utility functions

export interface SeoMetrics {
  overallScore: number;
  technicalScore: number;
  contentScore: number;
  performanceScore: number;
}

export interface SeoRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'technical' | 'content' | 'performance' | 'links';
  impact: number; // 1-10 scale
}

export function calculateOverallScore(metrics: {
  technical: number;
  content: number;
  performance: number;
  keywords: number;
}): number {
  // Weighted average calculation
  const weights = {
    technical: 0.3,
    content: 0.25,
    performance: 0.25,
    keywords: 0.2
  };

  return Math.round(
    metrics.technical * weights.technical +
    metrics.content * weights.content +
    metrics.performance * weights.performance +
    metrics.keywords * weights.keywords
  );
}

export function getScoreGrade(score: number): {
  grade: string;
  color: string;
  description: string;
} {
  if (score >= 90) {
    return {
      grade: 'A+',
      color: 'text-green-600',
      description: 'Excellent SEO performance'
    };
  } else if (score >= 80) {
    return {
      grade: 'A',
      color: 'text-green-500',
      description: 'Very good SEO performance'
    };
  } else if (score >= 70) {
    return {
      grade: 'B',
      color: 'text-yellow-500',
      description: 'Good SEO performance'
    };
  } else if (score >= 60) {
    return {
      grade: 'C',
      color: 'text-orange-500',
      description: 'Fair SEO performance'
    };
  } else {
    return {
      grade: 'D',
      color: 'text-red-500',
      description: 'Poor SEO performance'
    };
  }
}

export function prioritizeRecommendations(recommendations: SeoRecommendation[]): SeoRecommendation[] {
  return recommendations.sort((a, b) => {
    // Sort by priority first, then by impact
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    
    return b.impact - a.impact;
  });
}

export function formatTrafficNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export function calculateTrendPercentage(current: number, previous: number): {
  percentage: string;
  isPositive: boolean;
} {
  if (previous === 0) {
    return { percentage: '0%', isPositive: true };
  }
  
  const change = ((current - previous) / previous) * 100;
  const isPositive = change >= 0;
  const percentage = `${isPositive ? '+' : ''}${change.toFixed(1)}%`;
  
  return { percentage, isPositive };
}

export function generateSeoRecommendations(analysis: {
  technicalSeo: any;
  pageSpeed: number;
  keywords: any[];
  backlinks: number;
}): SeoRecommendation[] {
  const recommendations: SeoRecommendation[] = [];

  // Technical SEO recommendations
  if (!analysis.technicalSeo.mobileFriendly) {
    recommendations.push({
      id: 'mobile-friendly',
      title: 'Improve Mobile Responsiveness',
      description: 'Your website is not mobile-friendly. Ensure responsive design for better mobile user experience.',
      priority: 'high',
      category: 'technical',
      impact: 9
    });
  }

  if (!analysis.technicalSeo.httpsSecure) {
    recommendations.push({
      id: 'https-security',
      title: 'Enable HTTPS Security',
      description: 'Your website is not using HTTPS. Secure your site with SSL certificate for better SEO.',
      priority: 'high',
      category: 'technical',
      impact: 8
    });
  }

  if (!analysis.technicalSeo.xmlSitemap) {
    recommendations.push({
      id: 'xml-sitemap',
      title: 'Create XML Sitemap',
      description: 'Add an XML sitemap to help search engines discover and index your pages.',
      priority: 'medium',
      category: 'technical',
      impact: 7
    });
  }

  // Performance recommendations
  if (analysis.pageSpeed < 70) {
    recommendations.push({
      id: 'page-speed',
      title: 'Improve Page Loading Speed',
      description: 'Your page speed score is below optimal. Optimize images, minify CSS/JS, and improve server response time.',
      priority: 'high',
      category: 'performance',
      impact: 8
    });
  }

  // Content recommendations
  if (analysis.keywords.length < 10) {
    recommendations.push({
      id: 'keyword-research',
      title: 'Expand Keyword Strategy',
      description: 'Target more relevant keywords to increase your search visibility and organic traffic.',
      priority: 'medium',
      category: 'content',
      impact: 7
    });
  }

  // Link building recommendations
  if (analysis.backlinks < 50) {
    recommendations.push({
      id: 'build-backlinks',
      title: 'Build Quality Backlinks',
      description: 'Increase your domain authority by acquiring high-quality backlinks from reputable websites.',
      priority: 'medium',
      category: 'links',
      impact: 8
    });
  }

  return prioritizeRecommendations(recommendations);
}
