'use client';

import { useEffect, useState } from 'react';

interface DesignOverride {
  id: string;
  component: string;
  css_code: string;
  styles: Record<string, string>;
  preset: string;
  is_active: boolean;
}

const POLL_MS = 600000;

/**
 * Single client that loads both design sources and injects CSS once:
 * - /api/design/load-all → page_content design_override_* (AI design studio CSS)
 * - /api/admin/design/apply → design_overrides table (admin apply panel)
 * One poll interval + shared design-updated listener (was two components, two timers).
 */
export default function DesignThemeLoader() {
  const [pageCss, setPageCss] = useState('');
  const [designs, setDesigns] = useState<DesignOverride[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [allRes, applyRes] = await Promise.all([
          fetch('/api/design/load-all').catch(() => null),
          fetch('/api/admin/design/apply').catch(() => null),
        ]);

        if (cancelled) return;

        if (allRes?.ok) {
          const data = await allRes.json();
          if (typeof data.css === 'string') setPageCss(data.css);
        }

        if (applyRes?.ok) {
          const data = await applyRes.json();
          if (Array.isArray(data.designs)) setDesigns(data.designs);
        }
      } catch {
        // silent — design overrides are optional
      }
    };

    load();

    const onUpdate = () => load();
    window.addEventListener('design-updated', onUpdate);
    const interval = window.setInterval(load, POLL_MS);

    (window as unknown as { reloadDesigns?: () => void }).reloadDesigns = () => {
      window.dispatchEvent(new CustomEvent('design-updated'));
    };

    return () => {
      cancelled = true;
      window.removeEventListener('design-updated', onUpdate);
      window.clearInterval(interval);
    };
  }, []);

  const active = designs.filter((d) => d.is_active);
  const combined =
    active
      .map(
        (d) =>
          `/* Design override for: ${d.component} (${d.preset}) */\n${d.css_code}`
      )
      .join('\n\n') || '';
  const cssVars = active
    .map((d) =>
      d.styles?.primaryColor
        ? `--dynamic-${d.component}-primary: ${d.styles.primaryColor};`
        : ''
    )
    .filter(Boolean)
    .join('\n        ');

  const html = [
    pageCss
      ? `/* ========================================
   AI DESIGN OVERRIDES - AUTO-GENERATED
   Do not edit manually - Use AI chat to modify
   ======================================== */
${pageCss}
/* ======================================== */`
      : '',
    combined,
    cssVars ? `:root {\n        ${cssVars}\n      }` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  if (!html) return null;

  return (
    <style
      id="global-ai-design-overrides"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Export hook for components to check if they have custom styles
export function useDesignOverride(component: string) {
  const [override, setOverride] = useState<DesignOverride | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadOverride = async () => {
      try {
        const res = await fetch(`/api/admin/design/apply?component=${component}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.designs) && data.designs.length > 0) {
          setOverride(data.designs[0]);
        }
      } catch {
        // no override
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadOverride();
    return () => {
      cancelled = true;
    };
  }, [component]);

  return { override, loading };
}
