import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'

import { Dispatcher } from '../dispatcher'

import { Repository } from '../../models/repository'
import { Branch } from '../../models/branch'
import { PullRequest } from '../../models/pull-request'

import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IDeleteBranchProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly branch: Branch
  readonly pullRequest: PullRequest
  readonly onDismissed: () => void
}

export class DeletePullRequest extends React.Component<IDeleteBranchProps, {}> {
  public render() {
    return (
      <Dialog
        id="delete-branch"
        title={
          __DARWIN__
            ? translateUI('ui.delete-branch.d6726bb')
            : translateUI('ui.delete-branch.5478e60')
        }
        type="warning"
        onDismissed={this.props.onDismissed}
        onSubmit={this.deleteBranch}
      >
        <DialogContent>
          <p>
            {translateUI(
              'ui.this-branch-may-have-an-open-pull-request-associ.a43cb3c'
            )}
          </p>
          <p>
            {translateUIRich('ui.sentence.26f5dd163073', {
              p0: (
                <LinkButton onClick={this.openPullRequest}>
                  #{this.props.pullRequest.pullRequestNumber}
                </LinkButton>
              ),
            })}
          </p>
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

  private openPullRequest = () => {
    this.props.dispatcher.showPullRequest(this.props.repository)
  }

  private deleteBranch = () => {
    this.props.dispatcher.deleteLocalBranch(
      this.props.repository,
      this.props.branch
    )

    return this.props.onDismissed()
  }
}
