import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildGraph,
  defaultGraphSettings,
  parseGraphSettings,
} from '../../app/src/lib/branch-graph/layout.ts'
import {
  selectGraphLanes,
  assignGraphColors,
  compactGraph,
} from '../../app/src/lib/branch-graph/compact.ts'

const branch = (name, sha = name, ref = `refs/heads/${name}`) => ({
  name,
  sha,
  ref,
  shortName: name.split('/').at(-1),
})
const lane = b => ({ id: b.ref, branch: b, commits: [], fork: null })
const commit = (sha, parents = [], time = 1) => ({
  sha,
  parents,
  time,
  summary: sha,
})
const settings = overrides => ({ ...defaultGraphSettings, ...overrides })

test('defaults migrate old settings, validate branch limits, and preserve repo preferences', () => {
  assert.equal(parseGraphSettings(null).maxBranches, 3)
  assert.equal(parseGraphSettings('{"height":300}').height, 300)
  assert.equal(parseGraphSettings('{"height":300}').hideMerged, true)
  assert.equal(parseGraphSettings('{"maxBranches":1}').maxBranches, 2)
  assert.equal(parseGraphSettings('{"maxBranches":999}').maxBranches, 20)
  assert.equal(parseGraphSettings('{"maxBranches":"7"}').maxBranches, 3)
  assert.equal(
    parseGraphSettings('{"upstream":true,"colorSlots":{"x":2,"y":100}}')
      .colorSlots.x,
    2
  )
  assert.equal(
    parseGraphSettings('{"colorSlots":{"y":100}}').colorSlots.y,
    undefined
  )
})

test('current, major and recent unmerged rows win without duplicates; upstream hidden', () => {
  const list = [
    'main',
    'development',
    'current',
    'new',
    'old',
    'upstream/feature',
  ].map(name =>
    lane(
      branch(
        name,
        name,
        name.startsWith('upstream')
          ? `refs/remotes/${name}`
          : `refs/heads/${name}`
      )
    )
  )
  const times = new Map([
    ['new', 100],
    ['old', 50],
  ])
  const selected = selectGraphLanes(
    list,
    settings({}),
    'refs/heads/current',
    'refs/heads/main',
    new Set(),
    times,
    100
  )
  assert.deepEqual(
    selected.map(v => v.lane.branch.name),
    ['main', 'development', 'current']
  )
  const recent = selectGraphLanes(
    list,
    settings({ maxBranches: 4 }),
    'refs/heads/main',
    'refs/heads/main',
    new Set(),
    times,
    100
  )
  assert.deepEqual(
    recent.map(v => v.lane.branch.name),
    ['main', 'development', 'new', 'old']
  )
  assert.equal(new Set(recent.map(v => v.lane.id)).size, 4)
})

test('hide merged work, never hide an unmerged small branch; explicit selection restores it', () => {
  const list = ['main', 'fix', 'active', 'origin/old', 'upstream/work'].map(n =>
    lane(
      branch(n, n, n.includes('/') ? `refs/remotes/${n}` : `refs/heads/${n}`)
    )
  )
  const merged = new Set(['refs/heads/fix', 'refs/remotes/origin/old'])
  const selected = selectGraphLanes(
    list,
    settings({ maxBranches: 20 }),
    undefined,
    'refs/heads/main',
    merged,
    new Map(),
    0
  )
  assert.deepEqual(
    selected.map(v => v.lane.branch.name),
    ['main', 'active']
  )
  const shown = selectGraphLanes(
    list,
    settings({
      maxBranches: 3,
      overrides: { 'refs/remotes/upstream/work': true },
    }),
    'refs/heads/active',
    'refs/heads/main',
    merged,
    new Map(),
    0
  )
  assert.deepEqual(
    shown.map(v => v.lane.branch.name),
    ['main', 'active', 'upstream/work']
  )
  const detailed = selectGraphLanes(
    list,
    settings({ maxBranches: 20, hideMerged: false }),
    undefined,
    'refs/heads/main',
    merged,
    new Map(),
    0
  )
  assert.equal(detailed.length, 4)
})

