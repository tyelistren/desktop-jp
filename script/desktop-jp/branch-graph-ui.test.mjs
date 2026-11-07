import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { JSDOM } from 'jsdom'
import ts from 'typescript'
import * as layout from '../../app/src/lib/branch-graph/layout.ts'

// Exercise the production component with deterministic local/GitHub adapters.
// No Electron process, network, or mutating Git command is needed.
test('graph UI preserves dispatcher actions, settings, commit inspection and offline fallback', async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
  })
  const saved = new Map()
  for (const [key, value] of Object.entries({
    MessageChannel: undefined,
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    localStorage: dom.window.localStorage,
  })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, value })
  }
  const requireApp = createRequire(
    new URL('../../app/package.json', import.meta.url)
  )
  const React = requireApp('react')
  const ReactDOM = requireApp('react-dom')
  const { act, Simulate } = requireApp('react-dom/test-utils')
  const ja = JSON.parse(
    readFileSync(
      new URL('../../app/src/lib/localization/ja.json', import.meta.url)
    )
  )
  const t = (key, values = {}) =>
    (ja[key] ?? key).replace(/\{(\w+)\}/g, (token, key) => values[key] ?? token)
  const sha = char => char.repeat(40)
  const branch = (name, tip) => ({
    name,
    nameWithoutRemote: name,
    ref: `refs/heads/${name}`,
    tip: { sha: tip },
    type: 0,
    upstream: null,
  })
  const main = branch('main', sha('m')),
    feature = branch('feature', sha('f'))
  const calls = []
  let menu = []
  let loads = 0
  const mocks = {
    react: React,
    '../../models/branch': { BranchType: { Local: 0, Remote: 1 } },
    '../../models/tip': { TipState: { Valid: 'Valid' } },
    '../../models/popup': {
      PopupType: {
        RenameBranch: 'RenameBranch',
        DeleteBranch: 'DeleteBranch',
        DeleteRemoteBranch: 'DeleteRemoteBranch',
      },
    },
    '../../lib/app-state': {
      RepositorySectionTab: { History: 'History', Changes: 'Changes' },
      HistoryTabMode: { Compare: 'Compare' },
      ComparisonMode: { Ahead: 'Ahead' },
    },
    '../../lib/api': { getAccountForEndpoint: () => null, API: {} },
    '../../lib/localization': { t },
    '../../lib/menu-item': {
      showContextualMenu: items => {
        menu = items
      },
    },
    '../../lib/branch-graph/layout': layout,
    '../../lib/branch-graph/load': {
      loadBranchGraph: async () => {
        loads++
        return {
          commits: [
            {
              sha: sha('m'),
              parents: [sha('a'), sha('f')],
              time: Date.now(),
              summary: 'Merge feature',
            },
            {
              sha: sha('f'),
              parents: [sha('a')],
              time: Date.now(),
              summary: 'Feature work',
            },
            { sha: sha('a'), parents: [], time: Date.now(), summary: 'Root' },
          ],
          merged: new Set([main.ref, feature.ref]),
          stashes: [],
          truncated: false,
        }
      },
    },
    '../lib/sandboxed-markdown': { SandboxedMarkdown: () => null },
    '../branches/branch-list-item-context-menu': {
      generateBranchContextMenuItems: config => [
        { label: 'rename', action: config.onRenameBranch },
        { label: 'delete', action: config.onDeleteBranch },
      ],
    },
  }
  const source = readFileSync(
    new URL('../../app/src/ui/branch-graph/branch-graph.tsx', import.meta.url),
    'utf8'
  )
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  const exports = {}
  runInNewContext(code, {
    exports,
    require: name => {
      assert.ok(name in mocks, `Unexpected dependency ${name}`)
      return mocks[name]
    },
    localStorage: dom.window.localStorage,
    Date,
    Map,
    Set,
  })
  const dispatcher = new Proxy(
    {},
    {
      get:
        (_, key) =>
        (...args) => {
          calls.push([key, ...args])
          return Promise.resolve(null)
        },
    }
  )
  const props = {
    repository: { path: '/graph-fixture', gitHubRepository: null },
    state: {
      branchesState: {
        allBranches: [feature, main],
        tip: { kind: 'Valid', branch: main },
        defaultBranch: main,
        openPullRequests: [],
      },
      changesState: { stashEntry: null, conflictState: null },
      checkoutProgress: null,
      isCommitting: false,
      isPushPullFetchInProgress: false,
      multiCommitOperationState: null,
    },
    dispatcher,
    accounts: [],
    emoji: new Map(),
  }
  const container = dom.window.document.getElementById('root')
  const button = text =>
    [...container.querySelectorAll('button')].find(b => b.textContent === text)
  try {
    await act(async () => {
      ReactDOM.render(
        React.createElement(exports.BranchGraph, props),
        container
      )
    })
    assert.equal(loads, 1)
    assert.equal(container.querySelectorAll('.graph-edge').length, 3)
    assert.equal(container.querySelectorAll('.graph-commit').length, 3)
    await act(async () => {
      Simulate.click(button('feature'))
    })
    assert.ok(
      calls.some(c => c[0] === 'checkoutBranch' && c[2].ref === feature.ref)
    )
    await act(async () => {
      Simulate.contextMenu(button('feature'), { preventDefault() {} })
    })
    menu.find(i => i.label === t('graph.mergeIntoCurrent')).action()
    assert.ok(
      calls.some(
        c => c[0] === 'startMergeBranchOperation' && c[3].ref === feature.ref
      )
    )
    await act(async () => {
      Simulate.click(container.querySelector('.graph-commit'))
    })
    assert.ok(calls.some(c => c[0] === 'showBranchGraphCommit'))
    await act(async () => {
      Simulate.mouseEnter(button('feature'))
    })
    assert.match(
      container.querySelector('.graph-detail').textContent,
      /Feature work/
    )
    assert.match(
      container.querySelector('.graph-detail').textContent,
      /GitHubに接続できない/
    )
    await act(async () => {
      Simulate.click(button(t('graph.settings')))
    })
    const merged = [...container.querySelectorAll('label')]
      .find(l => l.textContent === t('graph.filter.merged'))
      .querySelector('input')
    await act(async () => {
      merged.checked = false
      Simulate.change(merged)
    })
    assert.equal(button('feature') === undefined, true)
    assert.equal(
      JSON.parse(
        dom.window.localStorage.getItem('desktop-jp.graph.v1:/graph-fixture')
      ).merged,
      false
    )
    await act(async () => {
      Simulate.click(button(t('graph.hide')))
    })
    assert.equal(container.querySelector('svg'), null)
    assert.ok(button(t('graph.show')))
    await act(async () => {
      Simulate.click(button(t('graph.show')))
    })
    assert.equal(loads, 2)
  } finally {
    await act(async () => {
      ReactDOM.unmountComponentAtNode(container)
    })
    dom.window.close()
    for (const [key, descriptor] of saved) {
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor)
      } else {
        delete globalThis[key]
      }
    }
  }
})
