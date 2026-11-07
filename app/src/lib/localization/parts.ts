/** Split a template into text and supplied values without interpreting markup. */
export function formatTranslationParts<T>(
  template: string,
  values: Readonly<Record<string, T>>
): ReadonlyArray<string | T> {
  return template.split(/(\{[a-zA-Z][a-zA-Z0-9_]*\})/g).map(part => {
    const key = part.slice(1, -1)
    return part.startsWith('{') &&
      Object.prototype.hasOwnProperty.call(values, key)
      ? values[key]
      : part
  })
}
