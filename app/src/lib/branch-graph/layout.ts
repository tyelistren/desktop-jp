/** Local ancestry only. PR metadata must never create edges in this model. */
export interface IGraphCommit {
  readonly sha: string
  readonly parents: ReadonlyArray<string>
  readonly time: number
  readonly summary: string
}

export interface IGraphBranch {
  readonly ref: string
  readonly name: string
  readonly shortName?: string
  readonly sha: string
}

export interface IGraphLane {
  readonly id: string
  readonly branch: IGraphBranch | null
  readonly commits: ReadonlyArray<IGraphCommit>
  readonly fork: string | null
}

export interface IGraphNode {
  readonly commit: IGraphCommit
  readonly lane: number
  readonly column: number
}

/**
 * Assign first-parent histories to branch rows, reserving main first. Remaining
 * merged histories have anonymous rows: Git does not retain deleted ref names.
 * Input is Git's child-before-parent topo order. Columns preserve ancestry even
 * when commit clocks are skewed. They are time order, not elapsed-time scale.
 */
export function buildGraph(
  commits: ReadonlyArray<IGraphCommit>,
  branches: ReadonlyArray<IGraphBranch>,
  defaultRef: string | undefined
) {
  const bySha = new Map(commits.map(c => [c.sha, c]))
  const owner = new Map<string, number>()
  const lanes: IGraphLane[] = []
  const priority = (b: IGraphBranch) =>
    (b.shortName ?? b.name) === 'main'
      ? 0
      : (b.shortName ?? b.name) === 'master'
      ? 1
      : (b.shortName ?? b.name) === 'development' ||
        (b.shortName ?? b.name) === 'develop'
      ? 2
      : b.ref === defaultRef
      ? 3
      : 4
  // The oldest available first-parent commit is an ordering hint, never a
  // claimed branch creation timestamp (refs have no portable creation date).
  const firstTime = (b: IGraphBranch) => {
    let c = bySha.get(b.sha)
    let time = c?.time ?? Number.MAX_SAFE_INTEGER
    const seen = new Set<string>()
    while (c !== undefined && !owner.has(c.sha) && !seen.has(c.sha)) {
      seen.add(c.sha)
      time = c.time
      c = bySha.get(c.parents[0])
    }
    return time
  }
  const addLane = (branch: IGraphBranch | null, tip: string) => {
    const history: IGraphCommit[] = []
    let c = bySha.get(tip)
    const index = lanes.length
    while (c !== undefined && !owner.has(c.sha)) {
      owner.set(c.sha, index)
      history.push(c)
      c = bySha.get(c.parents[0])
    }
    lanes.push({
      id: branch?.ref ?? `history:${tip}`,
      branch,
      commits: history,
      fork: c?.sha ?? null,
    })
  }
  const major = branches
    .filter(b => priority(b) < 4)
    .sort((a, b) => priority(a) - priority(b) || a.ref.localeCompare(b.ref))
  major.forEach(b => addLane(b, b.sha))
  branches
    .filter(b => priority(b) === 4)
    .sort((a, b) => firstTime(a) - firstTime(b) || a.ref.localeCompare(b.ref))
    .forEach(b => addLane(b, b.sha))
  commits.forEach(c => {
    if (!owner.has(c.sha)) {
      addLane(null, c.sha)
    }
  })
  const nodes: IGraphNode[] = commits.map((commit, index) => ({
    commit,
    lane: owner.get(commit.sha) ?? 0,
    column: commits.length - index - 1,
  }))
  return { lanes, nodes }
}

export interface IGraphSettings {
  readonly maxBranches: number
  readonly hideMerged: boolean
  readonly upstream: boolean
  readonly colorSlots: Readonly<Record<string, number>>
  readonly collapsed: boolean
  readonly height: number
  readonly main: boolean
  readonly development: boolean
  readonly current: boolean
  readonly unmerged: boolean
  readonly merged: boolean
  readonly deleted: boolean
  readonly dormant: boolean
  readonly overrides: Readonly<Record<string, boolean>>
}

