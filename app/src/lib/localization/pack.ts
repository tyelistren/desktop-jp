/** Parse editable UTF-8 language packs without interpreting executable content. */
export function parseLanguagePack(source: string): ReadonlyMap<string, string> {
  const result = new Map<string, string>()
  source
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .forEach((line, index) => {
      if (line.trim() === '' || /^\s*[#;]/.test(line)) {
        return
      }
      const separator = line.indexOf('=')
      const key = line.slice(0, separator).trim()
      if (separator < 1 || !/^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(key)) {
        throw new Error(
          `Line ${index + 1}: expected key=value / キー=訳文を指定してください`
        )
      }
      if (result.has(key)) {
        throw new Error(
          `Line ${index + 1}: duplicate key / キーが重複しています: ${key}`
        )
      }
      const value = line.slice(separator + 1)
      result.set(
        key,
        value.replace(/\\(n|\\)/g, (_, escape: string) =>
          escape === 'n' ? '\n' : '\\'
        )
      )
    })
  return result
}

/** Serialize a pack with reversible newline and backslash escaping. */
export function serializeLanguagePack(
  entries: ReadonlyMap<string, string>
): string {
  return (
    '# Desktop JP language pack (UTF-8)\n' +
    Array.from(
      entries,
      ([key, value]) =>
        `${key}=${value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n')}`
    ).join('\n') +
    '\n'
  )
}

/** Resolve missing or empty translations against English. */
export function resolveTranslation(
  key: string,
  pack: ReadonlyMap<string, string>,
  english: ReadonlyMap<string, string>
): string {
  return pack.get(key) || english.get(key) || key
}
