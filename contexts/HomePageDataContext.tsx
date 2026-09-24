'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useHomePageData, HomePageData, Post, Announcement, Poll } from '@/lib/homePageData';

interface HomePageContextType extends HomePageData {
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const HomePageContext = createContext<HomePageContextType | null>(null);

export function HomePageDataProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: HomePageData;
}) {
  const data = useHomePageData(initial);

  return (
    <HomePageContext.Provider value={data}>
      {children}
    </HomePageContext.Provider>
  );
}

export function useHomePageContext(): HomePageContextType {
  const context = useContext(HomePageContext);
  if (!context) {
    // Return default values if used outside provider (for SSR compatibility)
    return {
      posts: [],
      announcements: [],
      polls: [],
      loading: true,
      error: null,
      refresh: async () => {},
    };
  }
  return context;
}

// Re-export types for convenience
export type { Post, Announcement, Poll };
