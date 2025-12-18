import { createI18n } from 'vue-i18n'
import pt from './locales/pt.json'
import en from './locales/en.json'
import fr from './locales/fr.json'
import ts from './locales/ts.json'
import ro from './locales/ro.json'

// Get saved language or default to Portuguese
const savedLanguage = localStorage.getItem('fmd_language') || 'pt'

export type MessageSchema = typeof pt

const i18n = createI18n<[MessageSchema], 'pt' | 'en' | 'fr' | 'ts' | 'ro'>({
  legacy: false,
  locale: savedLanguage,
  fallbackLocale: 'pt',
  messages: {
    pt,
    en,
    fr,
    ts,
    ro
  }
})

export default i18n

export const availableLocales = [
  { code: 'pt', name: 'Português', flag: '🇲🇿' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ts', name: 'Xitsonga', flag: '🇲🇿' },
  { code: 'ro', name: 'Ronga', flag: '🇲🇿' }
]

