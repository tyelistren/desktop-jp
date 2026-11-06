import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatTranslationParts } from '../../app/src/lib/localization/parts.ts'

test('rich translations reorder controls without converting them to text', () => {
  const source = { kind: 'link', onClick: () => {} }
  const target = { kind: 'strong', value: 'main' }
  const parts = formatTranslationParts('{target} に {source} をマージ', {
    source,
    target,
  })
  assert.deepEqual(parts, ['', target, ' に ', source, ' をマージ'])
  assert.equal(parts[1], target)
  assert.equal(parts[3], source)
})

test('rich translations keep untrusted text literal and preserve unknown tokens', () => {
  assert.deepEqual(
    formatTranslationParts('{branch} {missing} {constructor}', {
      branch: '<script>{missing}$&</script>',
    }),
    [
      '',
      '<script>{missing}$&</script>',
      ' ',
      '{missing}',
      ' ',
      '{constructor}',
      '',
    ]
  )
})

test('rich translations preserve false, zero, repeated and adjacent slots', () => {
  assert.deepEqual(formatTranslationParts('{a}{b}{a}', { a: 0, b: false }), [
    '',
    0,
    '',
    false,
    '',
    0,
    '',
  ])
  assert.deepEqual(formatTranslationParts('変更なし', {}), ['変更なし'])
})
