import { t } from '../../../lib/localization'
import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../../dialog'
import { OkCancelButtonGroup } from '../../dialog/ok-cancel-button-group'

interface ICopilotConflictResolutionAlwaysNudgeProps {
  readonly onAlwaysUseCopilot: () => void
  readonly onDecline: () => void
  readonly onDismissed: () => void
}

/**
 * Dialog nudging the user to enable the "Always use Copilot when conflicts are
 * detected" setting after they've used Copilot conflict resolution multiple
 * times in a row.
 */
export class CopilotConflictResolutionAlwaysNudge extends React.Component<ICopilotConflictResolutionAlwaysNudgeProps> {
  private onYes = () => {
    this.props.onAlwaysUseCopilot()
  }

  private onNo = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    this.props.onDecline()
  }

  public render() {
    return (
      <Dialog
        id="copilot-conflict-resolution-always-nudge"
        title={t('resolution.alwaysTitle')}
        onSubmit={this.onYes}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <p>
            {t('resolution.alwaysHelp', {
              settings: t(
                __DARWIN__ ? 'resolution.settingsMac' : 'resolution.settingsWin'
              ),
            })}
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={t('resolution.yes')}
            cancelButtonText={t('resolution.no')}
            onCancelButtonClick={this.onNo}
          />
        </DialogFooter>
      </Dialog>
    )
  }
}
