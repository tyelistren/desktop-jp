import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { copilotAppMarketingUrl } from '../../lib/copilot-app'
import { Dialog, DialogContent, DefaultDialogFooter } from '../dialog'
import { LinkButton } from '../lib/link-button'

interface ICopilotAppNotFoundDialogProps {
  readonly onDismissed: () => void
  readonly showPreferencesDialog: () => void
}

/** Help the user install or configure GitHub Copilot when it cannot be found. */
export class CopilotAppNotFoundDialog extends React.Component<ICopilotAppNotFoundDialogProps> {
  private onShowPreferences = () => {
    this.props.onDismissed()
    this.props.showPreferencesDialog()
  }

  public render() {
    return (
      <Dialog
        id="copilot-app"
        title="GitHub Copilot"
        onDismissed={this.props.onDismissed}
        onSubmit={this.props.onDismissed}
      >
        <DialogContent>
          <p>
            {translateUIRich('ui.sentence.031ff2b180d7', {
              p0: (
                <LinkButton uri={copilotAppMarketingUrl}>
                  {translateUI('ui.downloading-github-copilot.28581e9')}
                </LinkButton>
              ),
            })}
          </p>
          <p>
            {translateUIRich('ui.sentence.72c586a925f3', {
              p0: (
                <LinkButton onClick={this.onShowPreferences}>
                  {translateUI('ui.preferences.9dfd349')}
                </LinkButton>
              ),
            })}
          </p>
        </DialogContent>
        <DefaultDialogFooter />
      </Dialog>
    )
  }
}
