import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Dispatcher } from '../dispatcher'
import { Ref } from '../lib/ref'
import { RepositoryWithGitHubRepository } from '../../models/repository'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { SignInResult } from '../../lib/stores'

const okButtonText = __DARWIN__
  ? translateUI('ui.continue-in-browser.5d69d8f')
  : translateUI('ui.continue-in-browser.fe5ef3d')

interface IWorkflowPushRejectedDialogProps {
  readonly rejectedPath: string
  readonly repository: RepositoryWithGitHubRepository
  readonly dispatcher: Dispatcher
  readonly onDismissed: () => void
}
interface IWorkflowPushRejectedDialogState {
  readonly loading: boolean
}
/**
 * The dialog shown when a push is rejected due to it modifying a
 * workflow file without the workflow oauth scope.
 */
export class WorkflowPushRejectedDialog extends React.Component<
  IWorkflowPushRejectedDialogProps,
  IWorkflowPushRejectedDialogState
> {
  public constructor(props: IWorkflowPushRejectedDialogProps) {
    super(props)
    this.state = { loading: false }
  }

  public render() {
    return (
      <Dialog
        id="workflow-push-rejected"
        title={
          __DARWIN__
            ? translateUI('ui.push-rejected.bfedfb1')
            : translateUI('ui.push-rejected.ee3f516')
        }
        loading={this.state.loading}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSignIn}
        type="error"
      >
        <DialogContent>
          <p>
            {translateUIRich('ui.sentence.01cbb58a08ea', {
              p0: <Ref>{this.props.rejectedPath}</Ref>,
            })}
          </p>
          <p>
            {translateUI(
              'ui.would-you-like-to-open-a-browser-to-grant-github.4c155c4'
            )}
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup okButtonText={okButtonText} />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSignIn = async () => {
    this.setState({ loading: true })

    const { repository, dispatcher } = this.props
    const { endpoint } = repository.gitHubRepository

    const result = await new Promise<SignInResult>(async resolve => {
      dispatcher.beginBrowserBasedSignIn(endpoint, resolve)
    })

    if (result.kind === 'success') {
      dispatcher.push(repository)
    }

    this.props.onDismissed()
  }
}
