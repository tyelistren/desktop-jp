import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { Banner } from './banner'
import { Dispatcher } from '../dispatcher'
import { LinkButton } from '../lib/link-button'

interface IRebaseConflictsBannerProps {
  readonly dispatcher: Dispatcher
  /** branch the user is rebasing into */
  readonly targetBranch: string
  /** callback to fire when the dialog should be reopened */
  readonly onOpenDialog: () => void
  /** callback to fire to dismiss the banner */
  readonly onDismissed: () => void
}

export class RebaseConflictsBanner extends React.Component<
  IRebaseConflictsBannerProps,
  {}
> {
  private openDialog = async () => {
    this.props.onDismissed()
    this.props.onOpenDialog()
    this.props.dispatcher.incrementMetric('rebaseConflictsDialogReopenedCount')
  }

  private onDismissed = () => {
    log.warn(
      `[RebaseConflictsBanner] this is not dismissable by default unless the user clicks on the link`
    )
  }

  public render() {
    return (
      <Banner
        id="rebase-conflicts-banner"
        dismissable={false}
        onDismissed={this.onDismissed}
      >
        <Octicon className="alert-icon" symbol={octicons.alert} />
        <div className="banner-message">
          <span>
            {translateUIRich('ui.sentence.82602772321f', {
              p0: <strong>{this.props.targetBranch}</strong>,
            })}
          </span>
          <LinkButton onClick={this.openDialog}>
            {translateUI('ui.view-conflicts.29fa950')}
          </LinkButton>
        </div>
      </Banner>
    )
  }
}
