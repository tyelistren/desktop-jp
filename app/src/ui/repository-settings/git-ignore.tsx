import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { DialogContent } from '../dialog'
import { TextArea } from '../lib/text-area'
import { LinkButton } from '../lib/link-button'
import { Ref } from '../lib/ref'

interface IGitIgnoreProps {
  readonly text: string | null
  readonly onIgnoreTextChanged: (text: string) => void
  readonly onShowExamples: () => void
}

/** A view for creating or modifying the repository's gitignore file */
export class GitIgnore extends React.Component<IGitIgnoreProps, {}> {
  public render() {
    return (
      <DialogContent>
        <p id="ignored-files-description">
          {translateUIRich('ui.sentence.75e80b3191be', {
            p0: <Ref>.gitignore</Ref>,
            p1: (
              <LinkButton onClick={this.props.onShowExamples}>
                {translateUI('ui.learn-more-about-gitignore-files.97da802')}
              </LinkButton>
            ),
          })}
        </p>

        <TextArea
          ariaLabel={translateUI('ui.ignored-files.14c879b')}
          ariaDescribedBy="ignored-files-description"
          placeholder={translateUI('ui.ignored-files.14c879b')}
          value={this.props.text || ''}
          onValueChanged={this.props.onIgnoreTextChanged}
          textareaClassName="gitignore"
        />
      </DialogContent>
    )
  }
}
