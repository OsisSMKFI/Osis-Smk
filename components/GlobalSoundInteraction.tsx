'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useSoundEffects } from '@/contexts/SoundContext';

/**
 * GlobalSoundInteraction
 * 
 * Komponen ini menambahkan sound effects ke semua elemen interaktif di halaman.
 * Sound effects akan aktif jika user mengaktifkan toggle sound.
 */
export default function GlobalSoundInteraction() {
  const { soundEnabled, playClickSound } = useSoundEffects();
  const lastClickTimeRef = useRef(0);

  const isInteractiveElement = useCallback((element: HTMLElement): boolean => {
    if (!element) return false;
    
    const tagName = element.tagName?.toLowerCase() || '';
    const role = element.getAttribute('role');
    const className = (typeof element.className === 'string' ? element.className : '') || '';
    const tabIndex = element.getAttribute('tabindex');
    
    // Check tag names - include more elements
    if (['button', 'a', 'input', 'select', 'textarea', 'label', 'summary', 'details'].includes(tagName)) {
      return true;
    }
    
    // Check roles
    if (['button', 'link', 'tab', 'menuitem', 'option', 'switch', 'checkbox', 'radio', 'menuitemcheckbox', 'menuitemradio', 'treeitem', 'gridcell'].includes(role || '')) {
      return true;
    }
    
    // Check if element has event handlers
    if (element.onclick || element.onmousedown || element.onmouseup || element.ontouchstart) {
      return true;
    }
    
    // Check data attributes that indicate interactivity
    if (element.hasAttribute('data-clickable') || element.hasAttribute('data-interactive') || element.hasAttribute('data-action')) {
      return true;
    }
    
    // Check classes - extended list
    if (/btn|button|card|link|nav|menu|tab|click|interactive|clickable|toggle|switch|action|trigger|item|option/i.test(className)) {
      return true;
    }
    
    // Check tabindex
    if (tabIndex !== null && tabIndex !== '-1') {
      return true;
    }
    
    // Check cursor style (only if element is visible)
    try {
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.cursor === 'pointer') {
        return true;
      }
    } catch {}
    
    return false;
  }, []);

  // Find the closest interactive parent with increased depth
  const findInteractiveParent = useCallback((element: HTMLElement | null): HTMLElement | null => {
    let current = element;
    let depth = 0;
    const maxDepth = 8; // Increased depth
    
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
    
    const clickDebounce = 150; // ms

    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      const now = Date.now();
      if (now - lastClickTimeRef.current < clickDebounce) return;
      
      const target = (e.target || e.currentTarget) as HTMLElement;
      if (!target) return;
      
      const interactive = findInteractiveParent(target);
      if (interactive) {
        lastClickTimeRef.current = now;
        playClickSound();
      }
    };

    // Use both click and mousedown for better coverage
    document.addEventListener('click', handleGlobalClick, { capture: true, passive: true });
    document.addEventListener('touchend', handleGlobalClick, { capture: true, passive: true });

    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true } as EventListenerOptions);
      document.removeEventListener('touchend', handleGlobalClick, { capture: true } as EventListenerOptions);
    };
  }, [soundEnabled, playClickSound, findInteractiveParent]);

  return null;
}
