import { Repository } from '../../models/repository'
import { Branch } from '../../models/branch'
import { getCommits } from '../git/log'
import { getStashes } from '../git/stash'
import { git } from '../git/core'
import { IGraphCommit, orderGraphCommits } from './layout'

/** A bounded, offline snapshot. Only read-only Git commands are used. */
export async function loadBranchGraph(
  repository: Repository,
  base: Branch | null,
  limit: number
) {
  const [history, tips, stashes, merged] = await Promise.all([
    getCommits(repository, undefined, limit, undefined, [
      '--branches',
      '--remotes',
      '--topo-order',
    ]),
    getCommits(repository, undefined, undefined, undefined, [
      '--branches',
      '--remotes',
      '--no-walk=sorted',
    ]),
    getStashes(repository),
    base === null
      ? Promise.resolve(null)
      : git(
          [
            'for-each-ref',
            `--merged=${base.tip.sha}`,
            '--format=%(refname)',
            '--',
            'refs/heads/',
            'refs/remotes/',
          ],
          repository.path,
          'branchGraphMergedRefs'
        ),
  ])
  const commits: ReadonlyArray<IGraphCommit> = [...history, ...tips].map(c => ({
    sha: c.sha,
    parents: c.parentSHAs,
    time: c.committer.date.getTime(),
    summary: c.summary,
  }))
  return {
    commits: orderGraphCommits(commits),
    stashes: stashes.desktopEntries,
    merged: merged === null ? null : new Set(merged.stdout.trim().split('\n')),
    truncated: history.length === limit,
  }
}
