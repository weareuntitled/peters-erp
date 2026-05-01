import { useState, useEffect } from 'react';
import { format as formatDate } from 'date-fns';
import { de } from 'date-fns/locale';
import deTranslations from '../locales/de.json';

// Define the translations type based on our JSON structure
type Translations = typeof deTranslations;

// Helper function to get a nested value from the translations object
// e.g., getValue(translations, 'common.save') => 'Speichern'
function getValue(obj: any, path: string): string {
  const keys = path.split('.');
  return keys.reduce((acc, key) => acc?.[key], obj) as string;
}

// Format currency in German style: 1.234,56 €
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

// Format date in German style: DD.MM.YYYY
export function formatDateDe(date: Date | string, formatStr: string = 'dd.MM.yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDate(dateObj, formatStr, { locale: de });
}

export function useTranslation() {
  // Currently we only support German, but this could be extended to support other languages
  const [translations] = useState<Translations>(deTranslations);

  // Simple translation function
  const t = (key: string, replacements?: Record<string, string | number>): string => {
    try {
      let text = getValue(translations, key) || key;
      
      // Replace all placeholders in the format {{key}}
      if (replacements) {
        Object.entries(replacements).forEach(([k, v]) => {
          text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
        });
      }
      
      return text;
    } catch (error) {
      console.error(`Translation key not found: ${key}`, error);
      return key;
    }
  };

  return {
    t,
    formatCurrency,
    formatDate: formatDateDe,
  };
}

export default useTranslation;