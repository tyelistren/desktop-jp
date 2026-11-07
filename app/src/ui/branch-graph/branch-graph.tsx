/* eslint-disable react/jsx-no-bind -- Row-scoped callbacks in this functional SVG graph capture each branch/commit. */
import * as React from 'react'
import { Repository } from '../../models/repository'
import { Branch, BranchType } from '../../models/branch'
import { Account } from '../../models/account'
import { TipState } from '../../models/tip'
import { PopupType } from '../../models/popup'
import {
  IRepositoryState,
  RepositorySectionTab,
  HistoryTabMode,
  ComparisonMode,
} from '../../lib/app-state'
import { API, getAccountForEndpoint, IAPIPullRequest } from '../../lib/api'
import { Emoji } from '../../lib/emoji'
import { t } from '../../lib/localization'
import { showContextualMenu } from '../../lib/menu-item'
import {
  buildGraph,
  parseGraphSettings,
  IGraphSettings,
  IGraphLane,
} from '../../lib/branch-graph/layout'
import { loadBranchGraph } from '../../lib/branch-graph/load'
import { Dispatcher } from '../dispatcher'
import { SandboxedMarkdown } from '../lib/sandboxed-markdown'
import { generateBranchContextMenuItems } from '../branches/branch-list-item-context-menu'

interface IBranchGraphProps {
  readonly repository: Repository
  readonly state: IRepositoryState
  readonly dispatcher: Dispatcher
  readonly accounts: ReadonlyArray<Account>
  readonly emoji: Map<string, Emoji>
}

type Snapshot = Awaited<ReturnType<typeof loadBranchGraph>>
const rowHeight = 38
const labelWidth = 220
const columnWidth = 16
const dormantDays = 30

