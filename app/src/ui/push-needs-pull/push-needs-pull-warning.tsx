import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { Dispatcher } from '../dispatcher'
import { DialogFooter, DialogContent, Dialog } from '../dialog'
import { FetchType } from '../../models/fetch'
import { Repository } from '../../models/repository'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IPushNeedsPullWarningProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly onDismissed: () => void
}

interface IPushNeedsPullWarningState {
  readonly isLoading: boolean
}

export class PushNeedsPullWarning extends React.Component<
  IPushNeedsPullWarningProps,
  IPushNeedsPullWarningState
> {
  public constructor(props: IPushNeedsPullWarningProps) {
    super(props)

    this.state = {
      isLoading: false,
    }
  }

  public render() {
    return (
      <Dialog
        title={
          __DARWIN__
            ? translateUI('ui.newer-commits-on-remote.1aad725')
            : translateUI('ui.newer-commits-on-remote.5e43630')
        }
        dismissDisabled={this.state.isLoading}
        disabled={this.state.isLoading}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onFetch}
        loading={this.state.isLoading}
        type="warning"
      >
        <DialogContent>
          <p>
            {translateUI(
              'ui.github-desktop-is-unable-to-push-commits-to-this.107eb4e'
            )}
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={translateUI('ui.fetch.d48aafe')}
            okButtonDisabled={this.state.isLoading}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onFetch = async () => {
    this.setState({ isLoading: true })
    await this.props.dispatcher.fetch(
      this.props.repository,
      FetchType.UserInitiatedTask
    )
    this.setState({ isLoading: false })
    this.props.onDismissed()
  }
}
