import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { Repository } from '../../models/repository'
import { WorkingDirectoryFileChange } from '../../models/status'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  OkCancelButtonGroup,
} from '../dialog'
import { Dispatcher } from '../dispatcher'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { LinkButton } from '../lib/link-button'
import { Row } from '../lib/row'

interface IGenerateCommitMessageOverrideWarningProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly filesSelected: ReadonlyArray<WorkingDirectoryFileChange>
  readonly showCopilotInstructionsTip: boolean

  /**
   * Callback to use when the dialog gets closed.
   */
  readonly onDismissed: () => void
}

interface IGenerateCommitMessageOverrideWarningState {
  readonly confirmCommitMessageOverride: boolean
}

export class GenerateCommitMessageOverrideWarning extends React.Component<
  IGenerateCommitMessageOverrideWarningProps,
  IGenerateCommitMessageOverrideWarningState
> {
  public constructor(props: IGenerateCommitMessageOverrideWarningProps) {
    super(props)

    this.state = {
      confirmCommitMessageOverride: true,
    }
  }

  public render() {
    const ariaDescribedBy = this.props.showCopilotInstructionsTip
      ? 'generate-commit-message-override-warning-body generate-commit-message-override-warning-tip'
      : 'generate-commit-message-override-warning-body'

    return (
      <Dialog
        title={translateUI('ui.commit-message-override.24ddf86')}
        id="generate-commit-message-override-warning"
        type="warning"
        onDismissed={this.props.onDismissed}
        onSubmit={this.onOverride}
        ariaDescribedBy={ariaDescribedBy}
        role="alertdialog"
      >
        <DialogContent>
          <Row id="generate-commit-message-override-warning-body">
            {translateUI(
              'ui.the-commit-message-you-have-entered-will-be-over.3c3f8e0'
            )}
          </Row>
          {this.props.showCopilotInstructionsTip ? (
            <Row>
              <p id="generate-commit-message-override-warning-tip">
                {translateUIRich('ui.sentence.102e6dc234dd', {
                  p0: (
                    <LinkButton uri="https://gh.io/desktop-copilot-custom-instructions">
                      {translateUI('ui.copilot-instructions.b0d72c8')}
                    </LinkButton>
                  ),
                })}
              </p>
            </Row>
          ) : null}
          <Row>
            <Checkbox
              label={translateUI('ui.do-not-show-this-message-again.afe501e')}
              value={
                this.state.confirmCommitMessageOverride
                  ? CheckboxValue.Off
                  : CheckboxValue.On
              }
              onChange={this.onConfirmCommitMessageOverrideChanged}
            />
          </Row>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={translateUI('ui.override.8421926')}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onConfirmCommitMessageOverrideChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked
    this.setState({ confirmCommitMessageOverride: value })
  }

  private onOverride = async () => {
    if (!this.state.confirmCommitMessageOverride) {
      await this.props.dispatcher.setConfirmCommitMessageOverrideSetting(false)
    }

    this.props.dispatcher.generateCommitMessage(
      this.props.repository,
      this.props.filesSelected
    )
    this.props.onDismissed()
  }
}
