import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import React from 'react'
import { parseRepositoryIdentifier } from '../../lib/remote-parsing'
import { ISubmoduleDiff } from '../../models/diff'
import { LinkButton } from '../lib/link-button'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { SuggestedAction } from '../suggested-actions'
import { Ref } from '../lib/ref'
import { CopyButton } from '../copy-button'
import { shortenSHA } from '../../models/commit'

type SubmoduleItemIcon =
  | {
      readonly octicon: typeof octicons.info
      readonly className: 'info-icon'
    }
  | {
      readonly octicon: typeof octicons.diffModified
      readonly className: 'modified-icon'
    }
  | {
      readonly octicon: typeof octicons.diffAdded
      readonly className: 'added-icon'
    }
  | {
      readonly octicon: typeof octicons.diffRemoved
      readonly className: 'removed-icon'
    }
  | {
      readonly octicon: typeof octicons.fileDiff
      readonly className: 'untracked-icon'
    }

interface ISubmoduleDiffProps {
  readonly onOpenSubmodule?: (fullPath: string) => void
  readonly diff: ISubmoduleDiff

  /**
   * Whether the diff is readonly, e.g., displaying a historical diff, or the
   * diff's content can be committed, e.g., displaying a change in the working
   * directory.
   */
  readonly readOnly: boolean
}

export class SubmoduleDiff extends React.Component<ISubmoduleDiffProps> {
  public constructor(props: ISubmoduleDiffProps) {
    super(props)
  }

  public render() {
    return (
      <div className="changes-interstitial submodule-diff">
        <div className="content">
          <div className="interstitial-header">
            <div className="text">
              <h1>{translateUI('ui.submodule-changes.5d4e25f')}</h1>
            </div>
          </div>
          {this.renderSubmoduleInfo()}
          {this.renderCommitChangeInfo()}
          {this.renderSubmodulesChangesInfo()}
          {this.renderOpenSubmoduleAction()}
        </div>
      </div>
    )
  }

  private renderSubmoduleInfo() {
    if (this.props.diff.url === null) {
      return null
    }

    const repoIdentifier = parseRepositoryIdentifier(this.props.diff.url)
    if (repoIdentifier === null) {
      return null
    }

    const hostname =
      repoIdentifier.hostname === 'github.com'
        ? ''
        : ` (${repoIdentifier.hostname})`

    return this.renderSubmoduleDiffItem(
      { octicon: octicons.info, className: 'info-icon' },
      <>
        {translateUIRich('ui.sentence.968cb09f7cf5', {
          p0: (
            <LinkButton
              uri={`https://${repoIdentifier.hostname}/${repoIdentifier.owner}/${repoIdentifier.name}`}
            >
              {repoIdentifier.owner}/{repoIdentifier.name}
              {hostname}
            </LinkButton>
          ),
        })}
      </>
    )
  }

  private renderCommitChangeInfo() {
    const { diff, readOnly } = this.props
    const { oldSHA, newSHA } = diff

    const verb = readOnly
      ? translateUI('ui.detail.was')
      : translateUI('ui.detail.hasBeen')
    const suffix = readOnly ? '' : translateUI('ui.detail.parentCommit')

    if (oldSHA !== null && newSHA !== null) {
      return this.renderSubmoduleDiffItem(
        { octicon: octicons.diffModified, className: 'modified-icon' },
        <>
          {translateUIRich('ui.sentence.62511c5d8fe0', {
            p0: this.renderCommitSHA(oldSHA, 'previous'),
            p1: this.renderCommitSHA(newSHA, 'new'),
            p2: suffix,
          })}
        </>
      )
    } else if (oldSHA === null && newSHA !== null) {
      return this.renderSubmoduleDiffItem(
        { octicon: octicons.diffAdded, className: 'added-icon' },
        <>
          {translateUIRich('ui.sentence.a1616663e110', {
            p0: verb,
            p1: this.renderCommitSHA(newSHA),
            p2: suffix,
          })}
        </>
      )
    } else if (oldSHA !== null && newSHA === null) {
      return this.renderSubmoduleDiffItem(
        { octicon: octicons.diffRemoved, className: 'removed-icon' },
        <>
          {translateUIRich('ui.sentence.cd6f50c8d253', {
            p0: verb,
            p1: this.renderCommitSHA(oldSHA),
            p2: suffix,
          })}
        </>
      )
    }

    return null
  }

  private renderCommitSHA(sha: string, which?: 'previous' | 'new') {
    const whichInfix = which === undefined ? '' : ` ${which}`

    return (
      <>
        <Ref>{shortenSHA(sha)}</Ref>
        <CopyButton
          ariaLabel={`Copy the full${whichInfix} SHA`}
          copyContent={sha}
        />
      </>
    )
  }

  private renderSubmodulesChangesInfo() {
    const { diff } = this.props

    if (!diff.status.untrackedChanges && !diff.status.modifiedChanges) {
      return null
    }

    const changes =
      diff.status.untrackedChanges && diff.status.modifiedChanges
        ? 'modified and untracked'
        : diff.status.untrackedChanges
        ? 'untracked'
        : 'modified'

    return this.renderSubmoduleDiffItem(
      { octicon: octicons.fileDiff, className: 'untracked-icon' },
      <>{translateUIRich('ui.sentence.e9b3766771f1', { p0: changes })}</>
    )
  }

  private renderSubmoduleDiffItem(
    icon: SubmoduleItemIcon,
    content: React.ReactElement
  ) {
    return (
      <div className="item">
        <Octicon symbol={icon.octicon} className={icon.className} />
        <div className="content">{content}</div>
      </div>
    )
  }

  private renderOpenSubmoduleAction() {
    // If no url is found for the submodule, it means it can't be opened
    // This happens if the user is looking at an old commit which references
    // a submodule that got later deleted.
    if (this.props.diff.url === null) {
      return null
    }

    return (
      <span>
        <SuggestedAction
          title={translateUI(
            'ui.open-this-submodule-on-github-desktop.7153eb1'
          )}
          description={translateUI(
            'ui.you-can-open-this-submodule-on-github-desktop-as.51af5ce'
          )}
          buttonText={
            __DARWIN__
              ? translateUI('ui.open-repository.7881001')
              : translateUI('ui.open-repository.47d70bc')
          }
          type="primary"
          onClick={this.onOpenSubmoduleClick}
        />
      </span>
    )
  }

  private onOpenSubmoduleClick = () => {
    this.props.onOpenSubmodule?.(this.props.diff.fullPath)
  }
}