test('colors remain stable when selection or row order changes; main owns blue', () => {
  const lanes = ['main', 'development', 'work'].map(n => lane(branch(n)))
  const colors = assignGraphColors(lanes, 'refs/heads/main', {})
  assert.equal(colors['refs/heads/main'], 0)
  assert.equal(colors['refs/heads/development'], 1)
  assert.equal(colors['refs/heads/work'], 2)
  assert.deepEqual(
    assignGraphColors([...lanes].reverse(), 'refs/heads/main', colors),
    colors
  )
  const next = assignGraphColors(
    [lanes[0], lanes[2], lane(branch('new'))],
    'refs/heads/main',
    colors
  )
  assert.equal(next['refs/heads/work'], 2)
  assert.equal(next['refs/heads/new'], 1)
})

test('a thousand linear commits become ten ordered points and real compressed paths', () => {
  const commits = Array.from({ length: 1000 }, (_, i) =>
    commit(String(999 - i), i === 999 ? [] : [String(998 - i)])
  )
  const graph = buildGraph(commits, [branch('main', '999')])
  const compact = compactGraph(graph.nodes, [
    { lane: graph.lanes[0], index: 0 },
  ])
  assert.equal(compact.nodes.length, 10)
  assert.equal(compact.omitted, 990)
  assert.equal(Math.max(...compact.nodes.map(n => n.column)), 9)
  assert.ok(compact.edges.some(e => e.skipped === 990))
  assert.ok(compact.nodes.some(n => n.commit.sha === '0'))
  assert.ok(compact.nodes.some(n => n.commit.sha === '999'))
})

test('visible split and merge junctions survive even a tiny point budget', () => {
  const graph = buildGraph(
    [commit('m', ['a', 'f']), commit('f', ['a']), commit('a')],
    [branch('main', 'm'), branch('work', 'f')]
  )
  const compact = compactGraph(
    graph.nodes,
    graph.lanes.map((lane, index) => ({ lane, index })),
    1
  )
  assert.equal(compact.nodes.length, 3)
  assert.ok(compact.edges.some(e => e.child === 'm' && e.parent === 'f'))
  assert.ok(compact.edges.some(e => e.child === 'f' && e.parent === 'a'))
  const columns = new Map(compact.nodes.map(n => [n.commit.sha, n.column]))
  assert.ok(
    compact.edges.every(
      e => e.parent === null || columns.get(e.parent) < columns.get(e.child)
    )
  )
})

test('hidden rows and missing parents get distinct boundaries, never fabricated joins', () => {
  const graph = buildGraph(
    [commit('m', ['a', 'f']), commit('f', ['outside']), commit('a')],
    [branch('main', 'm'), branch('work', 'f')]
  )
  const onlyMain = compactGraph(graph.nodes, [
    { lane: graph.lanes[0], index: 0 },
  ])
  assert.ok(
    onlyMain.edges.some(
      e => e.child === 'm' && e.boundary === 'hidden' && e.parent === null
    )
  )
  const onlyWork = compactGraph(graph.nodes, [
    { lane: graph.lanes[1], index: 1 },
  ])
  assert.ok(onlyWork.edges.some(e => e.boundary === 'outside'))
  assert.equal(
    onlyWork.edges.some(e => e.parent === 'a'),
    false
  )
})

test('tip shared with a hidden lane is still rendered on the visible branch', () => {
  const graph = buildGraph(
    [commit('a')],
    [branch('main', 'a'), branch('alias', 'a')]
  )
  const compact = compactGraph(graph.nodes, [
    { lane: graph.lanes[1], index: 1 },
  ])
  assert.equal(compact.nodes.length, 1)
  assert.equal(compact.nodes[0].lane, 1)
})
