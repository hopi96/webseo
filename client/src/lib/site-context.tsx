import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Site {
    id: number;
    name: string;
    url: string;
    seoAnalysis?: any;
    socialParams?: any;
    createdAt?: string;
}

interface SiteContextType {
    selectedSiteId: number | null;
    setSelectedSiteId: (id: number) => void;
    currentSite: Site | undefined;
    sites: Site[];
    isLoading: boolean;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export function SiteProvider({ children }: { children: ReactNode }) {
    const [selectedSiteId, setSelectedSiteIdState] = useState<number | null>(() => {
        const saved = localStorage.getItem('selectedWebsiteId');
        return saved ? parseInt(saved) : null;
    });

    // Fetch all sites
    const { data: sites = [], isLoading } = useQuery<Site[]>({
        queryKey: ['/api/sites'],
        refetchInterval: 30000,
        refetchOnWindowFocus: true,
    });

    // Persist selection to localStorage
    const setSelectedSiteId = (id: number) => {
        setSelectedSiteIdState(id);
        localStorage.setItem('selectedWebsiteId', id.toString());
    };

    // Auto-select first site if none selected
    useEffect(() => {
        if (!isLoading && sites.length > 0) {
            if (!selectedSiteId || !sites.find(s => s.id === selectedSiteId)) {
                // Sort by ID descending to get the most recent
                const sortedSites = [...sites].sort((a, b) => b.id - a.id);
                setSelectedSiteId(sortedSites[0].id);
            }
        }
    }, [sites, isLoading, selectedSiteId]);

    const currentSite = sites.find(s => s.id === selectedSiteId);

    return (
        <SiteContext.Provider value={{
            selectedSiteId,
            setSelectedSiteId,
            currentSite,
            sites,
            isLoading
        }}>
            {children}
        </SiteContext.Provider>
    );
}

export function useSite() {
    const context = useContext(SiteContext);
    if (context === undefined) {
        throw new Error('useSite must be used within a SiteProvider');
    }
    return context;
}
