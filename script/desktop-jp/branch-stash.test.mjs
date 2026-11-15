import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

// Compile the production modules; only the Git process bridge is replaced.
function load(file, mocks) {
  const exports = {}
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  runInNewContext(code, {
    exports,
    Buffer,
    require: name => {
      if (!(name in mocks)) throw new Error(`Unexpected import ${name}`)
      return mocks[name]
    },
  })
  return exports
}
const parser = load('app/src/lib/git/git-delimiter-parser.ts', {
  '../split-buffer': {
    splitBuffer: () => {
      throw new Error('String input expected')
    },
  },
})
class GitError extends Error {
  constructor(result) {
    super(result.stderr || result.stdout)
    this.result = result
  }
}
const git = async (args, cwd, _name, options = {}) => {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' })
  const value = {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.status,
  }
  if (result.status === 0 || options.successExitCodes?.has(result.status))
    return value
  if (
    options.expectedErrors?.has('conflicts') &&
    result.stdout.includes('CONFLICT')
  )
    return value
  throw new GitError(value)
}
const stash = load('app/src/lib/git/stash.ts', {
  '../localization': { t: key => key },
  dugite: { GitError: { MergeConflicts: 'conflicts' } },
  './core': { git, GitError },
  '../../models/stash-entry': {
    StashedChangesLoadStates: { NotLoaded: 'NotLoaded' },
  },
  './log': {},
  './update-index': { stageFiles: async () => {} },
  './git-delimiter-parser': parser,
})
function fixture(t) {
  const path = mkdtempSync(join(process.cwd(), '.stash-fixture-'))
  t.after(() => rmSync(path, { recursive: true, force: true }))
  const g = (...args) => {
    const r = spawnSync('git', args, { cwd: path, encoding: 'utf8' })
    assert.equal(r.status, 0, r.stderr)
    return r.stdout.trim()
  }
  g('init', '-b', 'main')
  g('config', 'user.name', 'Stash Test')
  g('config', 'user.email', 'stash-test@example.invalid')
  writeFileSync(join(path, 'file'), 'base\n')
  g('add', '.')
  g('commit', '-m', 'base')
  return {
    path,
    g,
    change: text => writeFileSync(join(path, 'file'), text + '\n'),
  }
}

test('multiple branch stashes are isolated; restore older entry without removing others', async t => {
  const r = fixture(t)
  r.g('switch', '-c', 'feature/a')
  r.change('A1')
  assert.equal(await stash.createDesktopStashEntry(r, 'feature/a', []), true)
  const a1 = (await stash.getStashes(r)).desktopEntries[0]
  r.change('A2')
  await stash.createDesktopStashEntry(r, 'feature/a', [])
  const a2 = (await stash.getStashes(r)).desktopEntries[0]
  r.g('switch', '-c', 'feature/b', 'main')
  r.change('B1')
  await stash.createDesktopStashEntry(r, 'feature/b', [])
  await assert.rejects(stash.popStashEntry(r, a1.stashSha), /wrongBranch/)
  assert.equal(r.g('status', '--porcelain'), '')
  assert.equal((await stash.getStashes(r)).stashEntryCount, 3)
  r.g('switch', 'feature/a')
  await stash.popStashEntry(r, a1.stashSha)
  assert.equal(readFileSync(join(r.path, 'file'), 'utf8'), 'A1\n')
  const remaining = (await stash.getStashes(r)).desktopEntries
  assert.equal(remaining.length, 2)
  assert.ok(remaining.some(e => e.stashSha === a2.stashSha))
  assert.ok(remaining.some(e => e.branchName === 'feature/b'))
})

test('conflict preserves stash; blocked apply also preserves stash and local edits', async t => {
  const r = fixture(t)
  r.change('stashed')
  await stash.createDesktopStashEntry(r, 'main', [])
  const entry = (await stash.getStashes(r)).desktopEntries[0]
  r.change('local')
  await assert.rejects(stash.popStashEntry(r, entry.stashSha))
  assert.equal(readFileSync(join(r.path, 'file'), 'utf8'), 'local\n')
  r.g('commit', '-am', 'conflicting change')
  await stash.popStashEntry(r, entry.stashSha)
  assert.ok(r.g('ls-files', '--unmerged').length > 0)
  assert.equal(
    (await stash.getStashes(r)).desktopEntries[0].stashSha,
    entry.stashSha
  )
})