export const defaultGraphSettings: IGraphSettings = {
  maxBranches: 3,
  hideMerged: true,
  upstream: false,
  colorSlots: {},
  collapsed: false,
  height: 220,
  main: true,
  development: true,
  current: true,
  unmerged: true,
  merged: true,
  deleted: true,
  dormant: true,
  overrides: {},
}

/** Treat persisted preferences as untrusted and tolerate old/corrupt data. */
export function parseGraphSettings(raw: string | null): IGraphSettings {
  try {
    const value: unknown = JSON.parse(raw ?? 'null')
    if (value === null || typeof value !== 'object') {
      return defaultGraphSettings
    }
    const readBoolean = (key: keyof IGraphSettings, fallback: boolean) =>
      key in value && typeof Reflect.get(value, key) === 'boolean'
        ? Reflect.get(value, key) === true
        : fallback
    const h: unknown = Reflect.get(value, 'height')
    const overrides: Record<string, boolean> = Object.create(null)
    const o: unknown = Reflect.get(value, 'overrides')
    if (o !== null && typeof o === 'object') {
      Object.entries(o).forEach(([k, v]) => {
        if (typeof v === 'boolean') {
          overrides[k] = v
        }
      })
    }
    const max: unknown = Reflect.get(value, 'maxBranches')
    const colors: unknown = Reflect.get(value, 'colorSlots')
    const colorSlots: Record<string, number> = Object.create(null)
    if (colors !== null && typeof colors === 'object') {
      Object.entries(colors).forEach(([key, slot]) => {
        if (
          typeof slot === 'number' &&
          Number.isInteger(slot) &&
          slot >= 0 &&
          slot < 20
        ) {
          colorSlots[key] = slot
        }
      })
    }
    return {
      maxBranches:
        typeof max === 'number' && Number.isFinite(max)
          ? Math.max(2, Math.min(20, Math.round(max)))
          : 3,
      hideMerged: readBoolean('hideMerged', true),
      upstream: readBoolean('upstream', false),
      colorSlots,
      collapsed: readBoolean('collapsed', false),
      height:
        typeof h === 'number' && Number.isFinite(h)
          ? Math.max(100, Math.min(500, h))
          : 220,
      main: readBoolean('main', true),
      development: readBoolean('development', true),
      current: readBoolean('current', true),
      unmerged: readBoolean('unmerged', true),
      merged: readBoolean('merged', true),
      deleted: readBoolean('deleted', true),
      dormant: readBoolean('dormant', true),
      overrides,
    }
  } catch {
    return defaultGraphSettings
  }
}

/** Order combined history/tip snapshots child-first, breaking ties by date. */
export function orderGraphCommits(
  commits: ReadonlyArray<IGraphCommit>
): ReadonlyArray<IGraphCommit> {
  const bySha = new Map(commits.map(c => [c.sha, c]))
  const childCounts = new Map(Array.from(bySha.keys(), sha => [sha, 0]))
  bySha.forEach(c =>
    c.parents.forEach(p => {
      if (childCounts.has(p)) {
        childCounts.set(p, (childCounts.get(p) ?? 0) + 1)
      }
    })
  )
  const ready = Array.from(bySha.values()).filter(
    c => childCounts.get(c.sha) === 0
  )
  const result: IGraphCommit[] = []
  while (ready.length > 0) {
    ready.sort((a, b) => b.time - a.time || a.sha.localeCompare(b.sha))
    const commit = ready.shift()
    if (commit === undefined) {
      break
    }
    result.push(commit)
    commit.parents.forEach(p => {
      const count = childCounts.get(p)
      if (count === undefined) {
        return
      }
      childCounts.set(p, count - 1)
      const parent = bySha.get(p)
      if (count === 1 && parent !== undefined) {
        ready.push(parent)
      }
    })
  }
  return result
}
