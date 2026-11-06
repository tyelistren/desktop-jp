import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Dispatcher } from '../dispatcher'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { RetryAction } from '../../models/retry-actions'
import { SignInResult } from '../../lib/stores'

const okButtonText = __DARWIN__
  ? translateUI('ui.continue-in-browser.5d69d8f')
  : translateUI('ui.continue-in-browser.fe5ef3d')

interface ISAMLReauthRequiredDialogProps {
  readonly dispatcher: Dispatcher
  readonly organizationName: string
  readonly endpoint: string

  /** The action to retry if applicable. */
  readonly retryAction?: RetryAction

  readonly onDismissed: () => void
}
interface ISAMLReauthRequiredDialogState {
  readonly loading: boolean
}
/**
 * The dialog shown when a Git network operation is denied due to
 * the organization owning the repository having enforced SAML
 * SSO and the current session not being authorized.
 */
export class SAMLReauthRequiredDialog extends React.Component<
  ISAMLReauthRequiredDialogProps,
  ISAMLReauthRequiredDialogState
> {
  public constructor(props: ISAMLReauthRequiredDialogProps) {
    super(props)
    this.state = { loading: false }
  }

  public render() {
    return (
      <Dialog
        title={
          __DARWIN__
            ? translateUI('ui.re-authorization-required.2e63abe')
            : translateUI('ui.re-authorization-required.bfe534b')
        }
        loading={this.state.loading}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSignIn}
        type="error"
      >
        <DialogContent>
          <p>
            {translateUIRich('ui.sentence.5760bbb3f1e8', {
              p0: this.props.organizationName,
            })}
          </p>
          <p>
            {translateUI(
              'ui.would-you-like-to-open-a-browser-to-grant-github.1a3c8f1'
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
    const { dispatcher, endpoint } = this.props

    const result = await new Promise<SignInResult>(async resolve => {
      dispatcher.beginBrowserBasedSignIn(endpoint, resolve)
    })

    if (result.kind === 'success' && this.props.retryAction) {
      dispatcher.performRetry(this.props.retryAction)
    }

    this.props.onDismissed()
  }
}
