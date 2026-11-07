import { translateUIRich } from './translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { getHTMLURL } from '../../lib/api'
import { Ref } from './ref'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'

interface IEnterpriseServerConfirmationProps {
  readonly endpoint: string
}

export const enterpriseServerConfirmationDescriptionId =
  'enterprise-server-confirmation-description'

/** Explains the destination of an Enterprise sign-in requested by Git. */
export class EnterpriseServerConfirmation extends React.Component<IEnterpriseServerConfirmationProps> {
  public render() {
    return (
      <div
        id={enterpriseServerConfirmationDescriptionId}
        className="enterprise-server-confirmation"
      >
        <p>
          {translateUI(
            'ui.git-is-requesting-permission-to-sign-in-to-this-.485c61d'
          )}
        </p>
        <p>
          <Ref>{getHTMLURL(this.props.endpoint)}</Ref>
        </p>
        <div className="enterprise-server-warning">
          <Octicon symbol={octicons.alert} />
          <p>
            {translateUIRich('ui.sentence.399d10a5bf58', {
              p0: (
                <strong>
                  {translateUI(
                    'ui.only-continue-if-you-recognize-and-trust-this-se.92601e4'
                  )}
                </strong>
              ),
            })}
          </p>
        </div>
      </div>
    )
  }
}
