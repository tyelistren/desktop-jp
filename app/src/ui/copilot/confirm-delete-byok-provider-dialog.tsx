import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Ref } from '../lib/ref'
import { IBYOKProvider } from '../../lib/copilot/byok'

interface IConfirmDeleteCopilotBYOKProviderDialogProps {
  readonly provider: IBYOKProvider
  readonly onConfirm: (provider: IBYOKProvider) => void
  readonly onDismissed: () => void
}

/**
 * Confirmation prompt shown before removing a BYOK Copilot provider. The
 * provider is removed from local storage and any stored secret is purged
 * from the OS keychain.
 */
export class ConfirmDeleteCopilotBYOKProviderDialog extends React.Component<IConfirmDeleteCopilotBYOKProviderDialogProps> {
  public render() {
    return (
      <Dialog
        id="confirm-delete-copilot-byok-provider"
        title={
          __DARWIN__
            ? translateUI('ui.remove-custom-provider.03927d8')
            : translateUI('ui.remove-custom-provider.58a29d9')
        }
        type="warning"
        onSubmit={this.onConfirm}
        onDismissed={this.props.onDismissed}
        role="alertdialog"
        ariaDescribedBy="confirm-delete-copilot-byok-provider-message"
      >
        <DialogContent>
          <p id="confirm-delete-copilot-byok-provider-message">
            {translateUIRich('ui.sentence.f8e5061951fb', {
              p0: <Ref>{this.props.provider.name}</Ref>,
              p1: this.renderSecretConsequence(),
            })}
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={
              __DARWIN__
                ? translateUI('ui.remove.e963907')
                : translateUI('ui.remove.e963907')
            }
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private renderSecretConsequence() {
    switch (this.props.provider.authKind) {
      case 'apiKey':
        return 'Its API key will also be removed from your keychain.'
      case 'bearer':
        return 'Its bearer token will also be removed from your keychain.'
      case 'none':
        return 'Any models you have configured for it will no longer be available.'
    }
  }

  private onConfirm = () => {
    this.props.onConfirm(this.props.provider)
    this.props.onDismissed()
  }
}
