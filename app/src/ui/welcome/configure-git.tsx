import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { WelcomeStep } from './welcome'
import { Account } from '../../models/account'
import { ConfigureGitUser } from '../lib/configure-git-user'
import { Button } from '../lib/button'

interface IConfigureGitProps {
  readonly accounts: ReadonlyArray<Account>
  readonly advance: (step: WelcomeStep) => void
  readonly done: () => void
  readonly globalUserName: string | undefined
  readonly globalUserEmail: string | undefined
}

/** The Welcome flow step to configure git. */
export class ConfigureGit extends React.Component<IConfigureGitProps, {}> {
  public render() {
    return (
      <section id="configure-git" aria-label="Configure Git">
        <h1 className="welcome-title">
          {translateUI('ui.configure-git.c8f4693')}
        </h1>
        <p className="welcome-text">
          {translateUI(
            'ui.this-is-used-to-identify-the-commits-you-create-.dbaf9bf'
          )}
        </p>

        <ConfigureGitUser
          accounts={this.props.accounts}
          onSave={this.props.done}
          saveLabel="Finish"
          globalUserName={this.props.globalUserName}
          globalUserEmail={this.props.globalUserEmail}
        >
          <Button onClick={this.cancel}>
            {translateUI('ui.cancel.77dfd21')}
          </Button>
        </ConfigureGitUser>
      </section>
    )
  }

  private cancel = () => {
    this.props.advance(WelcomeStep.Start)
  }
}
