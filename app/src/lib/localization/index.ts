import english from './en.json'
import japanese from './ja.json'
import {
  parseLanguagePack,
  resolveTranslation,
  formatTranslation,
} from './pack'

export type Language = 'ja' | 'en' | 'custom'
const storageKey = 'desktop-jp-language'
const customKey = 'desktop-jp-language-pack'
export const englishPack = new Map(Object.entries(english))
export const japanesePack = new Map(Object.entries(japanese))

/** Get the saved language choice; Japanese is the default. */
export function getLanguage(): Language {
  const value = localStorage.getItem(storageKey)
  return value === 'en' || value === 'custom' ? value : 'ja'
}

/** Read and validate a pack, falling back to English if saved data is damaged. */
export function getLanguagePack(
  language: Language
): ReadonlyMap<string, string> {
  if (language === 'ja') {
    return japanesePack
  }
  if (language === 'en') {
    return englishPack
  }
  try {
    return parseLanguagePack(localStorage.getItem(customKey) || '')
  } catch {
    return englishPack
  }
}

/** Save language settings independently of the other preferences. */
export function saveLanguage(language: Language, source?: string): void {
  if (source !== undefined) {
    parseLanguagePack(source)
    localStorage.setItem(customKey, source)
  }
  localStorage.setItem(storageKey, language)
}

// Apply at startup so an open dialog cannot change language halfway through.
const activePack = getLanguagePack(getLanguage())

/** Translate a UI label. Untranslated entries retain the original English. */
export function t(
  key: string,
  values: Readonly<Record<string, string | number>> = {}
): string {
  return formatTranslation(
    resolveTranslation(key, activePack, englishPack),
    values
  )
}

/** Return the startup menu translations for the native application menu. */
export function getMenuLanguagePack(): ReadonlyArray<
  readonly [string, string]
> {
  return Array.from(activePack).filter(([key]) => key.startsWith('menu.'))
}
