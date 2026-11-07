import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Row } from '../lib/row'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { LinkButton } from '../lib/link-button'

interface IConfirmCommitFilteredChangesProps {
  readonly onCommitAnyway: () => void
  readonly onDismissed: () => void
  readonly showFilesToBeCommitted: () => void
  readonly setConfirmCommitFilteredChanges: (value: boolean) => void
}

interface IConfirmCommitFilteredChangesState {
  readonly askForConfirmationOnCommitFilteredChanges: boolean
}

export class ConfirmCommitFilteredChanges extends React.Component<
  IConfirmCommitFilteredChangesProps,
  IConfirmCommitFilteredChangesState
> {
  public constructor(props: IConfirmCommitFilteredChangesProps) {
    super(props)

    this.state = {
      askForConfirmationOnCommitFilteredChanges: true,
    }
  }

  public render() {
    return (
      <Dialog
        id="hidden-changes"
        type="warning"
        title={
          __DARWIN__
            ? translateUI('ui.commit-filtered-changes.3a367a7')
            : translateUI('ui.commit-filtered-changes.ea8808b')
        }
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
        role="alertdialog"
        ariaDescribedBy="confirm-commit-filtered-changes-message"
      >
        <DialogContent>
          <p id="confirm-commit-filtered-changes-message">
            {translateUIRich('ui.sentence.02827847f0e9', {
              p0: (
                <LinkButton onClick={this.showFilesToBeCommitted}>
                  {translateUI('ui.hidden-changes.db09492')}
                </LinkButton>
              ),
            })}
          </p>
          <Row>
            <Checkbox
              label={translateUI('ui.do-not-show-this-message-again.afe501e')}
              value={
                this.state.askForConfirmationOnCommitFilteredChanges
                  ? CheckboxValue.Off
                  : CheckboxValue.On
              }
              onChange={this.onShowMessageChange}
            />
          </Row>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={
              __DARWIN__
                ? translateUI('ui.commit-anyway.ced8790')
                : translateUI('ui.commit-anyway.ce72911')
            }
            cancelButtonText={translateUI('ui.cancel.77dfd21')}
            onCancelButtonClick={this.props.onDismissed}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onShowMessageChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = !event.currentTarget.checked

    this.setState({ askForConfirmationOnCommitFilteredChanges: value })
  }

  private showFilesToBeCommitted = () => {
    this.props.showFilesToBeCommitted()
    this.props.onDismissed()
  }

  private onSubmit = () => {
    this.props.setConfirmCommitFilteredChanges(
      this.state.askForConfirmationOnCommitFilteredChanges
    )
    this.props.onCommitAnyway()
    this.props.onDismissed()
  }
}
