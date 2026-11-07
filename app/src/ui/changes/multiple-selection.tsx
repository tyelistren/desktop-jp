import { translateUIRich } from '../lib/translated-text'
import * as React from 'react'
import { encodePathAsUrl } from '../../lib/path'

const BlankSlateImage = encodePathAsUrl(
  __dirname,
  'static/multiple-files-selected.svg'
)

interface IMultipleSelectionProps {
  /** Called when the user chooses to open the repository. */
  readonly count: number
}
/** The component to display when there are no local changes. */
export class MultipleSelection extends React.Component<
  IMultipleSelectionProps,
  {}
> {
  public render() {
    return (
      <div className="panel blankslate" id="no-changes">
        <img src={BlankSlateImage} className="blankslate-image" alt="" />
        <div>
          {translateUIRich('ui.sentence.b4f3179a3467', {
            p0: this.props.count,
          })}
        </div>
      </div>
    )
  }
}
