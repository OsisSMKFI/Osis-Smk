'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * ScrollToTopOnNavigation
 * 
 * This component scrolls to the top of the page when the route changes.
 * It ensures users always start at the top when navigating to a new page.
 */
export default function ScrollToTopOnNavigation() {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll to top immediately when pathname changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Use instant for immediate scroll on navigation
    });
    
    // Also reset scroll position on document
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}
