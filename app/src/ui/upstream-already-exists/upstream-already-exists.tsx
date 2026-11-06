import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Repository } from '../../models/repository'
import { IRemote } from '../../models/remote'
import { Ref } from '../lib/ref'
import { forceUnwrap } from '../../lib/fatal-error'
import { UpstreamRemoteName } from '../../lib/stores'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IUpstreamAlreadyExistsProps {
  readonly repository: Repository
  readonly existingRemote: IRemote

  readonly onDismissed: () => void

  /** Called when the user chooses to update the existing remote. */
  readonly onUpdate: (repository: Repository) => void

  /** Called when the user chooses to ignore the warning. */
  readonly onIgnore: (repository: Repository) => void
}

/**
 * The dialog shown when a repository is a fork but its upstream remote doesn't
 * point to the parent repository.
 */
export class UpstreamAlreadyExists extends React.Component<IUpstreamAlreadyExistsProps> {
  public render() {
    const name = this.props.repository.name
    const gitHubRepository = forceUnwrap(
      'A repository must have a GitHub repository to add an upstream remote',
      this.props.repository.gitHubRepository
    )
    const parent = forceUnwrap(
      'A repository must have a parent repository to add an upstream remote',
      gitHubRepository.parent
    )
    const parentName = parent.fullName
    const existingURL = this.props.existingRemote.url
    const replacementURL = parent.cloneURL
    return (
      <Dialog
        title={
          __DARWIN__
            ? translateUI('ui.upstream-already-exists.16cd81a')
            : translateUI('ui.upstream-already-exists.d8a4acf')
        }
        onDismissed={this.props.onDismissed}
        onSubmit={this.onUpdate}
        type="warning"
      >
        <DialogContent>
          <p>
            {translateUIRich('ui.sentence.67a35a0531f2', {
              p0: <Ref>{name}</Ref>,
              p1: <Ref>{parentName}</Ref>,
              p2: <Ref>{UpstreamRemoteName}</Ref>,
            })}
          </p>
          <ul>
            <li>
              {translateUIRich('ui.sentence.bf65dbf98500', {
                p0: <Ref>{existingURL}</Ref>,
              })}
            </li>
            <li>
              {translateUIRich('ui.sentence.cc3a25423fc6', {
                p0: <Ref>{replacementURL}</Ref>,
              })}
            </li>
          </ul>
          <p>
            {translateUI(
              'ui.would-you-like-to-update-the-remote-to-use-the-e.7834e76'
            )}
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={translateUI('ui.update.fb91e24')}
            cancelButtonText={translateUI('ui.ignore.98f55db')}
            onCancelButtonClick={this.onIgnore}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onUpdate = () => {
    this.props.onUpdate(this.props.repository)
    this.props.onDismissed()
  }

  private onIgnore = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    this.props.onIgnore(this.props.repository)
    this.props.onDismissed()
  }
}
