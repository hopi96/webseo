import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Site {
    id: number;
    name: string;
    url: string;
    seoAnalysis?: any;
    socialParams?: any;
    programmeRs?: string;
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

function readStoredSiteId(): number | null {
    const saved = localStorage.getItem('selectedWebsiteId');
    if (!saved) return null;

    const parsed = Number.parseInt(saved, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        localStorage.removeItem('selectedWebsiteId');
        return null;
    }

    return parsed;
}

export function SiteProvider({ children }: { children: ReactNode }) {
    const [selectedSiteId, setSelectedSiteIdState] = useState<number | null>(() => readStoredSiteId());

    // Fetch all sites
    const { data: rawSites, isLoading } = useQuery<Site[]>({
        queryKey: ['/api/sites'],
        refetchInterval: 30000,
        refetchOnWindowFocus: true,
    });
    const sites = Array.isArray(rawSites) ? rawSites : [];

    // Persist selection to localStorage
    const setSelectedSiteId = (id: number) => {
        if (!Number.isFinite(id) || id <= 0) return;
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

    useEffect(() => {
        if (!isLoading && sites.length === 0 && selectedSiteId !== null) {
            setSelectedSiteIdState(null);
            localStorage.removeItem('selectedWebsiteId');
        }
    }, [sites, isLoading, selectedSiteId]);

    const currentSite = selectedSiteId ? sites.find(s => s.id === selectedSiteId) : undefined;

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
