import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'

import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { shell } from '../../lib/app-shell'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IInstallGitProps {
  /**
   * Event triggered when the dialog is dismissed by the user in the
   * ways described in the Dialog component's dismissable prop.
   */
  readonly onDismissed: () => void

  /**
   * The path to the current repository, in case the user wants to continue
   * doing whatever they're doing.
   */
  readonly path: string

  /** Called when the user chooses to open the shell. */
  readonly onOpenShell: (path: string) => void
}

/**
 * A dialog indicating that Git wasn't found, to direct the user to an
 * external resource for more information about setting up their environment.
 */
export class InstallGit extends React.Component<IInstallGitProps, {}> {
  public constructor(props: IInstallGitProps) {
    super(props)
  }

  private onSubmit = () => {
    this.props.onOpenShell(this.props.path)
    this.props.onDismissed()
  }

  private onExternalLink = (e: React.MouseEvent<HTMLButtonElement>) => {
    const url = `https://help.github.com/articles/set-up-git/#setting-up-git`
    shell.openExternal(url)
  }

  public render() {
    return (
      <Dialog
        id="install-git"
        type="warning"
        title={
          __DARWIN__
            ? translateUI('ui.unable-to-locate-git.df62ed7')
            : translateUI('ui.unable-to-locate-git.0e91e3d')
        }
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <p>
            {translateUIRich('ui.sentence.956686fea0bc', {
              p0: __DARWIN__
                ? translateUI('ui.terminal-window.a07f4be')
                : translateUI('ui.command-prompt.f0a7a29'),
            })}
          </p>
          <p>
            {translateUI(
              'ui.to-help-you-get-git-installed-and-configured-for.5f47ba6'
            )}
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={
              __DARWIN__
                ? translateUI('ui.open-without-git.0555203')
                : translateUI('ui.open-without-git.4647fbd')
            }
            cancelButtonText={translateUI('ui.install-git.4be4cde')}
            onCancelButtonClick={this.onExternalLink}
          />
        </DialogFooter>
      </Dialog>
    )
  }
}
