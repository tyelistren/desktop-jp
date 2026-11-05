/** Preserve native menu access keys while treating translated ampersands literally. */
export function localizeMenuLabel(
  original: string,
  translated: string
): string {
  if (translated === original) {
    return original
  }
  const mnemonic = /(^|[^&])&([^&])/.exec(original)?.[2]
  return (
    translated.replace(/&/g, '&&') +
    (mnemonic === undefined ? '' : ` (&${mnemonic.toUpperCase()})`)
  )
}

/** Find a static menu translation, retaining original English for missing entries. */
export function translateStaticMenuLabel(
  original: string,
  translations: ReadonlyMap<string, string>,
  english: ReadonlyMap<string, string>
): string {
  const normalized = original.replace(/&/g, '').toLowerCase()
  for (const [key, value] of english) {
    if (key.startsWith('menu.label.') && value.toLowerCase() === normalized) {
      const translated = translations.get(key)
      return !translated || translated === value
        ? original
        : localizeMenuLabel(original, translated)
    }
  }
  return original
}
