import { t } from '../../../lib/localization'
import { translateOperation } from '../../../lib/localization/operation'
import * as React from 'react'
import { Checkbox, CheckboxValue } from '../../lib/checkbox'
import { Dispatcher } from '../../dispatcher'
import { DialogFooter, DialogContent, Dialog } from '../../dialog'
import { OkCancelButtonGroup } from '../../dialog/ok-cancel-button-group'

interface IWarnForcePushProps {
  /**
   * This is expected to be capitalized for correct output on windows and macOs.
   *
   * Examples:
   *  - Rebase
   *  - Squash
   *  - Reorder
   *  - Amend
   */
  readonly operation: string
  readonly dispatcher: Dispatcher
  readonly askForConfirmationOnForcePush: boolean
  readonly onBegin: () => void
  readonly onDismissed: () => void
}

interface IWarnForcePushState {
  readonly askForConfirmationOnForcePush: boolean
}

export class WarnForcePushDialog extends React.Component<
  IWarnForcePushProps,
  IWarnForcePushState
> {
  public constructor(props: IWarnForcePushProps) {
    super(props)

    this.state = {
      askForConfirmationOnForcePush: props.askForConfirmationOnForcePush,
    }
  }

  public render() {
    const { onDismissed } = this.props
    const operation = translateOperation(this.props.operation)

    const title = t('operation.forceTitle', { operation })

    return (
      <Dialog
        title={title}
        onDismissed={onDismissed}
        onSubmit={this.onBegin}
        backdropDismissable={false}
        type="warning"
        role="alertdialog"
        ariaDescribedBy="warn-force-push-confirmation-title warn-force-push-confirmation-message"
      >
        <DialogContent>
          <p id="warn-force-push-confirmation-title">
            {t('operation.forceQuestion', { operation })}
          </p>
          <p id="warn-force-push-confirmation-message">
            {t('operation.forceWarning', { operation })}
          </p>
          <div>
            <Checkbox
              label={t('operation.dontShow')}
              value={
                this.state.askForConfirmationOnForcePush
                  ? CheckboxValue.Off
                  : CheckboxValue.On
              }
              onChange={this.onAskForConfirmationOnForcePushChanged}
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={t('operation.begin', { operation })}
            onCancelButtonClick={this.props.onDismissed}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onAskForConfirmationOnForcePushChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked

    this.setState({ askForConfirmationOnForcePush: value })
  }

  private onBegin = async () => {
    this.props.dispatcher.setConfirmForcePushSetting(
      this.state.askForConfirmationOnForcePush
    )

    this.props.onBegin()
  }
}
