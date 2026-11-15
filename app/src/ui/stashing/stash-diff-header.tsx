import { t } from '../../lib/localization'
import * as React from 'react'
import { IStashEntry } from '../../models/stash-entry'
import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { PopupType } from '../../models/popup'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { ErrorWithMetadata } from '../../lib/error-with-metadata'
import { Select } from '../lib/select'
import { RetryActionType } from '../../models/retry-actions'

interface IStashDiffHeaderProps {
  readonly stashEntries?: ReadonlyArray<IStashEntry>
  readonly stashEntry: IStashEntry
  readonly repository: Repository
  readonly dispatcher: Dispatcher
  readonly askForConfirmationOnDiscardStash: boolean
}

interface IStashDiffHeaderState {
  readonly isRestoring: boolean
  readonly isDiscarding: boolean
}

/**
 * Component to provide the actions that can be performed
 * on a stash while viewing a stash diff
 */
export class StashDiffHeader extends React.Component<
  IStashDiffHeaderProps,
  IStashDiffHeaderState
> {
  public constructor(props: IStashDiffHeaderProps) {
    super(props)

    this.state = {
      isRestoring: false,
      isDiscarding: false,
    }
  }

  public render() {
    const { isRestoring, isDiscarding } = this.state

    return (
      <div className="header">
        <h3>{t('stash.changes')}</h3>
        <Select
          label={t('stash.stack.select', {
            branch: this.props.stashEntry.branchName,
          })}
          value={this.props.stashEntry.stashSha}
          disabled={isRestoring || isDiscarding}
          onChange={this.onStashChanged}
        >
          {(this.props.stashEntries ?? [this.props.stashEntry]).map(
            (entry, index) => (
              <option key={entry.name} value={entry.stashSha}>
                {t('stash.stack.entry', {
                  number: String(index + 1),
                  sha: entry.stashSha.slice(0, 7),
                })}
              </option>
            )
          )}
        </Select>
        <div className="row">
          <OkCancelButtonGroup
            okButtonText={t('stash.restore')}
            okButtonDisabled={isRestoring || isDiscarding}
            onOkButtonClick={this.onRestoreClick}
            cancelButtonText={t('stash.discard')}
            cancelButtonDisabled={isRestoring || isDiscarding}
            onCancelButtonClick={this.onDiscardClick}
            okButtonAriaDescribedBy="restore-description"
          />
          <div className="explanatory-text" id="restore-description">
            <span className="text">{t('stash.restoreHelp')}</span>
          </div>
        </div>
      </div>
    )
  }

  private onStashChanged = (event: React.FormEvent<HTMLSelectElement>) => {
    this.props.dispatcher
      .selectBranchStash(this.props.repository, event.currentTarget.value)
      .catch(error => this.props.dispatcher.postError(error))
  }

  private onDiscardClick = async () => {
    const {
      dispatcher,
      repository,
      stashEntry,
      askForConfirmationOnDiscardStash,
    } = this.props

    if (!askForConfirmationOnDiscardStash) {
      this.setState({
        isDiscarding: true,
      })

      try {
        await dispatcher.dropStash(repository, stashEntry)
      } finally {
        this.setState({
          isDiscarding: false,
        })
      }
    } else {
      dispatcher.showPopup({
        type: PopupType.ConfirmDiscardStash,
        stash: stashEntry,
        repository,
      })
    }
  }

  private onRestoreClick = async () => {
    const { dispatcher, repository, stashEntry } = this.props

    try {
      this.setState({ isRestoring: true })
      await dispatcher.popStash(repository, stashEntry)
    } catch (err) {
      const errorWithMetadata = new ErrorWithMetadata(err, {
        repository: repository,
        retryAction: {
          type: RetryActionType.PopStash,
          stashEntry,
          repository,
        },
      })
      dispatcher.postError(errorWithMetadata)
    } finally {
      this.setState({ isRestoring: false })
    }
  }
}
