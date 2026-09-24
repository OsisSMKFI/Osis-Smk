'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { t as translate } from '@/lib/translations';
import { useCallback } from 'react';

export const useTranslation = () => {
  const { language } = useLanguage();

  // Stable identity per language — prevents infinite effect loops in consumers
  const t = useCallback((key: string) => translate(key, language), [language]);

  return { t, language };
};
