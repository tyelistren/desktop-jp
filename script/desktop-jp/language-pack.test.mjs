import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  parseLanguagePack,
  serializeLanguagePack,
  resolveTranslation,
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
