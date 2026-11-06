import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { LinkButton } from '../lib/link-button'
import { PushProtectionErrorLocation } from './push-protection-error-location'
import { IAPICreatePushProtectionBypassResponse } from '../../lib/api'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'

/** Represents the location of a detected secret detected on push  */
export interface ISecretLocation {
  /**The SHA of the commit where the secret was detected. */
  commitSha: string
  /** The file path where the secret is located. */
  path: string
  /** The line number in the file where the secret is found. */
  lineNumber: number
}

/** Represents secret detected by GitHub's Secret Scanning feature on push. */
export interface ISecretScanResult {
  /** The id used in the bypassURL to unique identify this secret */
  id: string
  /** The name of the secret - e.g "GitHub Access Token" */
  description: string
  /** The location of the secret, given as a commitSha, file path, and line number */
  locations: ReadonlyArray<ISecretLocation>
  /** The URL to use to get to GitHub.com's dialog for bypassing blocking the push of the secret  */
  bypassURL: string
  /** The user cannot bypass themselves, but can request a bypass */
  requiresApproval: boolean
}

interface IPushProtectionErrorDialogProps {
  /** The secrets that were detected on push */
  readonly secrets: ReadonlyArray<ISecretScanResult>

  /** The function to call when the user clicks the bypass button */
  readonly bypassPushProtection: (
    secret: ISecretScanResult
  ) => Promise<IAPICreatePushProtectionBypassResponse | null>

  readonly onDelegatedBypassLinkClick: () => void

  readonly onRemediationInstructionsLinkClick: () => void

  readonly onDismissed: () => void
}

interface IPushProtectionErrorDialogState {
  readonly secretsBypassed: Map<string, boolean>
}

/**
 * The dialog shown when a push is denied by GitHub's push protection feature of secret scanning.
 */
export class PushProtectionErrorDialog extends React.Component<
  IPushProtectionErrorDialogProps,
  IPushProtectionErrorDialogState
> {
  public constructor(props: IPushProtectionErrorDialogProps) {
    super(props)
    this.state = {
      secretsBypassed: new Map(),
    }
  }

  public render() {
    return (
      <Dialog
        title={
          __DARWIN__
            ? translateUI('ui.push-blocked-secret-detected.98a42d7')
            : translateUI('ui.push-blocked-secret-detected.89ba174')
        }
        onDismissed={this.props.onDismissed}
        onSubmit={this.props.onDismissed}
        type="error"
        role="alertdialog"
        ariaDescribedBy="push-protection-error-dialog-description"
        className="push-protection-error-dialog"
      >
        <DialogContent>
          <div id="push-protection-error-dialog-description">
            {translateUIRich('ui.sentence.29f1445050dc', {
              p0: (
                <p>
                  {translateUIRich('ui.sentence.d29ca4f3d622', {
                    p0: (
                      <LinkButton uri="https://docs.github.com/code-security/secret-scanning/protecting-pushes-with-secret-scanning">
                        {translateUI('ui.secret-scanning.03df6c9')}
                      </LinkButton>
                    ),
                  })}
                </p>
              ),
              p1: (
                <p>
                  {translateUIRich('ui.sentence.117ae6a23c7a', {
                    p0: (
                      <LinkButton
                        onClick={this.props.onRemediationInstructionsLinkClick}
                        uri="https://docs.github.com/code-security/secret-scanning/working-with-secret-scanning-and-push-protection/working-with-push-protection-in-the-github-ui#resolving-a-blocked-commit"
                      >
                        {translateUI(
                          'ui.removing-the-secret-from-your-commit-and-commit-.462be45'
                        )}
                      </LinkButton>
                    ),
                  })}
                </p>
              ),
              p2: (
                <ul>
                  <li>
                    {translateUI(
                      'ui.verify-the-identity-of-the-secret-s.a7ef627'
                    )}
                  </li>
                  <li>
                    {translateUI(
                      'ui.know-which-resources-the-secret-s-can-access.1765ef5'
                    )}
                  </li>
                  <li>
                    {translateUI(
                      'ui.act-on-behalf-of-the-secret-s-owner.216599f'
                    )}
                  </li>
                  <li>
                    {translateUI(
                      'ui.push-the-secret-s-to-this-repository-without-bei.011d8fe'
                    )}
                  </li>
                </ul>
              ),
              p3: this.renderSecrets(),
            })}
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup cancelButtonVisible={false} />
        </DialogFooter>
      </Dialog>
    )
  }

  private renderSecretDescription = (secret: ISecretScanResult) => {
    return this.props.secrets.filter(s => s.description === secret.description)
      .length > 1
      ? `${secret.description} (${secret.id})`
      : secret.description
  }

  private bypassSecret = (secret: ISecretScanResult) => {
    return async () => {
      const bypassed = await this.props.bypassPushProtection(secret)
      if (bypassed) {
        this.setState(prevState => ({
          secretsBypassed: new Map(prevState.secretsBypassed).set(
            secret.id,
            true
          ),
        }))
      }
    }
  }

  private renderBypassButton = (secret: ISecretScanResult) => {
    if (secret.requiresApproval) {
      return (
        <LinkButton
          ariaLabel={`Bypass ${secret.description}`}
          uri={secret.bypassURL}
          onClick={this.props.onDelegatedBypassLinkClick}
        >
          {translateUI('ui.bypass.497852e')}
        </LinkButton>
      )
    }

    if (this.state.secretsBypassed.get(secret.id)) {
      return (
        <span className="bypass-success">
          {translateUIRich('ui.sentence.f147631275f1', {
            p0: <Octicon symbol={octicons.check} className="bypass-success" />,
          })}
        </span>
      )
    }

    return (
      <LinkButton
        ariaLabel={`Bypass ${secret.description}`}
        onClick={this.bypassSecret(secret)}
      >
        {translateUI('ui.bypass.497852e')}
      </LinkButton>
    )
  }

  private renderSecrets = () => {
    const listItems = this.props.secrets.map((secret, index) => (
      <li key={index} className="secret-list-item">
        <span className="secret-list-item-header">
          <span>{this.renderSecretDescription(secret)}</span>
          {this.renderBypassButton(secret)}
        </span>
        <PushProtectionErrorLocation secret={secret} />
      </li>
    ))
    return (
      <ul aria-label="Secrets" className="secret-list">
        {listItems}
      </ul>
    )
  }
}
