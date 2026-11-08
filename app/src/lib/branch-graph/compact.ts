import type { IGraphLane, IGraphNode, IGraphSettings } from './layout'

/** Rank eligible rows without changing their original, main-first row order. */
export function selectGraphLanes(
  lanes: ReadonlyArray<IGraphLane>,
  settings: IGraphSettings,
  currentRef: string | undefined,
  baseRef: string | undefined,
  merged: ReadonlySet<string> | null,
  times: ReadonlyMap<string, number>,
  now: number
) {
  const major = (l: IGraphLane) =>
    l.branch !== null &&
    (l.branch.ref === baseRef ||
      ['main', 'master', 'development', 'develop'].includes(
        l.branch.shortName ?? l.branch.name
      ))
  const updated = (l: IGraphLane) =>
    times.get(l.branch?.sha ?? l.commits[0]?.sha) ?? 0
  const candidates = lanes
    .map((lane, index) => ({ lane, index }))
    .filter(({ lane }) => {
      const override = settings.overrides[lane.id]
      if (typeof override === 'boolean') {
        return override
      }
      if (lane.branch?.ref === currentRef && currentRef !== undefined) {
        return settings.current
      }
      if (
        lane.branch?.ref.startsWith('refs/remotes/upstream/') &&
        !settings.upstream
      ) {
        return false
      }
      if (lane.branch === null) {
        return settings.deleted && !settings.hideMerged
      }
      if (
        lane.branch.ref === baseRef ||
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
      if (!settings.dormant && now - updated(lane) > 30 * 86400000) {
        return false
      }
      if (merged?.has(lane.branch.ref)) {
        return settings.merged && !settings.hideMerged
      }
      return settings.unmerged
    })
  const rank = (l: IGraphLane) =>
    l.branch?.ref === currentRef && currentRef !== undefined
      ? 0
      : settings.overrides[l.id] === true
      ? 1
      : l.branch !== null &&
        (l.branch.ref === baseRef ||
          (l.branch.shortName ?? l.branch.name) === 'main')
      ? 2
      : major(l)
      ? 3
      : l.branch !== null && merged !== null && !merged.has(l.branch.ref)
      ? 4
      : 5
  return candidates
    .sort(
      (a, b) =>
        rank(a.lane) - rank(b.lane) ||
        updated(b.lane) - updated(a.lane) ||
        a.lane.id.localeCompare(b.lane.id)
    )
    .slice(0, settings.maxBranches)
    .sort((a, b) => a.index - b.index)
}

/** Keep colors across checkouts; reuse vacant slots when the visible set changes. */
export function assignGraphColors(
  lanes: ReadonlyArray<IGraphLane>,
  baseRef: string | undefined,
  previous: Readonly<Record<string, number>>
) {
  const result: Record<string, number> = { ...previous }
  const used = new Set<number>()
  const center =
    lanes.find(l => (l.branch?.shortName ?? l.branch?.name) === 'main') ??
    lanes.find(l => baseRef !== undefined && l.branch?.ref === baseRef) ??
    lanes.find(l => l.branch !== null)
  if (center !== undefined) {
    result[center.id] = 0
    used.add(0)
  }
  const rest = lanes.filter(l => l !== center)
  // Existing slots win before newly visible branches claim spare colors.
  for (const lane of rest) {
    const slot = previous[lane.id]
    if (
      Number.isInteger(slot) &&
      slot >= 0 &&
      slot < lanes.length &&
      !used.has(slot)
    ) {
      result[lane.id] = slot
      used.add(slot)
    } else {
      delete result[lane.id]
    }
  }
  for (const lane of rest) {
    if (result[lane.id] !== undefined) {
      continue
    }
    let slot = 0
    while (used.has(slot)) {
      slot++
    }
    result[lane.id] = slot
    used.add(slot)
  }
  return result
}

export interface ICompactEdge {
  readonly child: string
  readonly parent: string | null
  readonly boundary: 'hidden' | 'outside' | null
  readonly boundarySha?: string
  readonly skipped: number
}

/**
 * Collapse only actual parent paths within visible lanes. Never bridge through
 * hidden rows or infer edges from PR state. Junctions and tips are mandatory,
 * so the ten-node budget is soft when preserving topology requires more.
 */
export function compactGraph(
  nodes: ReadonlyArray<IGraphNode>,
  visible: ReadonlyArray<{ readonly lane: IGraphLane; readonly index: number }>,
  budget = 10
) {
  const visibleRows = new Set(visible.map(v => v.index))
  const tips = new Map(
    visible
      .filter(v => v.lane.branch !== null)
      .map(v => [v.lane.branch?.sha, v.index])
  )
  const all = new Map(nodes.map(n => [n.commit.sha, n]))
  const relevant = nodes
    .filter(n => visibleRows.has(n.lane) || tips.has(n.commit.sha))
    .map(n =>
      visibleRows.has(n.lane)
        ? n
        : { ...n, lane: tips.get(n.commit.sha) ?? n.lane }
    )
  const present = new Map(relevant.map(n => [n.commit.sha, n]))
  const mandatory = new Set<string>()
  const kinds = new Map<string, 'commit' | 'fork' | 'merge' | 'tip'>()
  const children = new Map<string, string[]>()
  for (const node of relevant) {
    const parents = node.commit.parents.filter(p => present.has(p))
    for (const p of parents) {
      children.set(p, [...(children.get(p) ?? []), node.commit.sha])
      if (present.get(p)?.lane !== node.lane) {
        mandatory.add(p)
        mandatory.add(node.commit.sha)
      }
    }
    if (parents.length > 1) {
      mandatory.add(node.commit.sha)
      kinds.set(node.commit.sha, 'merge')
    }
  }
  children.forEach((list, sha) => {
    if (list.length > 1) {
      mandatory.add(sha)
      kinds.set(sha, 'fork')
    }
  })
  for (const { lane, index } of visible) {
    const tip = lane.branch?.sha ?? lane.commits[0]?.sha
    if (tip !== undefined && present.has(tip)) {
      mandatory.add(tip)
      kinds.set(tip, 'tip')
    }
    // Nodes come newest first, so retain the oldest visible boundary.
    const end = relevant.filter(n => n.lane === index).at(-1)
    if (end !== undefined) {
      mandatory.add(end.commit.sha)
    }
  }
  for (const node of relevant) {
    if (mandatory.size >= budget) {
      break
    }
    mandatory.add(node.commit.sha)
  }
  const retained = relevant
    .filter(n => mandatory.has(n.commit.sha))
    .sort((a, b) => a.column - b.column)
    .map((n, column) => ({ ...n, column }))
  const edges: ICompactEdge[] = []
  for (const node of retained) {
    for (const start of node.commit.parents) {
      let sha: string | undefined = start
      let skipped = 0
      const visited = new Set<string>()
      while (sha !== undefined && !visited.has(sha)) {
        visited.add(sha)
        const p = present.get(sha)
        if (p === undefined) {
          edges.push({
            child: node.commit.sha,
            parent: null,
            boundary: all.has(sha) ? 'hidden' : 'outside',
            boundarySha: sha,
            skipped,
          })
          break
        }
        if (mandatory.has(sha)) {
          edges.push({
            child: node.commit.sha,
            parent: sha,
            boundary: null,
            skipped,
          })
          break
        }
        skipped++
        // Any branch between visible rows is mandatory above. Following first
        // parents here only collapses a linear path in the same visible row.
        sha = p.commit.parents[0]
      }
    }
  }
  return {
    nodes: retained,
    edges,
    kinds,
    omitted: relevant.length - retained.length,
  }
}
