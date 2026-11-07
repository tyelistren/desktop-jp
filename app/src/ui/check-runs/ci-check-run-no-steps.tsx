import { translateUIRich } from '../lib/translated-text'
import * as React from 'react'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { Button } from '../lib/button'
import { encodePathAsUrl } from '../../lib/path'

const PaperStackImage = encodePathAsUrl(__dirname, 'static/paper-stack.svg')

interface ICICheckRunNoStepProps {
  /** Callback to opens check runs target url (maybe GitHub, maybe third party) */
  readonly onViewCheckExternally: () => void
}

/** The CI check no step view. */
export class CICheckRunNoStepItem extends React.PureComponent<ICICheckRunNoStepProps> {
  public render() {
    return (
      <div className="ci-check-run-no-steps">
        <p>
          {translateUIRich('ui.sentence.432c0bbe31d4', {
            p0: (
              <Button
                className="button-with-icon"
                onClick={this.props.onViewCheckExternally}
                role="link"
              >
                {translateUIRich('ui.sentence.48535b40cd99', {
                  p0: <Octicon symbol={octicons.linkExternal} />,
                })}
              </Button>
            ),
          })}
        </p>

        <img src={PaperStackImage} alt="" />
      </div>
    )
  }
}