/** Optional graph above the repository view; mutations use existing Dispatcher flows. */
export function BranchGraph({
  repository,
  state,
  dispatcher,
  accounts,
  emoji,
}: IBranchGraphProps) {
  const storageKey = `desktop-jp.graph.v1:${repository.path}`
  const [settings, setSettings] = React.useState(() => {
    try {
      return parseGraphSettings(localStorage.getItem(storageKey))
    } catch {
      return parseGraphSettings(null)
    }
  })
  const [snapshot, setSnapshot] = React.useState<Snapshot | null>(null)
  const [error, setError] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [showSettings, setShowSettings] = React.useState(false)
  const [hovered, setHovered] = React.useState<string | null>(null)
  const [revision, setRevision] = React.useState(0)
  const [limit, setLimit] = React.useState(2000)
  const [prs, setPRs] = React.useState<ReadonlyArray<IAPIPullRequest>>([])
  const [prOffline, setPROffline] = React.useState(false)
  const viewport = React.useRef<HTMLDivElement>(null)
  const drag = React.useRef<{ y: number; height: number } | null>(null)
  const { branchesState } = state
  const current =
    branchesState.tip.kind === TipState.Valid ? branchesState.tip.branch : null
  const branches = React.useMemo(
    () =>
      branchesState.allBranches.filter(
        b =>
          !b.isDesktopForkRemoteBranch &&
          !(
            b.type === BranchType.Remote &&
            branchesState.allBranches.some(
              local =>
                local.type === BranchType.Local &&
                local.upstream === b.name &&
                local.tip.sha === b.tip.sha
            )
          )
      ),
    [branchesState.allBranches]
  )
  const base =
    branches.find(b => b.name === 'main') ??
    branches.find(b => b.nameWithoutRemote === 'main') ??
    branches.find(b => b.name === 'master') ??
    branchesState.defaultBranch
  const signature = branches.map(b => `${b.ref}:${b.tip.sha}`).join('|')
  const busy =
    state.checkoutProgress !== null ||
    state.isCommitting ||
    state.isPushPullFetchInProgress ||
    state.changesState.conflictState !== null ||
    state.multiCommitOperationState !== null

  React.useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings))
    } catch {
      /* Storage may be unavailable. Keep session settings. */
    }
  }, [settings, storageKey])

  React.useEffect(() => {
    if (settings.collapsed) {
      return
    }
    let active = true
    setLoading(true)
    setError(false)
    loadBranchGraph(repository, base, limit)
      .then(value => {
        if (active) {
          setSnapshot(value)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setError(true)
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [
    repository.path,
    signature,
    base?.tip.sha,
    revision,
    limit,
    settings.collapsed,
    state.changesState.stashEntry?.stashSha,
  ])

  React.useEffect(() => {
    if (settings.collapsed) {
      return
    }
    const repo = repository.gitHubRepository
    const account =
      repo === null ? null : getAccountForEndpoint(accounts, repo.endpoint)
    if (repo === null || !account) {
      setPROffline(true)
      return
    }
    let active = true
    API.fromAccount(account)
      .fetchRecentGraphPullRequests(repo.owner.login, repo.name)
      .then(value => {
        if (active) {
          setPRs(value)
          setPROffline(false)
        }
      })
      .catch(() => {
        if (active) {
          setPROffline(true)
        }
      })
    return () => {
      active = false
    }
  }, [
    repository.gitHubRepository?.hash,
    revision,
    settings.collapsed,
    accounts,
  ])

  const graph = React.useMemo(
    () =>
      buildGraph(
        snapshot?.commits ?? [],
        branches.map(b => ({
          ref: b.ref,
          name: b.name,
          shortName: b.nameWithoutRemote,
          sha: b.tip.sha,
        })),
        base?.ref
      ),
    [snapshot, signature, base?.ref]
  )
  const bySha = new Map(graph.nodes.map(n => [n.commit.sha, n]))
  const isMerged = (lane: IGraphLane) =>
    lane.branch !== null &&
    lane.branch.ref !== base?.ref &&
    snapshot?.merged?.has(lane.branch.ref) === true
  const isDormant = (lane: IGraphLane) => {
    const tip =
      lane.branch === null
        ? lane.commits[0]
        : bySha.get(lane.branch.sha)?.commit
    return tip !== undefined && Date.now() - tip.time > dormantDays * 86400000
  }
  const isVisible = (lane: IGraphLane) => {
    if (Object.prototype.hasOwnProperty.call(settings.overrides, lane.id)) {
      return settings.overrides[lane.id]
    }
    if (lane.branch === null) {
      return settings.deleted
    }
    if (lane.branch.ref === current?.ref) {
      return settings.current
    }
    if (
      lane.branch.ref === base?.ref ||
      ['main', 'master'].includes(lane.branch.shortName ?? lane.branch.name)
    ) {
      return settings.main
    }
    if (
      ['development', 'develop'].includes(
        lane.branch.shortName ?? lane.branch.name
      )
    ) {
      return settings.development
    }
    if (isDormant(lane) && !settings.dormant) {
      return false
    }
    return isMerged(lane) ? settings.merged : settings.unmerged
  }
  const visible = graph.lanes
    .map((lane, index) => ({ lane, index }))
    .filter(({ lane }) => isVisible(lane))
  const rows = new Map(visible.map(({ index }, row) => [index, row]))
  const x = (column: number) => labelWidth + 24 + column * columnWidth
  const y = (row: number) => 24 + row * rowHeight
  const width = Math.max(800, x(graph.nodes.length) + 70)
  const height = Math.max(70, visible.length * rowHeight + 40)
  React.useEffect(() => {
    if (viewport.current !== null) {
      viewport.current.scrollLeft = viewport.current.scrollWidth
    }
  }, [snapshot, settings.collapsed])

  const run = (action: () => Promise<unknown>) => {
    action().catch(() => setError(true))
  }
  const checkout = (branch: Branch) => {
    if (!busy && branch.ref !== current?.ref) {
      run(() => dispatcher.checkoutBranch(repository, branch))
    }
  }
  const contextMenu = (event: React.MouseEvent, branch: Branch) => {
    event.preventDefault()
    if (busy) {
      return
    }
    const items = generateBranchContextMenuItems({
      branch,
      onRenameBranch: () =>
        dispatcher.showPopup({
          type: PopupType.RenameBranch,
          repository,
          branch,
        }),
      onDeleteBranch: () =>
        run(async () => {
          if (branch.type === BranchType.Remote) {
            dispatcher.showPopup({
              type: PopupType.DeleteRemoteBranch,
              repository,
              branch,
            })
          } else {
            const aheadBehind = await dispatcher.getBranchAheadBehind(
              repository,
              branch
            )
            dispatcher.showPopup({
              type: PopupType.DeleteBranch,
              repository,
              branch,
              existsOnRemote: aheadBehind !== null,
            })
          }
        }),
    })
    items.unshift(
      {
        label: t('graph.mergeIntoCurrent'),
        enabled: current !== null && branch.ref !== current.ref,
        action: () =>
          dispatcher.startMergeBranchOperation(repository, false, branch),
      },
      {
        label: t('graph.compare'),
        enabled: current !== null && branch.ref !== current.ref,
        action: () =>
          run(async () => {
            await dispatcher.changeRepositorySection(
              repository,
              RepositorySectionTab.History
            )
            await dispatcher.executeCompare(repository, {
              kind: HistoryTabMode.Compare,
              branch,
              comparisonMode: ComparisonMode.Ahead,
            })
          }),
      },
      {
        label: t('graph.pushCurrent'),
        enabled: current?.ref === branch.ref,
        action: () => run(() => dispatcher.push(repository)),
      }
    )
    showContextualMenu(items)
  }
  const update = (value: Partial<IGraphSettings>) =>
    setSettings(old => ({ ...old, ...value }))
  const selectedLane = graph.lanes.find(l => l.id === hovered)
  const selectedBranch = branches.find(b => b.ref === selectedLane?.branch?.ref)
  // Matching names alone is unsafe for fork PRs. Verify the head repository.
  const pr = prs.find(
    p =>
      p.head.ref === selectedBranch?.nameWithoutRemote &&
      p.head.repo !== null &&
      `${p.head.repo.owner.login}/${p.head.repo.name}` ===
        repository.gitHubRepository?.fullName &&
      (p.state === 'open' || p.head.sha === selectedBranch?.tip.sha)
  )
  const cachedPR = branchesState.openPullRequests.find(
    p =>
      p.head.ref === selectedBranch?.nameWithoutRemote &&
      p.head.gitHubRepository.fullName === repository.gitHubRepository?.fullName
  )
  const tip =
    selectedLane?.branch === null
      ? selectedLane.commits[0]
      : selectedLane?.branch === undefined
      ? undefined
      : bySha.get(selectedLane.branch.sha)?.commit
  const forkNode =
    selectedLane?.fork === null || selectedLane?.fork === undefined
      ? undefined
      : bySha.get(selectedLane.fork)
  const forkLane =
    forkNode === undefined ? undefined : graph.lanes[forkNode.lane]
  const name = (lane: IGraphLane) =>
    lane.branch?.name ??
    t('graph.anonymous', { sha: lane.commits[0]?.sha.slice(0, 7) ?? '' })
  const stateLabel = (lane: IGraphLane) =>
    lane.branch !== null && lane.branch.ref === base?.ref
      ? t('graph.base')
      : lane.branch === null
      ? t('graph.historical')
      : snapshot === null || snapshot.merged === null
      ? t('graph.unknown')
      : isMerged(lane)
      ? t('graph.merged')
      : t('graph.unmerged')

  return (
    <section className="branch-development-graph" aria-label={t('graph.title')}>
      <header>
        <button
          onClick={() => update({ collapsed: !settings.collapsed })}
          aria-expanded={!settings.collapsed}
        >
          {settings.collapsed ? t('graph.show') : t('graph.hide')}
        </button>
        <strong>{t('graph.title')}</strong>
        {!settings.collapsed && (
          <>
            <span className="graph-axis">{t('graph.axis')}</span>
            <button
              onClick={() => setShowSettings(!showSettings)}
              aria-expanded={showSettings}
            >
              {t('graph.settings')}
            </button>
            <button disabled={loading} onClick={() => setRevision(v => v + 1)}>
              {t('graph.refresh')}
            </button>
          </>
        )}
      </header>
      {!settings.collapsed && (
        <>
          {showSettings && (
            <div className="graph-settings">
              {(
                [
                  'main',
                  'development',
                  'current',
                  'unmerged',
                  'merged',
                  'deleted',
                  'dormant',
                ] as const
              ).map(key => {
                return (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={settings[key]}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        update({ [key]: e.currentTarget.checked })
                      }
                    />
                    {t(`graph.filter.${key}`)}
                  </label>
                )
              })}
              <p>{t('graph.historyHelp')}</p>
              <details>
                <summary>{t('graph.individual')}</summary>
                <button onClick={() => update({ overrides: {} })}>
                  {t('graph.reset')}
                </button>
                {graph.lanes
                  .filter(l => l.branch !== null)
                  .map(lane => {
                    return (
                      <label key={lane.id}>
                        <input
                          type="checkbox"
                          checked={isVisible(lane)}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            update({
                              overrides: {
                                ...settings.overrides,
                                [lane.id]: e.currentTarget.checked,
                              },
                            })
                          }
                        />
                        {name(lane)}
                      </label>
                    )
                  })}
              </details>
            </div>
          )}
          <div className="graph-body" style={{ height: settings.height }}>
            <div className="graph-scroll" ref={viewport}>
              {loading && <p role="status">{t('graph.loading')}</p>}
              {error && <p role="status">{t('graph.error')}</p>}
              {!loading && graph.nodes.length === 0 && (
                <p>{t('graph.empty')}</p>
              )}
              <div className="graph-canvas" style={{ width, height }}>
                <svg
                  width={width}
                  height={height}
                  aria-label={t('graph.ancestry')}
                >
                  {graph.nodes.map(node => {
                    const row = rows.get(node.lane)
                    if (row === undefined) {
                      return null
                    }
                    return node.commit.parents.map(parent => {
                      const p = bySha.get(parent)
                      const parentRow =
                        p === undefined ? undefined : rows.get(p.lane)
                      if (p === undefined || parentRow === undefined) {
                        return null
                      }
                      const edgeBranch = branches.find(
                        b => b.ref === graph.lanes[node.lane].branch?.ref
                      )

                      return (
                        <path
                          key={`${node.commit.sha}:${parent}`}
                          className={
                            current !== null && edgeBranch?.ref === current.ref
                              ? 'graph-edge graph-current-edge'
                              : 'graph-edge'
                          }
                          onClick={() => {
                            if (edgeBranch !== undefined) {
                              checkout(edgeBranch)
                            }
                          }}
                          onContextMenu={(
                            e: React.MouseEvent<SVGPathElement, MouseEvent>
                          ) => {
                            if (edgeBranch !== undefined) {
                              contextMenu(e, edgeBranch)
                            }
                          }}
                          onMouseEnter={() =>
                            setHovered(graph.lanes[node.lane].id)
                          }
                          d={`M ${x(p.column)} ${y(parentRow)} L ${
                            x(node.column) - 8
                          } ${y(parentRow)} L ${x(node.column)} ${y(row)}`}
                        />
                      )
                    })
                  })}
                  {visible.map(({ lane, index }, row) => {
                    const branch = branches.find(
                      b => b.ref === lane.branch?.ref
                    )
                    const tipNode =
                      lane.branch === null
                        ? undefined
                        : bySha.get(lane.branch.sha)
                    const active =
                      current !== null && branch?.ref === current.ref
                    const last =
                      lane.commits[0] === undefined
                        ? tipNode
                        : bySha.get(lane.commits[0].sha)
                    if (last === undefined) {
                      return null
                    }
                    // Merged branch histories end at their actual tip. Only active
                    // refs receive a dashed present-day extension (not ancestry).
                    const end =
                      isMerged(lane) && !active ? x(last.column) : width - 30

                    return (
                      <g
                        key={lane.id}
                        className={
                          active
                            ? 'graph-current'
                            : isMerged(lane) || isDormant(lane)
                            ? 'graph-muted'
                            : ''
                        }
                      >
                        {branch !== undefined && (
                          <path
                            className="graph-ref-line"
                            d={`M ${x(last.column)} ${y(row)} H ${end}`}
                            onClick={() => checkout(branch)}
                            onContextMenu={(
                              e: React.MouseEvent<SVGPathElement, MouseEvent>
                            ) => contextMenu(e, branch)}
                            onMouseEnter={() => setHovered(lane.id)}
                          />
                        )}
                        {branch !== undefined && end > x(last.column) && (
                          <circle
                            className="graph-ref-tip"
                            cx={end}
                            cy={y(row)}
                            r={active ? 5 : 3}
                            onClick={() => checkout(branch)}
                            onMouseEnter={() => setHovered(lane.id)}
                            onContextMenu={e => contextMenu(e, branch)}
                          />
                        )}
                        {tipNode !== undefined &&
                          tipNode.lane !== index &&
                          rows.has(tipNode.lane) && (
                            <path
                              className="graph-alias"
                              d={`M ${x(tipNode.column)} ${y(
                                rows.get(tipNode.lane) ?? row
                              )} V ${y(row)}`}
                            />
                          )}
                        {lane.commits.map(c => {
                          const n = bySha.get(c.sha)
                          if (n === undefined) {
                            return null
                          }

                          return (
                            <circle
                              key={c.sha}
                              className="graph-commit"
                              cx={x(n.column)}
                              cy={y(row)}
                              r={active ? 5 : 4}
                              tabIndex={0}
                              role="button"
                              aria-label={`${c.sha.slice(0, 7)} ${c.summary}`}
                              onClick={() =>
                                run(() =>
                                  dispatcher.showBranchGraphCommit(
                                    repository,
                                    c.sha
                                  )
                                )
                              }
                              onKeyDown={(
                                e: React.KeyboardEvent<SVGCircleElement>
                              ) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  run(() =>
                                    dispatcher.showBranchGraphCommit(
                                      repository,
                                      c.sha
                                    )
                                  )
                                }
                              }}
                            >
                              <title>{`${new Date(
                                c.time
                              ).toLocaleString()}\n${c.sha.slice(0, 7)} ${
                                c.summary
                              }`}</title>
                            </circle>
                          )
                        })}
                      </g>
                    )
                  })}
                </svg>
                <div className="graph-labels">
                  {visible.map(({ lane }) => {
                    const branch = branches.find(
                      b => b.ref === lane.branch?.ref
                    )
                    const stash = snapshot?.stashes.find(
                      s =>
                        s.branchName === branch?.name &&
                        branch?.type === BranchType.Local
                    )

                    return (
                      <div
                        key={lane.id}
                        style={{ height: rowHeight }}
                        className={
                          current !== null && branch?.ref === current.ref
                            ? 'graph-current'
                            : isMerged(lane) || isDormant(lane)
                            ? 'graph-muted'
                            : ''
                        }
                      >
                        <button
                          disabled={branch !== undefined && busy}
                          onMouseEnter={() => setHovered(lane.id)}
                          onFocus={() => setHovered(lane.id)}
                          onClick={() => {
                            setHovered(lane.id)
                            if (branch !== undefined) {
                              checkout(branch)
                            }
                          }}
                          onContextMenu={(
                            e: React.MouseEvent<HTMLButtonElement, MouseEvent>
                          ) => {
                            if (branch !== undefined) {
                              contextMenu(e, branch)
                            }
                          }}
                          aria-label={`${name(lane)} · ${stateLabel(lane)}${
                            isDormant(lane) ? ` · ${t('graph.dormant')}` : ''
                          }`}
                          aria-current={
                            current !== null && branch?.ref === current.ref
                              ? true
                              : undefined
                          }
                        >
                          {name(lane)}
                        </button>
                        {!isDormant(lane) &&
                          lane.branch !== null &&
                          bySha.has(lane.branch.sha) && (
                            <span
                              className="graph-recent-mark"
                              role="img"
                              aria-label={t('graph.recent')}
                            >
                              ●
                            </span>
                          )}
                        {stash !== undefined && (
                          <button
                            disabled={busy}
                            aria-label={t('graph.stash')}
                            onClick={() =>
                              run(async () => {
                                if (branch === undefined) {
                                  return
                                }
                                await dispatcher.showBranchGraphStash(
                                  repository,
                                  branch
                                )
                              })
                            }
                          >
                            ◆
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            {selectedLane !== undefined && (
              <aside className="graph-detail" aria-label={t('graph.details')}>
                <strong>{name(selectedLane)}</strong>
                <p>
                  {stateLabel(selectedLane)} ·{' '}
                  {tip === undefined
                    ? t('graph.unknown')
                    : isDormant(selectedLane)
                    ? t('graph.dormant')
                    : t('graph.recent')}
                </p>
                <p>
                  {t('graph.fork', {
                    source:
                      forkLane === undefined
                        ? t('graph.unknown')
                        : name(forkLane),
                  })}
                </p>
                {tip !== undefined && (
                  <p>
                    {new Date(tip.time).toLocaleString()}
                    <br />
                    {tip.summary}
                  </p>
                )}
                {(pr !== undefined || cachedPR !== undefined) && (
                  <>
                    <strong>
                      #{pr?.number ?? cachedPR?.pullRequestNumber}{' '}
                      {pr?.title ?? cachedPR?.title}
                    </strong>
                    <p>
                      {pr?.merged_at
                        ? t('graph.prMerged')
                        : pr?.state === 'closed'
                        ? t('graph.prClosed')
                        : t('graph.prOpen')}
                    </p>
                    {pr?.labels?.map(label => {
                      return (
                        <span className="graph-tag" key={label.name}>
                          {label.name}
                        </span>
                      )
                    })}
                    <SandboxedMarkdown
                      markdown={pr?.body ?? cachedPR?.body ?? ''}
                      emoji={emoji}
                      repository={repository.gitHubRepository ?? undefined}
                      baseHref={
                        repository.gitHubRepository?.htmlURL ?? undefined
                      }
                      markdownContext="PullRequest"
                      underlineLinks={true}
                      title={t('graph.prBody')}
                      onMarkdownLinkClicked={(url: string) =>
                        dispatcher.openInBrowser(url)
                      }
                    />
                  </>
                )}
                <small>
                  {t('graph.prHelp')}
                  {prOffline ? ` ${t('graph.offline')}` : ''}
                </small>
              </aside>
            )}
          </div>
          <footer>
            <small>
              {t('graph.legend')}
              {snapshot?.truncated
                ? ` ${t('graph.truncated', { count: limit })}`
                : ''}
            </small>
            {snapshot?.truncated && limit < 10000 && (
              <button onClick={() => setLimit(v => v + 2000)}>
                {t('graph.more')}
              </button>
            )}
          </footer>
          <button
            type="button"
            className="graph-resizer"
            tabIndex={0}
            aria-label={t('graph.resize')}
            onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => {
              drag.current = { y: e.clientY, height: settings.height }
              e.currentTarget.setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e: React.PointerEvent<HTMLButtonElement>) => {
              if (drag.current !== null) {
                update({
                  height: Math.max(
                    100,
                    Math.min(
                      500,
                      drag.current.height + e.clientY - drag.current.y
                    )
                  ),
                })
              }
            }}
            onPointerUp={() => {
              drag.current = null
            }}
            onPointerCancel={() => {
              drag.current = null
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault()
                update({
                  height: Math.max(
                    100,
                    Math.min(
                      500,
                      settings.height + (e.key === 'ArrowUp' ? -20 : 20)
                    )
                  ),
                })
              }
            }}
          />
        </>
      )}
    </section>
  )
}
