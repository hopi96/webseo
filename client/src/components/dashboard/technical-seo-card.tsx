import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Shield, FileText, Bot, CheckCircle, AlertTriangle } from "lucide-react";

interface TechnicalSeo {
  mobileFriendly: boolean;
  httpsSecure: boolean;
  xmlSitemap: boolean;
  robotsTxt: boolean;
}

interface TechnicalSeoCardProps {
  technicalSeo: TechnicalSeo;
}

export function TechnicalSeoCard({ technicalSeo }: TechnicalSeoCardProps) {
  const checks = [
    {
      key: 'mobileFriendly',
      icon: Smartphone,
      label: 'Mobile Friendly',
      status: technicalSeo.mobileFriendly
    },
    {
      key: 'httpsSecure',
      icon: Shield,
      label: 'HTTPS Secure',
      status: technicalSeo.httpsSecure
    },
    {
      key: 'xmlSitemap',
      icon: FileText,
      label: 'XML Sitemap',
      status: technicalSeo.xmlSitemap
    },
    {
      key: 'robotsTxt',
      icon: Bot,
      label: 'Robots.txt',
      status: technicalSeo.robotsTxt
    }
  ];

  return (
    <div className="px-4 pb-8">
      <Card className="bg-white dark:bg-dark-surface shadow-sm border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Technical SEO Health
          </h3>
          
          <div className="space-y-4">
            {checks.map((check) => (
              <div key={check.key} className="flex items-center justify-between">
                <div className="flex items-center">
                  <check.icon className={`mr-3 w-5 h-5 ${check.status ? 'text-seo-success' : 'text-seo-warning'}`} />
                  <span className="text-gray-900 dark:text-white">{check.label}</span>
                </div>
                <div className="flex items-center">
                  <span className={`font-medium mr-2 ${check.status ? 'text-seo-success' : 'text-seo-warning'}`}>
                    {check.status ? 'Passed' : 'Warning'}
                  </span>
                  {check.status ? (
                    <CheckCircle className="text-seo-success w-5 h-5" />
                  ) : (
                    <AlertTriangle className="text-seo-warning w-5 h-5" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
