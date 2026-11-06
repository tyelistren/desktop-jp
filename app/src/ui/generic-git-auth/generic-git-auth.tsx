import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'

import { TextBox } from '../lib/text-box'
import { Row } from '../lib/row'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Ref } from '../lib/ref'
import { LinkButton } from '../lib/link-button'
import { PasswordTextBox } from '../lib/password-text-box'

interface IGenericGitAuthenticationProps {
  /** The remote url with which the user tried to authenticate. */
  readonly remoteUrl: string

  /** The function to call when the user saves their credentials. */
  readonly onSave: (username: string, password: string) => void

  /** The function to call when the user dismisses the dialog. */
  readonly onDismiss: () => void

  /**
   * In case the username is predetermined. Setting this will prevent
   * the popup from allowing the user to change the username.
   */
  readonly username?: string
}

interface IGenericGitAuthenticationState {
  readonly username: string
  readonly password: string
}

/** Shown to enter the credentials to authenticate to a generic git server. */
export class GenericGitAuthentication extends React.Component<
  IGenericGitAuthenticationProps,
  IGenericGitAuthenticationState
> {
  public constructor(props: IGenericGitAuthenticationProps) {
    super(props)

    this.state = { username: this.props.username ?? '', password: '' }
  }

  public render() {
    const disabled = !this.state.password.length || !this.state.username.length
    return (
      <Dialog
        id="generic-git-auth"
        title={
          __DARWIN__
            ? translateUI('ui.authentication-failed.ed3b12f')
            : translateUI('ui.authentication-failed.2db8daa')
        }
        onDismissed={this.props.onDismiss}
        onSubmit={this.save}
        role="alertdialog"
        ariaDescribedBy="generic-git-auth-error"
      >
        <DialogContent>
          <p id="generic-git-auth-error">
            {translateUIRich('ui.sentence.0b826f38d2d8', {
              p0: <Ref>{this.props.remoteUrl}</Ref>,
              p1: this.props.username ? (
                <>
                  {translateUIRich('ui.sentence.3f23b740d217', {
                    p0: <Ref>{this.props.username}</Ref>,
                  })}
                </>
              ) : (
                'your username and password'
              ),
            })}
          </p>

          {this.props.username === undefined && (
            <Row>
              <TextBox
                label={translateUI('ui.username.84c2901')}
                autoFocus={true}
                value={this.state.username}
                onValueChanged={this.onUsernameChange}
              />
            </Row>
          )}

          <Row>
            <PasswordTextBox
              label={translateUI('ui.password.8be3c94')}
              value={this.state.password}
              onValueChanged={this.onPasswordChange}
              ariaDescribedBy="generic-git-auth-password-description"
            />
          </Row>

          <Row>
            <div id="generic-git-auth-password-description">
              {translateUIRich('ui.sentence.6e2c59181253', {
                p0: (
                  <LinkButton uri="https://github.com/desktop/desktop/tree/development/docs/integrations">
                    {translateUI('ui.integration-docs.83e89b8')}
                  </LinkButton>
                ),
              })}
            </div>
          </Row>
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup okButtonDisabled={disabled} />
        </DialogFooter>
      </Dialog>
    )
  }

  private onUsernameChange = (value: string) => {
    this.setState({ username: value })
  }

  private onPasswordChange = (value: string) => {
    this.setState({ password: value })
  }

  private save = () => {
    this.props.onSave(
      this.props.username ?? this.state.username,
      this.state.password
    )
    this.props.onDismiss()
  }
}
