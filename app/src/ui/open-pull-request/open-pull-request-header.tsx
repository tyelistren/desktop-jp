import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { Branch } from '../../models/branch'
import { BranchSelect } from '../branches/branch-select'
import { DialogHeader } from '../dialog/header'
import { Ref } from '../lib/ref'
import { Repository } from '../../models/repository'
import { IChangesetData } from '../../lib/git'

export const OpenPullRequestDialogId = 'Dialog_Open_Pull_Request'

interface IOpenPullRequestDialogHeaderProps {
  readonly repository: Repository

  /** The base branch of the pull request */
  readonly baseBranch: Branch | null

  /** The branch of the pull request */
  readonly currentBranch: Branch

  /**
   * See IBranchesState.defaultBranch
   */
  readonly defaultBranch: Branch | null

  /**
   * Branches in the repo with the repo's default remote
   *
   * We only want branches that are also on dotcom such that, when we ask a user
   * to create a pull request, the base branch also exists on dotcom.
   */
  readonly prBaseBranches: ReadonlyArray<Branch>

  /**
   * Recent branches with the repo's default remote
   *
   * We only want branches that are also on dotcom such that, when we ask a user
   * to create a pull request, the base branch also exists on dotcom.
   */
  readonly prRecentBaseBranches: ReadonlyArray<Branch>

  /** The count of commits of the pull request */
  readonly commitCount: number

  /** The changeset data associated with the selected commit */
  readonly changesetData: IChangesetData

  /** When the branch selection changes */
  readonly onBranchChange: (branch: Branch) => void

  /**
   * Event triggered when the dialog is dismissed by the user in the
   * ways described in the dismissable prop.
   */
  readonly onDismissed?: () => void
}

/**
 * A header component for the open pull request dialog. Made to house the
 * base branch dropdown and merge details common to all pull request views.
 */
export class OpenPullRequestDialogHeader extends React.Component<IOpenPullRequestDialogHeaderProps> {
  public constructor(props: IOpenPullRequestDialogHeaderProps) {
    super(props)
  }

  public render() {
    const title = __DARWIN__
      ? translateUI('ui.open-a-pull-request.4c48a93')
      : translateUI('ui.open-a-pull-request.f9c1ac2')
    const {
      baseBranch,
      currentBranch,
      changesetData,
      defaultBranch,
      prBaseBranches,
      prRecentBaseBranches,
      commitCount,
      onBranchChange,
      onDismissed,
    } = this.props
    const { linesAdded, linesDeleted } = changesetData
    const commits = `${commitCount} commit${commitCount > 1 ? 's' : ''}`

    return (
      <DialogHeader
        title={title}
        titleId={OpenPullRequestDialogId}
        onCloseButtonClick={onDismissed}
      >
        <div className="break"></div>
        <div className="base-branch-details">
          {translateUIRich('ui.sentence.144c8358c510', {
            p0: commits,
            p1: (
              <BranchSelect
                repository={this.props.repository}
                branch={baseBranch}
                defaultBranch={defaultBranch}
                currentBranch={currentBranch}
                allBranches={prBaseBranches}
                recentBranches={prRecentBaseBranches}
                onChange={onBranchChange}
                noBranchesMessage={
                  <>
                    <p>
                      {translateUI(
                        'ui.sorry-i-can-t-find-that-remote-branch.c8a32c3'
                      )}
                    </p>
                    <p>
                      {translateUI(
                        'ui.you-can-only-open-pull-requests-against-remote-b.661ff9d'
                      )}
                    </p>
                  </>
                }
              />
            ),
            p2: <Ref>{currentBranch.name}</Ref>,
          })}
        </div>
        <div className="lines-added-deleted">
          <span className="sr-only">
            {translateUI('ui.lines-changed.dd49037')}
          </span>
          <span className="lines-added">
            {translateUIRich('ui.sentence.460e096e6ecd', { p0: linesAdded })}
          </span>
          <span>, </span>
          <span className="lines-deleted">
            {translateUIRich('ui.sentence.e927c532379a', { p0: linesDeleted })}
          </span>
        </div>
      </DialogHeader>
    )
  }
}
