import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { DialogContent } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { CallToAction } from '../lib/call-to-action'

const HelpURL = 'https://help.github.com/articles/about-remote-repositories/'

interface INoRemoteProps {
  /** The function to call when the users chooses to publish. */
  readonly onPublish: () => void
}

/** The component for when a repository has no remote. */
export class NoRemote extends React.Component<INoRemoteProps, {}> {
  public render() {
    return (
      <DialogContent>
        <CallToAction actionTitle="Publish" onAction={this.props.onPublish}>
          <div className="no-remote-publish-message">
            {translateUIRich('ui.sentence.06b0dae1a7da', {
              p0: (
                <LinkButton uri={HelpURL}>
                  {translateUI(
                    'ui.learn-more-about-remote-repositories.e9fe940'
                  )}
                </LinkButton>
              ),
            })}
          </div>
        </CallToAction>
      </DialogContent>
    )
  }
}
