import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { Banner } from './banner'
import { LinkButton } from '../lib/link-button'

interface IConflictsFoundBannerProps {
  /**
   * Description of the operation to continue
   * Examples:
   *  - rebasing <strong>target-branch-name</strong>
   *  - cherry-picking onto <strong>target-branch-name</strong>
   *  - squashing commits on <strong>target-branch-name</strong>
   */
  readonly operationDescription: string | JSX.Element
  /** Callback to fire when the dialog should be reopened */
  readonly onOpenConflictsDialog: () => void
  /** Callback to fire to dismiss the banner */
  readonly onDismissed: () => void
}

export class ConflictsFoundBanner extends React.Component<
  IConflictsFoundBannerProps,
  {}
> {
  private openDialog = async () => {
    this.props.onDismissed()
    this.props.onOpenConflictsDialog()
  }

  private onDismissed = () => {
    log.warn(
      `[ConflictsBanner] This cannot be dismissed by default unless the user clicks on the link`
    )
  }

  public render() {
    return (
      <Banner
        id="conflicts-found-banner"
        dismissable={false}
        onDismissed={this.onDismissed}
      >
        <Octicon className="alert-icon" symbol={octicons.alert} />
        <div className="banner-message">
          <span>
            {translateUIRich('ui.sentence.831098620372', {
              p0: this.props.operationDescription,
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
