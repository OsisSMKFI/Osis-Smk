'use client';

import { useEffect, useCallback } from 'react';
import { useSoundEffects } from '@/contexts/SoundContext';

/**
 * GlobalSoundInteraction
 * 
 * Komponen ini menambahkan sound effects ke semua elemen interaktif di halaman.
 * Sound effects akan aktif jika user mengaktifkan toggle sound.
 * 
 * Elemen yang mendapat sound:
 * - button, a (link), input, select, textarea
 * - Elemen dengan role="button", role="link", role="tab", role="menuitem"
 * - Elemen dengan class yang mengandung "btn", "button", "card", "link"
 * - Elemen dengan tabindex
 */
export default function GlobalSoundInteraction() {
  const { soundEnabled, playClickSound, playHoverSound } = useSoundEffects();

  const isInteractiveElement = useCallback((element: HTMLElement): boolean => {
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute('role');
    const className = element.className?.toString() || '';
    const tabIndex = element.getAttribute('tabindex');
    
    // Check tag names
    if (['button', 'a', 'input', 'select', 'textarea', 'label'].includes(tagName)) {
      return true;
    }
    
    // Check roles
    if (['button', 'link', 'tab', 'menuitem', 'option', 'switch', 'checkbox', 'radio'].includes(role || '')) {
      return true;
    }
    
    // Check if has onclick or is clickable
    if (element.onclick || element.hasAttribute('onclick')) {
      return true;
    }
    
    // Check classes
    if (/btn|button|card|link|nav|menu|tab|click|interactive/i.test(className)) {
      return true;
    }
    
    // Check tabindex
    if (tabIndex !== null && tabIndex !== '-1') {
      return true;
    }
    
    // Check cursor style
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.cursor === 'pointer') {
      return true;
    }
    
    return false;
  }, []);

  // Find the closest interactive parent
  const findInteractiveParent = useCallback((element: HTMLElement | null): HTMLElement | null => {
    let current = element;
    let depth = 0;
    const maxDepth = 5;
    
    while (current && depth < maxDepth) {
      if (isInteractiveElement(current)) {
        return current;
      }
      current = current.parentElement;
      depth++;
    }
    return null;
  }, [isInteractiveElement]);

  useEffect(() => {
    if (!soundEnabled) return;

    const processedClicks = new WeakSet<HTMLElement>();
    
    // Much longer debounce for click sound - only important clicks
    let lastClickTime = 0;
    const clickDebounce = 200; // ms - prevent rapid click sounds

    const handleGlobalClick = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastClickTime < clickDebounce) return;
      
      const target = e.target as HTMLElement;
      const interactive = findInteractiveParent(target);
      if (interactive && !processedClicks.has(interactive)) {
        processedClicks.add(interactive);
        lastClickTime = now;
        playClickSound();
        
        // Remove from processed after a delay
        setTimeout(() => {
          processedClicks.delete(interactive);
        }, 300);
      }
    };

    // Disable global hover sound - too noisy
    // Hover sounds only on explicit onMouseEnter handlers in components

    // Use capture phase to ensure we catch events before they're stopped
    document.addEventListener('click', handleGlobalClick, { capture: true, passive: true });

    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true } as EventListenerOptions);
    };
  }, [soundEnabled, playClickSound, findInteractiveParent]);

  return null;
}
