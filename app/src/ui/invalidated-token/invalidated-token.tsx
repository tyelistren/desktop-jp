import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Dispatcher } from '../dispatcher'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Account, isEnterpriseAccount } from '../../models/account'
import { getHTMLURL } from '../../lib/api'
import { Ref } from '../lib/ref'

interface IInvalidatedTokenProps {
  readonly dispatcher: Pick<
    Dispatcher,
    'showEnterpriseSignInDialog' | 'showDotComSignInDialog'
  >
  readonly account: Account
  readonly onDismissed: () => void
}

/**
 * Dialog that alerts user that their GitHub (Enterprise) account token is not
 * valid and they need to sign in again.
 */
export class InvalidatedToken extends React.Component<IInvalidatedTokenProps> {
  public render() {
    const { account } = this.props

    return (
      <Dialog
        id="invalidated-token"
        type="warning"
        title={
          __DARWIN__
            ? translateUI('ui.invalidated-account-token.b305bb8')
            : translateUI('ui.invalidated-account-token.1085c4d')
        }
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          {translateUIRich('ui.sentence.eb4ae23d4a37', {
            p0: <Ref>{account.friendlyEndpoint}</Ref>,
          })}
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={translateUI('ui.yes.5397e05')}
            cancelButtonText={translateUI('ui.no.816c52f')}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSubmit = () => {
    const { dispatcher, onDismissed, account } = this.props

    onDismissed()

    if (isEnterpriseAccount(account)) {
      dispatcher.showEnterpriseSignInDialog(
        getHTMLURL(this.props.account.endpoint)
      )
    } else {
      dispatcher.showDotComSignInDialog()
    }
  }
}
