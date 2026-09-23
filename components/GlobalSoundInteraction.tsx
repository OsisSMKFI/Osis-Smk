'use client';

import { useEffect } from 'react';
import { useSoundEffects } from '@/contexts/SoundContext';

/**
 * GlobalSoundInteraction
 * Sound only when the user enables the toggle. Cheap interactive checks only
 * (no getComputedStyle / deep DOM walks on every click).
 */
export default function GlobalSoundInteraction() {
  const { soundEnabled, playClickSound } = useSoundEffects();

  useEffect(() => {
    if (!soundEnabled) return;

    let last = 0;

    const isInteractive = (el: HTMLElement | null): boolean => {
      let current = el;
      let depth = 0;
      while (current && depth < 4) {
        const tag = current.tagName?.toLowerCase() || '';
        if (
          tag === 'button' ||
          tag === 'a' ||
          tag === 'input' ||
          tag === 'select' ||
          tag === 'textarea' ||
          tag === 'label' ||
          tag === 'summary' ||
          tag === 'details'
        ) {
          return true;
        }
        if (
          current.getAttribute('role') === 'button' ||
          current.getAttribute('role') === 'link' ||
          current.hasAttribute('data-clickable') ||
          current.hasAttribute('data-interactive') ||
          current.hasAttribute('data-action')
        ) {
          return true;
        }
        const className =
          (typeof current.className === 'string' ? current.className : '') || '';
        if (className && /btn|button|nav-link|toggle|switch/i.test(className)) {
          return true;
        }
        current = current.parentElement;
        depth += 1;
      }
      return false;
    };

    const handleClick = (e: Event) => {
      const now = Date.now();
      if (now - last < 150) return;
      const target = (e.target || e.currentTarget) as HTMLElement;
      if (!target) return;
      if (isInteractive(target)) {
        last = now;
        playClickSound();
      }
    };

    document.addEventListener('click', handleClick, { capture: true, passive: true });
    return () => {
      document.removeEventListener('click', handleClick, { capture: true } as EventListenerOptions);
    };
  }, [soundEnabled, playClickSound]);

  return null;
}
