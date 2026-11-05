import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  localizeMenuLabel,
  translateStaticMenuLabel,
} from '../../app/src/lib/localization/menu.ts'
import { formatTranslation } from '../../app/src/lib/localization/pack.ts'
const read = lang =>
  new Map(
    Object.entries(
      JSON.parse(
        readFileSync(
          new URL(
            `../../app/src/lib/localization/${lang}.json`,
            import.meta.url
          ),
          'utf8'
        )
      )
    )
  )
const en = read('en')
const ja = read('ja')
test('menu labels preserve Windows access keys and macOS labels', () => {
  assert.equal(translateStaticMenuLabel('&File', ja, en), 'ファイル (&F)')
  assert.equal(translateStaticMenuLabel('File', ja, en), 'ファイル')
  assert.equal(
    translateStaticMenuLabel('Force P&ush…', ja, en),
    '強制送信（Force push）… (&U)'
  )
  assert.equal(
    translateStaticMenuLabel('Force P&ush', ja, en),
    '強制送信（Force push） (&U)'
  )
})
test('English, absent and empty custom menu entries retain original labels', () => {
  for (const label of [
    '&File',
    'New &repository…',
    'Force P&ush…',
    'Unknown item',
  ]) {
    assert.equal(translateStaticMenuLabel(label, en, en), label)
    assert.equal(translateStaticMenuLabel(label, new Map(), en), label)
  }
  assert.equal(
    translateStaticMenuLabel('&File', new Map([['menu.label.file', '']]), en),
    '&File'
  )
  assert.equal(
    translateStaticMenuLabel(
      '&File',
      new Map([['menu.label.file', '自分のメニュー']]),
      en
    ),
    '自分のメニュー (&F)'
  )
})
test('dynamic names and translated ampersands remain literal', () => {
  const name = 'feature/A&B{other}$&'
  const label = formatTranslation(ja.get('menu.updateFrom'), { name })
  assert.equal(
    localizeMenuLabel('&Update from main', label),
    'feature/A&&B{other}$&&から更新 (&U)'
  )
  assert.equal(localizeMenuLabel('Open in Editor', 'A&Bで開く'), 'A&&Bで開く')
})
