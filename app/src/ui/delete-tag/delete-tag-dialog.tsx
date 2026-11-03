import { t } from '../../lib/localization'
import * as React from 'react'

import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IDeleteTagProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly tagName: string
  readonly onDismissed: () => void
}

interface IDeleteTagState {
  readonly isDeleting: boolean
}

export class DeleteTag extends React.Component<
  IDeleteTagProps,
  IDeleteTagState
> {
  public constructor(props: IDeleteTagProps) {
    super(props)

    this.state = {
      isDeleting: false,
    }
  }

  public render() {
    return (
      <Dialog
        id="delete-tag"
        title={__DARWIN__ ? t('tag.deleteMac') : t('tag.delete')}
        type="warning"
        onSubmit={this.DeleteTag}
        onDismissed={this.props.onDismissed}
        disabled={this.state.isDeleting}
        loading={this.state.isDeleting}
        role="alertdialog"
        ariaDescribedBy="delete-tag-confirmation"
      >
        <DialogContent>
          <p id="delete-tag-confirmation">
            {t('tag.deleteQuestion', { tag: this.props.tagName })}
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={t('action.delete')}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private DeleteTag = async () => {
    const { dispatcher, repository, tagName } = this.props

    this.setState({ isDeleting: true })

    await dispatcher.deleteTag(repository, tagName)
    this.props.onDismissed()
  }
}
