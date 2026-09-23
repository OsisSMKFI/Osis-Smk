'use client';

import { useEffect, useState } from 'react';

/**
 * GlobalDesignLoader - Loads ALL design overrides from database and injects them globally
 * This component enables AI to redesign ANY element on ANY page
 */
export default function GlobalDesignLoader() {
    const [designCSS, setDesignCSS] = useState<string>('');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadAllDesigns = async () => {
            try {
                // Fetch all design overrides from database
                const response = await fetch('/api/design/load-all', {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.css) {
                        setDesignCSS(data.css);
                    }
                }
            } catch (error) {
                console.error('Failed to load global designs:', error);
            } finally {
                setIsLoaded(true);
            }
        };

        loadAllDesigns();

        // Listen for design update events (immediate reload)
        const handleDesignUpdate = () => {
            loadAllDesigns();
        };

        window.addEventListener('design-updated', handleDesignUpdate);

        // Poll for updates every 5 minutes (admin/AI can trigger immediate reload via event)
        const interval = setInterval(loadAllDesigns, 300000);

        return () => {
            window.removeEventListener('design-updated', handleDesignUpdate);
            clearInterval(interval);
        };
    }, []);

    // Trigger design reload function - can be called from anywhere
    useEffect(() => {
        (window as any).reloadDesigns = () => {
            window.dispatchEvent(new CustomEvent('design-updated'));
        };
    }, []);

    if (!designCSS) return null;

    return (
        <style
            id="global-ai-design-overrides"
            dangerouslySetInnerHTML={{ 
                __html: `
/* ========================================
   AI DESIGN OVERRIDES - AUTO-GENERATED
   Do not edit manually - Use AI chat to modify
   ======================================== */
${designCSS}
/* ======================================== */
                ` 
            }}
        />
    );
}
