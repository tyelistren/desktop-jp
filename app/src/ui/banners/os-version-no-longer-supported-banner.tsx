import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { Banner } from './banner'
import { LinkButton } from '../lib/link-button'
import { setNumber } from '../../lib/local-storage'

export const UnsupportedOSBannerDismissedAtKey =
  'unsupported-os-banner-dismissed-at'

export class OSVersionNoLongerSupportedBanner extends React.Component<{
  onDismissed: () => void
}> {
  private onDismissed = () => {
    setNumber(UnsupportedOSBannerDismissedAtKey, Date.now())
    this.props.onDismissed()
  }

  public render() {
    return (
      <Banner
        id="os-not-supported-banner"
        dismissable={true}
        onDismissed={this.onDismissed}
      >
        {translateUIRich('ui.sentence.3391d27a96b9', {
          p0: <Octicon className="alert-icon" symbol={octicons.alert} />,
          p1: (
            <LinkButton uri="https://docs.github.com/en/desktop/installing-and-configuring-github-desktop/overview/supported-operating-systems">
              {translateUI('ui.support-details.b76ff7a')}
            </LinkButton>
          ),
        })}
      </Banner>
    )
  }
}
