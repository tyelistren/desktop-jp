import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { Dialog, DialogContent, DefaultDialogFooter } from '../dialog'
import { InstalledCLIPath } from '../lib/install-cli'

interface ICLIInstalledProps {
  /** Called when the popup should be dismissed. */
  readonly onDismissed: () => void
}

/** Tell the user the CLI tool was successfully installed. */
export class CLIInstalled extends React.Component<ICLIInstalledProps, {}> {
  public render() {
    return (
      <Dialog
        title={
          __DARWIN__
            ? translateUI('ui.command-line-tool-installed.d933e7c')
            : translateUI('ui.command-line-tool-installed.86956de')
        }
        onDismissed={this.props.onDismissed}
        onSubmit={this.props.onDismissed}
      >
        <DialogContent>
          <div>
            {translateUIRich('ui.sentence.3e80c8dfede5', {
              p0: <strong>{InstalledCLIPath}</strong>,
            })}
          </div>
        </DialogContent>
        <DefaultDialogFooter buttonText={translateUI('ui.ok.b0a9821')} />
      </Dialog>
    )
  }
}
