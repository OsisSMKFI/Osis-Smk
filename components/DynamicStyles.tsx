'use client';

import { useEffect, useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 DYNAMIC STYLES LOADER - Premium v5.0
// ═══════════════════════════════════════════════════════════════════════════════
// Loads design overrides from database and applies them dynamically
// Enables Super Admin to redesign components in realtime
// ═══════════════════════════════════════════════════════════════════════════════

interface DesignOverride {
  id: string;
  component: string;
  css_code: string;
  styles: Record<string, string>;
  preset: string;
  is_active: boolean;
}

export default function DynamicStyles() {
  const [designs, setDesigns] = useState<DesignOverride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDesigns = async () => {
      try {
        const res = await fetch('/api/admin/design/apply');
        if (res.ok) {
          const data = await res.json();
          setDesigns(data.designs || []);
        }
      } catch (error) {
        console.log('[DynamicStyles] No custom designs loaded');
      } finally {
        setLoading(false);
      }
    };

    loadDesigns();

    // Refresh designs every 5 minutes (admin can trigger immediate reload via design-updated event)
    const interval = setInterval(loadDesigns, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading || designs.length === 0) {
    return null;
  }

  // Combine all CSS from active designs
  const combinedCSS = designs
    .filter(d => d.is_active)
    .map(d => `/* Design override for: ${d.component} (${d.preset}) */\n${d.css_code}`)
    .join('\n\n');

  return (
    <style jsx global>{`
      ${combinedCSS}
      
      /* Dynamic design system variables */
      :root {
        ${designs.map(d => {
          if (d.styles?.primaryColor) {
            return `--dynamic-${d.component}-primary: ${d.styles.primaryColor};`;
          }
          return '';
        }).join('\n        ')}
      }
    `}</style>
  );
}

// Export hook for components to check if they have custom styles
export function useDesignOverride(component: string) {
  const [override, setOverride] = useState<DesignOverride | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverride = async () => {
      try {
        const res = await fetch(`/api/admin/design/apply?component=${component}`);
        if (res.ok) {
          const data = await res.json();
          if (data.designs && data.designs.length > 0) {
            setOverride(data.designs[0]);
          }
        }
      } catch (error) {
        console.log(`[useDesignOverride] No override for ${component}`);
      } finally {
        setLoading(false);
      }
    };

    loadOverride();
  }, [component]);

  return { override, loading };
}
