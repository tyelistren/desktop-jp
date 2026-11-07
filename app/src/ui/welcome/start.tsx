import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { WelcomeStep } from './welcome'
import { LinkButton } from '../lib/link-button'
import { Dispatcher } from '../dispatcher'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { Button } from '../lib/button'
import { Loading } from '../lib/loading'
import { BrowserRedirectMessage } from '../lib/authentication-form'
import { SamplesURL } from '../../lib/stats'

/**
 * The URL to the sign-up page on GitHub.com. Used in conjunction
 * with account actions in the app where the user might want to
 * consider signing up.
 */
export const CreateAccountURL = 'https://github.com/join?source=github-desktop'

interface IStartProps {
  readonly advance: (step: WelcomeStep) => void
  readonly dispatcher: Dispatcher
  readonly loadingBrowserAuth: boolean
}

/** The first step of the Welcome flow. */
export class Start extends React.Component<IStartProps, {}> {
  public render() {
    return (
      <section
        id="start"
        aria-label="Welcome to GitHub Desktop"
        aria-describedby="start-description"
      >
        <div className="start-content">
          <h1 className="welcome-title">
            {translateUIRich('ui.sentence.084d9cf9702a', {
              p0: <span>GitHub Desktop</span>,
            })}
          </h1>
          {!this.props.loadingBrowserAuth ? (
            <>
              <p id="start-description" className="welcome-text">
                {translateUI(
                  'ui.github-desktop-is-a-seamless-way-to-contribute-t.7af0625'
                )}
              </p>
            </>
          ) : (
            <p>{BrowserRedirectMessage}</p>
          )}

          <div className="welcome-main-buttons">
            <Button
              type="submit"
              className="button-with-icon"
              disabled={this.props.loadingBrowserAuth}
              onClick={this.signInWithBrowser}
              autoFocus={true}
              role="link"
            >
              {translateUIRich('ui.sentence.6402f48c890a', {
                p0: this.props.loadingBrowserAuth && <Loading />,
                p1: <Octicon symbol={octicons.linkExternal} />,
              })}
            </Button>
            {this.props.loadingBrowserAuth ? (
              <Button onClick={this.cancelBrowserAuth}>
                {translateUI('ui.cancel.77dfd21')}
              </Button>
            ) : (
              <Button onClick={this.signInToEnterprise}>
                {translateUI('ui.sign-in-to-github-enterprise.1bf6c04')}
              </Button>
            )}
          </div>
          <div className="skip-action-container">
            <p className="welcome-text">
              {translateUIRich('ui.sentence.ac6b03910511', {
                p0: (
                  <LinkButton
                    uri={CreateAccountURL}
                    className="create-account-link"
                  >
                    {translateUI('ui.create-your-free-account.701aa7e')}
                  </LinkButton>
                ),
              })}
            </p>
            <LinkButton className="skip-button" onClick={this.skip}>
              {translateUI('ui.skip-this-step.9278dcf')}
            </LinkButton>
          </div>
        </div>

        <div className="start-footer">
          <p>
            {translateUIRich('ui.sentence.274adac1c24f', {
              p0: (
                <LinkButton uri={'https://github.com/site/terms'}>
                  {translateUI('ui.terms-of-service.0c8a9a9')}
                </LinkButton>
              ),
              p1: (
                <LinkButton uri={'https://github.com/site/privacy'}>
                  {translateUI('ui.github-privacy-statement.c2e8c1e')}
                </LinkButton>
              ),
            })}
          </p>
          <p>
            {translateUIRich('ui.sentence.95577a1065d1', {
              p0: (
                <LinkButton uri={SamplesURL}>
                  {translateUI('ui.learn-more-about-user-metrics.3a7fe18')}
                </LinkButton>
              ),
            })}
          </p>
        </div>
      </section>
    )
  }

  private signInWithBrowser = (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault()
    }

    this.props.advance(WelcomeStep.SignInToDotComWithBrowser)
    this.props.dispatcher.requestBrowserAuthenticationToDotcom()
  }

  private cancelBrowserAuth = () => {
    this.props.advance(WelcomeStep.Start)
  }

  private signInToEnterprise = () => {
    this.props.advance(WelcomeStep.SignInToEnterprise)
  }

  private skip = () => {
    this.props.advance(WelcomeStep.ConfigureGit)
  }
}
