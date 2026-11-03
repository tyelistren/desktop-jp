import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import {
  parseLanguagePack,
  serializeLanguagePack,
  resolveTranslation,
  formatTranslation,
} from '../../app/src/lib/localization/pack.ts'

test('BOM, Windows newlines, comments, equals and Japanese', () => {
  const pack = parseLanguagePack(
    '\uFEFF# comment\r\n; comment\r\na=日本語=x\r\nb=second\r\n'
  )
  assert.equal(pack.get('a'), '日本語=x')
  assert.equal(pack.get('b'), 'second')
})
test('malformed and duplicate entries report their line', () => {
  assert.throws(() => parseLanguagePack('# comment\nbroken'), /Line 2/)
  assert.throws(() => parseLanguagePack('a=one\na=two'), /Line 2.*duplicate/)
})
test('round trip preserves multiline and literal backslashes', () => {
  const pack = new Map([
    ['text', 'first\nsecond = value\\n C:\\test'],
    ['space', ' leading trailing '],
  ])
  assert.deepEqual(parseLanguagePack(serializeLanguagePack(pack)), pack)
})
test('missing and empty translations fall back to English', () => {
  const en = new Map([['save', 'Save']])
  assert.equal(resolveTranslation('save', new Map(), en), 'Save')
  assert.equal(resolveTranslation('save', new Map([['save', '']]), en), 'Save')
  assert.equal(resolveTranslation('unknown', new Map(), en), 'unknown')
})
test('prototype-like keys are inert data', () => {
  assert.equal(parseLanguagePack('constructor=表示').get('constructor'), '表示')
  assert.equal({}.polluted, undefined)
})
test('shipped editable packs match bundled dictionaries', () => {
  for (const lang of ['en', 'ja']) {
    const dictionary = JSON.parse(
      readFileSync(
        new URL(`../../app/src/lib/localization/${lang}.json`, import.meta.url),
        'utf8'
      )
    )
    const editable = parseLanguagePack(
      readFileSync(
        new URL(`../../app/static/locales/${lang}.ini`, import.meta.url),
        'utf8'
      )
    )
    assert.deepEqual(Object.fromEntries(editable), dictionary)
  }
})

test('Japanese and English dictionaries cover every static UI translation key', () => {
  const en = JSON.parse(
    readFileSync(
      new URL('../../app/src/lib/localization/en.json', import.meta.url),
      'utf8'
    )
  )
  const ja = JSON.parse(
    readFileSync(
      new URL('../../app/src/lib/localization/ja.json', import.meta.url),
      'utf8'
    )
  )
  assert.deepEqual(Object.keys(ja).sort(), Object.keys(en).sort())
  for (const file of readdirSync(
    new URL('../../app/src/ui/', import.meta.url),
    { recursive: true }
  )) {
    if (!file.endsWith('.tsx')) continue
    const source = readFileSync(
      new URL(`../../app/src/ui/${file}`, import.meta.url),
      'utf8'
    )
    for (const match of source.matchAll(/\bt\('([^']+)'/g)) {
      assert.ok(en[match[1]], `${file}: missing English key ${match[1]}`)
      assert.ok(ja[match[1]], `${file}: missing Japanese key ${match[1]}`)
    }
  }
})

test('interpolation preserves user values and never substitutes them twice', () => {
  assert.equal(
    formatTranslation('{branch} に {count} 件', {
      branch: 'feature/$&{count}<tag>',
      count: 2,
    }),
    'feature/$&{count}<tag> に 2 件'
  )
  assert.equal(
    formatTranslation('{missing} {branch} {branch}', { branch: '日本語' }),
    '{missing} 日本語 日本語'
  )
  assert.equal(formatTranslation('{constructor}', {}), '{constructor}')
})

test('translated templates preserve the English placeholder names', () => {
  const en = JSON.parse(
    readFileSync(
      new URL('../../app/src/lib/localization/en.json', import.meta.url),
      'utf8'
    )
  )
  const ja = JSON.parse(
    readFileSync(
      new URL('../../app/src/lib/localization/ja.json', import.meta.url),
      'utf8'
    )
  )
  const placeholders = text =>
    [...new Set(text.match(/\{[a-zA-Z][a-zA-Z0-9_]*\}/g) || [])].sort()
  for (const key of Object.keys(en))
    assert.deepEqual(placeholders(ja[key]), placeholders(en[key]), key)
})
