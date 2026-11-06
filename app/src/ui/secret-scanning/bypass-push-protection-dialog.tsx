import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { ISecretScanResult } from './push-protection-error-dialog'
import { VerticalSegmentedControl } from '../lib/vertical-segmented-control'

export enum BypassReason {
  FalsePositive = 'false_positive',
  UsedInTests = 'used_in_tests',
  WillFixLater = 'will_fix_later',
}

export type BypassReasonType =
  | BypassReason.FalsePositive
  | BypassReason.UsedInTests
  | BypassReason.WillFixLater

interface IBypassPushProtectionDialogProps {
  /** The secret to be bypassed */
  readonly secret: ISecretScanResult

  /** The function to call when the user clicks the bypass button */
  readonly bypassPushProtection: (
    secret: ISecretScanResult,
    reason: BypassReasonType
  ) => void

  readonly onDismissed: () => void
}

interface IBypassPushProtectionDialogState {
  readonly reason: BypassReasonType
}
/**
 * The dialog shown when a user wants to bypass the push protection feature of secret scanning.
 */
export class BypassPushProtectionDialog extends React.Component<
  IBypassPushProtectionDialogProps,
  IBypassPushProtectionDialogState
> {
  public constructor(props: IBypassPushProtectionDialogProps) {
    super(props)
    this.state = {
      reason: BypassReason.FalsePositive,
    }
  }

  public render() {
    const items = [
      {
        title: translateUI('ui.it-s-used-in-tests.fbf5fde'),
        description: translateUI(
          'ui.the-secret-poses-no-risk-if-anyone-finds-it-they.32dbdd4'
        ),
        key: BypassReason.UsedInTests,
      },
      {
        title: translateUI('ui.it-s-a-false-positive.f104429'),
        description: translateUI(
          'ui.the-detected-string-is-not-a-secret.bf70f98'
        ),
        key: BypassReason.FalsePositive,
      },
      {
        title: translateUI('ui.i-ll-fix-it-later.962edda'),
        description: translateUI(
          'ui.the-secret-is-real-i-understand-the-risk-and-i-w.5fa51a7'
        ),
        key: BypassReason.WillFixLater,
      },
    ]

    return (
      <Dialog
        title={
          __DARWIN__
            ? translateUI('ui.bypass-push-detection.2105a2d')
            : translateUI('ui.bypass-push-detection.523c7bc')
        }
        onDismissed={this.props.onDismissed}
        onSubmit={this.bypassPushProtection}
        className="bypass-push-protection-dialog"
      >
        <DialogContent>
          <VerticalSegmentedControl
            label={`Why are you bypassing this ${this.props.secret.description}?`}
            items={items}
            selectedKey={this.state.reason}
            onSelectionChanged={this.onSelectionChanged}
          />
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={translateUI(
              'ui.allow-me-to-expose-this-secret.105bffd'
            )}
            destructive={true}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSelectionChanged = (reason: BypassReasonType) => {
    this.setState({ reason })
  }

  private bypassPushProtection = () => {
    this.props.bypassPushProtection(this.props.secret, this.state.reason)
  }
}
