'use client';

import React, { useEffect } from 'react';

interface SmoothScrollProps {
  children: React.ReactNode;
}

const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
  useEffect(() => {
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleSmoothScroll = (e: Event) => {
      const target = e.target as HTMLAnchorElement;

      if (target.tagName === 'A' && target.hash) {
        e.preventDefault();

        const targetElement = document.querySelector(target.hash);
        if (targetElement) {
          const headerOffset = 80;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          if (!reduceMotion) {
            targetElement.classList.add('animate-pulse');
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth',
            });
            setTimeout(() => {
              targetElement.classList.remove('animate-pulse');
              targetElement.classList.add('animate-fade-in-up');
              setTimeout(() => {
                targetElement.classList.remove('animate-fade-in-up');
              }, 800);
            }, 500);
          } else {
            window.scrollTo({ top: offsetPosition, behavior: 'auto' });
          }
        }
      }
    };

    let observer: IntersectionObserver | null = null;

    if (!reduceMotion) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate-fade-in-up');
              entry.target.classList.remove('opacity-0', 'translate-y-8');
              observer?.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
      );

      document.querySelectorAll('.scroll-reveal').forEach((el) => {
        el.classList.add('opacity-0', 'translate-y-8', 'transition-all', 'duration-700');
        observer?.observe(el);
      });
    }

    document.addEventListener('click', handleSmoothScroll);

    return () => {
      document.removeEventListener('click', handleSmoothScroll);
      observer?.disconnect();
    };
  }, []);

  return <>{children}</>;
};

export default SmoothScroll;
