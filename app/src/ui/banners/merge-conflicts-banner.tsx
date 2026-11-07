import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { Banner } from './banner'
import { Dispatcher } from '../dispatcher'
import { Popup } from '../../models/popup'
import { LinkButton } from '../lib/link-button'

interface IMergeConflictsBannerProps {
  readonly dispatcher: Dispatcher
  /** branch the user is merging into */
  readonly ourBranch: string
  /** merge conflicts dialog popup to be shown by this banner */
  readonly popup: Popup
  readonly onDismissed: () => void
}

export class MergeConflictsBanner extends React.Component<
  IMergeConflictsBannerProps,
  {}
> {
  private openDialog = () => {
    this.props.onDismissed()
    this.props.dispatcher.showPopup(this.props.popup)
    this.props.dispatcher.incrementMetric('mergeConflictsDialogReopenedCount')
  }
  public render() {
    return (
      <Banner
        id="merge-conflicts-banner"
        dismissable={false}
        onDismissed={this.props.onDismissed}
      >
        <Octicon className="alert-icon" symbol={octicons.alert} />
        <div className="banner-message">
          <span>
            {translateUIRich('ui.sentence.bba17c2db33b', {
              p0: <strong>{this.props.ourBranch}</strong>,
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
