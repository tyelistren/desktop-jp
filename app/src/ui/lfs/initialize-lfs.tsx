import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { Repository } from '../../models/repository'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { PathText } from '../lib/path-text'
import { LinkButton } from '../lib/link-button'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

const LFSURL = 'https://git-lfs.github.com/'

/**
 * If we're initializing any more than this number, we won't bother listing them
 * all.
 */
const MaxRepositoriesToList = 10

interface IInitializeLFSProps {
  /** The repositories in which LFS needs to be initialized. */
  readonly repositories: ReadonlyArray<Repository>

  /**
   * Event triggered when the dialog is dismissed by the user in the
   * ways described in the Dialog component's dismissable prop.
   */
  readonly onDismissed: () => void

  /**
   * Called when the user chooses to initialize LFS in the repositories.
   */
  readonly onInitialize: (repositories: ReadonlyArray<Repository>) => void
}

export class InitializeLFS extends React.Component<IInitializeLFSProps, {}> {
  public render() {
    return (
      <Dialog
        id="initialize-lfs"
        title={translateUI('ui.initialize-git-lfs.7ff6159')}
        backdropDismissable={false}
        onSubmit={this.onInitialize}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>{this.renderRepositories()}</DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={translateUI('ui.initialize-git-lfs.7ff6159')}
            cancelButtonText={
              __DARWIN__
                ? translateUI('ui.not-now.b1e5359')
                : translateUI('ui.not-now.e457149')
            }
            onCancelButtonClick={this.props.onDismissed}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onInitialize = () => {
    this.props.onInitialize(this.props.repositories)
    this.props.onDismissed()
  }

  private renderRepositories() {
    if (this.props.repositories.length > MaxRepositoriesToList) {
      return (
        <p>
          {translateUIRich('ui.sentence.fdd4daf409a8', {
            p0: this.props.repositories.length,
            p1: <LinkButton uri={LFSURL}>Git LFS</LinkButton>,
          })}
        </p>
      )
    } else {
      const plural = this.props.repositories.length !== 1
      const pluralizedRepositories = plural
        ? 'The repositories use'
        : 'This repository uses'
      const pluralizedUse = plural ? 'them' : 'it'
      return (
        <div>
          <p>
            {translateUIRich('ui.sentence.c09a18eabac7', {
              p0: pluralizedRepositories,
              p1: <LinkButton uri={LFSURL}>Git LFS</LinkButton>,
              p2: pluralizedUse,
            })}
          </p>
          <ul>
            {this.props.repositories.map(r => (
              <li key={r.id}>
                <PathText path={r.path} />
              </li>
            ))}
          </ul>
        </div>
      )
    }
  }
}