test('empty save, external stashes, and rename preserve all branch entries', async t => {
  const r = fixture(t)
  for (const value of ['first', 'second']) {
    r.change(value)
    await stash.createDesktopStashEntry(r, 'main', [])
  }
  assert.equal(await stash.createDesktopStashEntry(r, 'main', []), false)
  r.change('external')
  r.g('stash', 'push', '-m', 'external stash')
  const external = r.g('rev-parse', 'refs/stash')
  const before = await stash.getStashes(r)
  assert.equal(before.stashEntryCount, 3)
  assert.equal(before.desktopEntries.length, 2)
  r.g('branch', '-m', 'renamed')
  for (const entry of [...before.desktopEntries].reverse()) {
    await stash.moveStashEntry(r, entry, 'renamed')
  }
  const after = await stash.getStashes(r)
  assert.equal(after.stashEntryCount, 3)
  assert.ok(after.desktopEntries.every(e => e.branchName === 'renamed'))
  assert.deepEqual(
    Array.from(after.desktopEntries, e => e.tree),
    Array.from(before.desktopEntries, e => e.tree)
  )
  await stash.popStashEntry(r, after.desktopEntries[0].stashSha)
  assert.equal(readFileSync(join(r.path, 'file'), 'utf8'), 'second\n')
  assert.ok(r.g('stash', 'list', '--format=%H').includes(external))
})

test('production store selects only the current branch and retains independent selections', async () => {
  const entry = (branchName, stashSha) => ({
    branchName,
    stashSha,
    files: { kind: 'NotLoaded' },
  })
  let entries = [entry('A', 'a2'), entry('B', 'b1'), entry('A', 'a1')]
  const mocks = new Proxy(
    {
      './base-store': {
        BaseStore: class {
          emitUpdate() {}
        },
      },
      '../../models/tip': { TipState: { Valid: 'Valid', Unknown: 'Unknown' } },
      '../../models/stash-entry': {
        StashedChangesLoadStates: {
          NotLoaded: 'NotLoaded',
          Loading: 'Loading',
          Loaded: 'Loaded',
        },
      },
      './helpers/tags-to-push-storage': { getTagsToPush: () => [] },
      '../git/stash': {
        getStashes: async () => ({
          desktopEntries: entries,
          stashEntryCount: entries.length,
        }),
        getStashedFiles: async (_repo, sha) => [{ id: sha }],
      },
    },
    { has: () => true, get: (target, key) => target[key] ?? {} }
  )
  const { GitStore } = load('app/src/lib/stores/git-store.ts', mocks)
  const store = new GitStore({}, {}, {})
  store._tip = { kind: 'Valid', branch: { name: 'A' } }
  await store.loadStashEntries()
  assert.equal(store.desktopStashEntryCount, 3)
  assert.equal(store.currentBranchStashEntries.length, 2)
  await store.selectBranchStash('a1')
  assert.equal(store.currentBranchStashEntry.stashSha, 'a1')
  assert.equal(store.currentBranchStashEntry.files.files[0].id, 'a1')
  await store.selectBranchStash('b1')
  assert.equal(store.currentBranchStashEntry.stashSha, 'a1')
  store._tip = { kind: 'Valid', branch: { name: 'B' } }
  await store.loadStashEntries()
  assert.equal(store.currentBranchStashEntry.stashSha, 'b1')
  store._tip = { kind: 'Valid', branch: { name: 'A' } }
  await store.loadStashEntries()
  assert.equal(store.currentBranchStashEntry.stashSha, 'a1')
  entries = entries.filter(e => e.stashSha !== 'a1')
  await store.loadStashEntries()
  assert.equal(store.currentBranchStashEntry.stashSha, 'a2')
  entries.unshift(entry('A', 'a3'))
  store.resetStashSelection('A')
  await store.loadStashEntries()
  assert.equal(store.currentBranchStashEntry.stashSha, 'a3')
  store._tip = { kind: 'Unknown' }
  assert.equal(store.currentBranchStashEntry, null)
  assert.equal(store.currentBranchStashEntries.length, 0)
})

test('production checkout stops on a failed save and never drops an older stash', async () => {
  const forbidden = () => {
    throw new Error('An existing stash must not be dropped')
  }
  const mocks = new Proxy(
    {
      './base-store': { TypedBaseStore: class {} },
      '../../models/diff': { ImageDiffType: { TwoUp: 0 } },
      '../../models/tip': { TipState: { Valid: 'Valid' } },
      '../localization': { t: key => key },
      '../git/stash': { dropDesktopStashEntry: forbidden },
    },
    { has: () => true, get: (target, key) => target[key] ?? {} }
  )
  const { AppStore } = load('app/src/lib/stores/app-store.ts', mocks)
  const store = Object.create(AppStore.prototype)
  const repo = {},
    branch = { name: 'A' },
    target = { name: 'B' }
  let created = false,
    checkedOut = false,
    selectionReset = false
  store.gitStoreCache = {
    get: () => ({
      performFailableOperation: operation => operation(),
      resetStashSelection: name => {
        assert.equal(name, 'A')
        selectionReset = true
      },
    }),
  }
  store.repositoryStateCache = {
    get: () => ({
      changesState: { workingDirectory: { files: [{}] } },
      branchesState: { tip: { kind: 'Valid', branch } },
    }),
  }
  store.createStashEntry = async () => created
  store.checkoutIgnoringChanges = async () => {
    checkedOut = true
  }
  store.statsStore = { increment: () => {} }
  await assert.rejects(
    store.checkoutAndLeaveChanges(repo, target, null),
    /saveFailed/
  )
  assert.equal(checkedOut, false)
  assert.equal(selectionReset, false)
  created = true
  await store.checkoutAndLeaveChanges(repo, target, null)
  assert.equal(checkedOut, true)
  assert.equal(selectionReset, true)
})

