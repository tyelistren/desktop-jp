import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import * as URL from 'url'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IUntrustedCertificateProps {
  /** The untrusted certificate. */
  readonly certificate: Electron.Certificate

  /** The URL which was being accessed. */
  readonly url: string

  /** The function to call when the user chooses to dismiss the dialog. */
  readonly onDismissed: () => void

  /**
   * The function to call when the user chooses to continue in the process of
   * trusting the certificate.
   */
  readonly onContinue: (certificate: Electron.Certificate) => void
}

/**
 * The dialog we display when an API request encounters an untrusted
 * certificate.
 *
 * An easy way to test this dialog is to attempt to sign in to GitHub
 * Enterprise using  one of the badssl.com domains, such
 * as https://self-signed.badssl.com/
 */
export class UntrustedCertificate extends React.Component<
  IUntrustedCertificateProps,
  {}
> {
  public render() {
    const host = URL.parse(this.props.url).hostname

    return (
      <Dialog
        title={
          __DARWIN__
            ? translateUI('ui.untrusted-server.a0dc393')
            : translateUI('ui.untrusted-server.8cd584c')
        }
        onDismissed={this.props.onDismissed}
        onSubmit={this.onContinue}
        type={__DARWIN__ ? 'warning' : 'error'}
      >
        <DialogContent>
          <p>
            {translateUIRich('ui.sentence.9c9149c06cc3', {
              p0: host,
              p1: this.props.certificate.subjectName,
              p2: (
                <strong>
                  {translateUI(
                    'ui.this-may-indicate-attackers-are-trying-to-steal-.3806999'
                  )}
                </strong>
              ),
            })}
          </p>
          <p>
            {translateUI(
              'ui.in-some-cases-this-may-be-expected-for-example.56797a1'
            )}
          </p>
          <ul>
            <li>
              {translateUI('ui.if-this-is-a-github-enterprise-trial.6bab718')}
            </li>
            <li>
              {translateUI(
                'ui.if-your-github-enterprise-instance-is-run-on-an-.caf24e1'
              )}
            </li>
          </ul>
          <p>
            {translateUI(
              'ui.if-you-are-unsure-of-what-to-do-cancel-and-conta.f406030'
            )}
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={
              __DARWIN__
                ? translateUI('ui.view-certificate.b97fcb6')
                : translateUI('ui.add-certificate.631b330')
            }
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onContinue = () => {
    this.props.onDismissed()
    this.props.onContinue(this.props.certificate)
  }
}
