import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IAddSSHHostProps {
  readonly host: string
  readonly ip: string
  readonly keyType: string
  readonly fingerprint: string
  readonly onSubmit: (addHost: boolean) => void
  readonly onDismissed: () => void
}

/**
 * Dialog prompts the user to add a new SSH host as known.
 */
export class AddSSHHost extends React.Component<IAddSSHHostProps> {
  public render() {
    return (
      <Dialog
        id="add-ssh-host"
        type="normal"
        title={translateUI('ui.ssh-host.a34d122')}
        backdropDismissable={false}
        onSubmit={this.onSubmit}
        onDismissed={this.onCancel}
      >
        <DialogContent>
          <p>
            {translateUIRich('ui.sentence.ab4bdb641c26', {
              p0: this.props.host,
              p1: this.props.ip,
              p2: this.props.keyType,
              p3: this.props.fingerprint,
            })}
          </p>
          <p>
            {translateUI(
              'ui.are-you-sure-you-want-to-continue-connecting.6648aab'
            )}
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={translateUI('ui.yes.5397e05')}
            cancelButtonText={translateUI('ui.no.816c52f')}
            onCancelButtonClick={this.onCancel}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private submit(addHost: boolean) {
    const { onSubmit, onDismissed } = this.props

    onSubmit(addHost)
    onDismissed()
  }

  private onSubmit = () => {
    this.submit(true)
  }

  private onCancel = () => {
    this.submit(false)
  }
}