test('stash header lists branch entries and dispatches selection, restore and confirmed discard', async () => {
  const { createRequire } = await import('node:module')
  const requireApp = createRequire(
    new URL('../../app/package.json', import.meta.url)
  )
  const React = requireApp('react')
  const Select = () => null
  const Buttons = () => null
  const { StashDiffHeader } = load(
    'app/src/ui/stashing/stash-diff-header.tsx',
    {
      react: React,
      '../../lib/localization': {
        t: (key, values = {}) => `${key}:${values.branch ?? ''}`,
      },
      '../../models/popup': {
        PopupType: { ConfirmDiscardStash: 'confirmDiscard' },
      },
      '../dialog/ok-cancel-button-group': { OkCancelButtonGroup: Buttons },
      '../../lib/error-with-metadata': { ErrorWithMetadata: Error },
      '../../models/retry-actions': { RetryActionType: {} },
      '../lib/select': { Select },
    }
  )
  const entries = [
    { name: 'stash@{0}', branchName: 'A', stashSha: 'a2' },
    { name: 'stash@{1}', branchName: 'A', stashSha: 'a1' },
  ]
  const calls = []
  const repository = {}
  const props = {
    stashEntry: entries[1],
    stashEntries: entries,
    repository,
    askForConfirmationOnDiscardStash: true,
    dispatcher: {
      selectBranchStash: async (...args) => calls.push(['select', ...args]),
      popStash: async (...args) => calls.push(['restore', ...args]),
      showPopup: popup => calls.push(['popup', popup]),
      dropStash: () => {
        throw new Error('Discard confirmation bypassed')
      },
      postError: error => {
        throw error
      },
    },
  }
  const header = new StashDiffHeader(props)
  header.setState = patch => {
    header.state = { ...header.state, ...patch }
  }
  const selector = header
    .render()
    .props.children.find(child => child.type === Select)
  assert.equal(selector.props.value, 'a1')
  assert.match(selector.props.label, /A$/)
  assert.deepEqual(
    selector.props.children.map(child => child.props.value),
    ['a2', 'a1']
  )
  selector.props.onChange({ currentTarget: { value: 'a2' } })
  assert.equal(calls[0][2], 'a2')
  await header.onRestoreClick()
  assert.equal(calls[1][2], entries[1])
  await header.onDiscardClick()
  assert.equal(calls[2][1].type, 'confirmDiscard')
  assert.equal(calls[2][1].stash, entries[1])
  header.state = { isRestoring: true, isDiscarding: false }
  assert.equal(
    header.render().props.children.find(child => child.type === Select).props
      .disabled,
    true
  )
})

test('bringing changes to a remote branch tags its new local branch name', async () => {
  const repository = {},
    calls = []
  const mocks = new Proxy(
    {
      './base-store': { TypedBaseStore: class {} },
      '../../models/diff': { ImageDiffType: { TwoUp: 0 } },
      '../../models/branch': { BranchType: { Remote: 'Remote' } },
      '../error-with-metadata': { ErrorWithMetadata: class extends Error {} },
      '../git': { GitError },
      dugite: { GitError: { LocalChangesOverwritten: 'overwritten' } },
      '../git/stash': {
        getLastDesktopStashEntryForBranch: async (_repo, name) => {
          calls.push(name)
          return { stashSha: 'transient' }
        },
        popStashEntry: async (_repo, sha) => calls.push(sha),
      },
    },
    { has: () => true, get: (target, key) => target[key] ?? {} }
  )
  const { AppStore } = load('app/src/lib/stores/app-store.ts', mocks)
  const store = Object.create(AppStore.prototype)
  let attempts = 0
  store.checkoutIgnoringChanges = async () => {
    if (attempts++ === 0) throw new GitError({ gitError: 'overwritten' })
  }
  store.createStashEntry = async (_repo, name) => {
    calls.push(name)
    return true
  }
  store.statsStore = { increment: () => {} }
  await store.checkoutAndBringChanges(
    repository,
    { type: 'Remote', name: 'origin/feature', nameWithoutRemote: 'feature' },
    null
  )
  assert.deepEqual(calls, ['feature', 'feature', 'transient'])
})
