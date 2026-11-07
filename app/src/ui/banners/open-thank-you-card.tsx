import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { LinkButton } from '../lib/link-button'
import { RichText } from '../lib/rich-text'
import { Banner } from './banner'
import { Emoji } from '../../lib/emoji'

interface IOpenThankYouCardProps {
  readonly emoji: Map<string, Emoji>
  readonly onDismissed: () => void
  readonly onOpenCard: () => void
  readonly onThrowCardAway: () => void
}

/**
 * A component which tells the user that there is a thank you card for them.
 */
export class OpenThankYouCard extends React.Component<
  IOpenThankYouCardProps,
  {}
> {
  public render() {
    return (
      <Banner id="open-thank-you-card" onDismissed={this.props.onDismissed}>
        <form onSubmit={this.props.onOpenCard}>
          {translateUIRich('ui.sentence.946fe2403473', {
            p0: (
              <LinkButton onClick={this.props.onOpenCard}>
                {translateUI('ui.open-your-card.5517d73')}
              </LinkButton>
            ),
            p1: (
              <RichText
                className="thank-you-banner-emoji"
                text={':tada:'}
                emoji={this.props.emoji}
                renderUrlsAsLinks={true}
              />
            ),
            p2: (
              <LinkButton onClick={this.onThrowCardAway}>
                {translateUI('ui.throw-it-away.54b8f6e')}
              </LinkButton>
            ),
            p3: (
              <RichText
                className="thank-you-banner-emoji"
                text={':sob:'}
                emoji={this.props.emoji}
                renderUrlsAsLinks={true}
              />
            ),
          })}
        </form>
      </Banner>
    )
  }

  private onThrowCardAway = () => {
    this.props.onDismissed()
    this.props.onThrowCardAway()
  }
}
