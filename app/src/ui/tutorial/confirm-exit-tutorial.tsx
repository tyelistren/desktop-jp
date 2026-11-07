import { t as translateUI } from '../../lib/localization'
import * as React from 'react'

import { DialogFooter, DialogContent, Dialog } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IConfirmExitTutorialProps {
  readonly onDismissed: () => void
  readonly onContinue: () => boolean
}

export class ConfirmExitTutorial extends React.Component<
  IConfirmExitTutorialProps,
  {}
> {
  public render() {
    return (
      <Dialog
        title={
          __DARWIN__
            ? translateUI('ui.exit-tutorial.53029a9')
            : translateUI('ui.exit-tutorial.0ab3a06')
        }
        onDismissed={this.props.onDismissed}
        onSubmit={this.onContinue}
        type="normal"
      >
        <DialogContent>
          <p>
            {translateUI(
              'ui.are-you-sure-you-want-to-leave-the-tutorial-this.ee7e976'
            )}
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={
              __DARWIN__
                ? translateUI('ui.exit-tutorial.53029a9')
                : translateUI('ui.exit-tutorial.0ab3a06')
            }
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onContinue = () => {
    const dismissPopup = this.props.onContinue()

    if (dismissPopup) {
      this.props.onDismissed()
    }
  }
}
