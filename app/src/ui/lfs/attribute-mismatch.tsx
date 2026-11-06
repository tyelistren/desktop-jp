import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IAttributeMismatchProps {
  /** Called when the dialog should be dismissed. */
  readonly onDismissed: () => void

  /** Called when the user has chosen to replace the update filters. */
  readonly onUpdateExistingFilters: () => void

  readonly onEditGlobalGitConfig: () => void
}

export class AttributeMismatch extends React.Component<IAttributeMismatchProps> {
  public render() {
    return (
      <Dialog
        id="lfs-attribute-mismatch"
        title={
          __DARWIN__
            ? translateUI('ui.update-existing-git-lfs-filters.f847291')
            : translateUI('ui.update-existing-git-lfs-filters.513af3a')
        }
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
      >
        <DialogContent>
          <p>
            {translateUIRich('ui.sentence.9deec43f4b95', {
              p0: (
                <LinkButton onClick={this.props.onEditGlobalGitConfig}>
                  {translateUI('ui.your-global-git-config.508f16f')}
                </LinkButton>
              ),
            })}
          </p>
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={
              __DARWIN__
                ? translateUI('ui.update-existing-filters.e97e01b')
                : translateUI('ui.update-existing-filters.3244a9b')
            }
            cancelButtonText={
              __DARWIN__
                ? translateUI('ui.not-now.b1e5359')
                : translateUI('ui.not-now.e457149')
            }
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSubmit = () => {
    this.props.onUpdateExistingFilters()
    this.props.onDismissed()
  }
}
