import { translateUIRich } from './translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { Ref } from './ref'
import { LinkButton } from './link-button'
import { unlink } from 'fs/promises'

interface IConfigLockFileExistsProps {
  /**
   * The path to the lock file that's preventing a configuration
   * file update.
   */
  readonly lockFilePath: string

  /**
   * Called when the lock file has been deleted and the configuration
   * update can be retried
   */
  readonly onLockFileDeleted: () => void

  /**
   * Called if the lock file couldn't be deleted
   */
  readonly onError: (e: Error) => void
}

export class ConfigLockFileExists extends React.Component<IConfigLockFileExistsProps> {
  private onDeleteLockFile = async () => {
    try {
      await unlink(this.props.lockFilePath)
    } catch (e) {
      // We don't care about failure to unlink due to the
      // lock file not existing any more
      if (e.code !== 'ENOENT') {
        this.props.onError(e)
        return
      }
    }

    this.props.onLockFileDeleted()
  }
  public render() {
    return (
      <div className="config-lock-file-exists-component">
        <p>
          {translateUIRich('ui.sentence.43a9f9eeaa52', {
            p0: <Ref>{this.props.lockFilePath}</Ref>,
          })}
        </p>
        <p>
          {translateUIRich('ui.sentence.bd8843a093aa', {
            p0: (
              <LinkButton onClick={this.onDeleteLockFile}>
                {translateUI('ui.delete-the-lock-file.b4daa3e')}
              </LinkButton>
            ),
          })}
        </p>
      </div>
    )
  }
}
