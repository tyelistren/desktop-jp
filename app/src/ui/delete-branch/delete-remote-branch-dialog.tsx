import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'

import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { Branch } from '../../models/branch'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Ref } from '../lib/ref'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IDeleteRemoteBranchProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly branch: Branch
  readonly onDismissed: () => void
  readonly onDeleted: (repository: Repository) => void
}
interface IDeleteRemoteBranchState {
  readonly isDeleting: boolean
}
export class DeleteRemoteBranch extends React.Component<
  IDeleteRemoteBranchProps,
  IDeleteRemoteBranchState
> {
  public constructor(props: IDeleteRemoteBranchProps) {
    super(props)

    this.state = {
      isDeleting: false,
    }
  }

  public render() {
    return (
      <Dialog
        id="delete-branch"
        title={
          __DARWIN__
            ? translateUI('ui.delete-remote-branch.da20d97')
            : translateUI('ui.delete-remote-branch.5281ede')
        }
        type="warning"
        onSubmit={this.deleteBranch}
        onDismissed={this.props.onDismissed}
        disabled={this.state.isDeleting}
        loading={this.state.isDeleting}
        role="alertdialog"
        ariaDescribedBy="delete-branch-confirmation-message"
      >
        <DialogContent>
          <div id="delete-branch-confirmation-message">
            <p>
              {translateUIRich('ui.sentence.dd1efb450e7c', {
                p0: <Ref>{this.props.branch.name}</Ref>,
              })}
            </p>
            <p>{translateUI('ui.this-action-cannot-be-undone.951f495')}</p>

            <p>
              {translateUI(
                'ui.this-branch-does-not-exist-locally-deleting-it-m.5165d9b'
              )}
            </p>
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={translateUI('ui.delete.f6fdbe4')}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private deleteBranch = async () => {
    const { dispatcher, repository, branch } = this.props

    this.setState({ isDeleting: true })

    await dispatcher.deleteRemoteBranch(repository, branch)
    this.props.onDeleted(repository)

    this.props.onDismissed()
  }
}
