import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import {
  buildGraph,
  orderGraphCommits,
  parseGraphSettings,
} from '../../app/src/lib/branch-graph/layout.ts'

const c = (sha, parents = [], time = 1) => ({
  sha,
  parents,
  time,
  summary: sha,
})
const b = (name, sha) => ({ name, sha, ref: `refs/heads/${name}` })

test('main first, development second; split and two-parent merge retain actual edges', () => {
  const commits = [c('m', ['a', 'f'], 4), c('f', ['a'], 3), c('a', [], 2)]
  const graph = buildGraph(commits, [
    b('feature', 'f'),
    b('development', 'a'),
    b('main', 'm'),
  ])
  assert.deepEqual(
    graph.lanes.slice(0, 3).map(l => l.branch.name),
    ['main', 'development', 'feature']
  )
  assert.deepEqual(
    graph.lanes[0].commits.map(c => c.sha),
    ['m', 'a']
  )
  assert.deepEqual(
    graph.lanes[2].commits.map(c => c.sha),
    ['f']
  )
  assert.equal(graph.lanes[2].fork, 'a')
  assert.deepEqual(graph.nodes.find(n => n.commit.sha === 'm').commit.parents, [
    'a',
    'f',
  ])
})

test('deleted refs leave anonymous real histories, never invented branch names', () => {
  const graph = buildGraph(
    [c('m', ['a', 'f']), c('f', ['a']), c('a')],
    [b('main', 'm')]
  )
  assert.equal(graph.lanes[1].branch, null)
  assert.equal(graph.lanes[1].commits[0].sha, 'f')
})

test('squash merge and shared tips do not invent ancestry; empty/unborn repositories work', () => {
  const graph = buildGraph(
    [c('s', ['a']), c('f', ['a']), c('a')],
    [b('main', 's'), b('feature', 'f'), b('alias', 's')]
  )
  assert.deepEqual(graph.nodes.find(n => n.commit.sha === 's').commit.parents, [
    'a',
  ])
  assert.equal(
    graph.lanes.find(l => l.branch?.name === 'alias').commits.length,
    0
  )
  assert.deepEqual(buildGraph([], []).nodes, [])
})

test('topological columns stay left-to-right with clock skew and truncated parents', () => {
  const graph = buildGraph(
    [c('b', ['a'], 1), c('a', ['outside'], 99999)],
    [b('main', 'b')]
  )
  const nodes = new Map(graph.nodes.map(n => [n.commit.sha, n]))
  assert.ok(nodes.get('a').column < nodes.get('b').column)
  assert.equal(graph.lanes[0].fork, null)
  assert.equal(nodes.has('outside'), false)
})

test('settings tolerate corrupt, outdated and hostile persisted values', () => {
  for (const raw of [null, '{', 'null', '[]', '"string"']) {
    assert.equal(parseGraphSettings(raw).height, 220)
  }
  const prefs = parseGraphSettings(
    '{"height":99999,"main":false,"merged":"false","overrides":{"__proto__":false,"refs/heads/x":true}}'
  )
  assert.equal(prefs.height, 500)
  assert.equal(prefs.main, false)
  assert.equal(prefs.merged, true)
  assert.equal(Object.getPrototypeOf(prefs.overrides), null)
  assert.equal(prefs.overrides['refs/heads/x'], true)
})

test('real repository: normal merge, deleted ref and squash remain distinguishable', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'desktop-graph-'))
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  try {
    git('init', '-b', 'main')
    git('config', 'user.name', 'Graph Test')
    git('config', 'user.email', 'graph@example.invalid')
    git('commit', '--allow-empty', '-m', 'root')
    git('checkout', '-b', 'feature')
    git('commit', '--allow-empty', '-m', 'feature')
    const feature = git('rev-parse', 'HEAD')
    git('checkout', 'main')
    git('merge', '--no-ff', 'feature', '-m', 'merge')
    const merge = git('rev-parse', 'HEAD')
    git('branch', '-d', 'feature')
    git('checkout', '-b', 'squashed')
    git('commit', '--allow-empty', '-m', 'squashed feature')
    const squashed = git('rev-parse', 'HEAD')
    git('checkout', 'main')
    git('merge', '--squash', 'squashed')
    git('commit', '--allow-empty', '-m', 'squash')
    const raw = git(
      'log',
      '--branches',
      '--remotes',
      '--topo-order',
      '--max-count=2000',
      '--format=%H%x09%P%x09%ct%x09%s',
      '--'
    )
    const commits = raw.split('\n').map(line => {
      const [sha, parents, time, summary] = line.split('\t')
      return {
        sha,
        parents: parents ? parents.split(' ') : [],
        time: Number(time) * 1000,
        summary,
      }
    })
    const graph = buildGraph(commits, [
      b('main', git('rev-parse', 'main')),
      b('squashed', squashed),
    ])
    assert.deepEqual(
      graph.nodes.find(n => n.commit.sha === merge).commit.parents.slice(1),
      [feature]
    )
    assert.ok(
      graph.lanes.some(
        l => l.branch === null && l.commits.some(c => c.sha === feature)
      )
    )
    assert.equal(
      graph.nodes
        .find(n => n.commit.sha === git('rev-parse', 'main'))
        .commit.parents.includes(squashed),
      false
    )
    const merged = git(
      'for-each-ref',
      `--merged=${git('rev-parse', 'main')}`,
      '--format=%(refname)',
      '--',
      'refs/heads/',
      'refs/remotes/'
    )
    assert.equal(merged.includes('refs/heads/squashed'), false)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('older branch tips remain visible without reversing parent edges', () => {
  const commits = orderGraphCommits([
    c('main', ['root'], 20),
    c('root', [], 30),
    c('old-tip', ['root'], 10),
    c('root', [], 30),
  ])
  assert.equal(commits.length, 3)
  const graph = buildGraph(commits, [b('main', 'main'), b('old', 'old-tip')])
  const nodes = new Map(graph.nodes.map(n => [n.commit.sha, n]))
  for (const node of graph.nodes) {
    for (const parent of node.commit.parents) {
      assert.ok(nodes.get(parent).column < node.column)
    }
  }
  assert.ok(
    graph.lanes.some(
      l => l.branch?.name === 'old' && l.commits[0].sha === 'old-tip'
    )
  )
})
