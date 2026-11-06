import { translateUIRich } from '../../lib/translated-text'
import { t as translateUI } from '../../../lib/localization'
import { t } from '../../../lib/localization'
import * as React from 'react'
import { ImageContainer } from './image-container'
import { ICommonImageDiffProperties } from './modified-image-diff'
import { ISize } from './sizing'
import { formatBytes } from '../../lib/bytes'
import classNames from 'classnames'

function percentDiff(previous: number, current: number) {
  return `${Math.abs(Math.round((current / previous) * 100))}%`
}

interface ITwoUpProps extends ICommonImageDiffProperties {
  readonly previousImageSize: ISize | null
  readonly currentImageSize: ISize | null
}

export class TwoUp extends React.Component<ITwoUpProps, {}> {
  public render() {
    const zeroSize = { width: 0, height: 0 }
    const previousImageSize = this.props.previousImageSize || zeroSize
    const currentImageSize = this.props.currentImageSize || zeroSize

    const { current, previous } = this.props

    const diffPercent = percentDiff(previous.bytes, current.bytes)
    const diffBytes = current.bytes - previous.bytes
    const diffBytesSign = diffBytes >= 0 ? '+' : ''

    const style: React.CSSProperties = {
      maxWidth:
        this.props.maxSize.width < 200 ? undefined : this.props.maxSize.width,
    }

    return (
      <div className="image-diff-container" ref={this.props.onContainerRef}>
        <div className="image-diff-two-up">
          <div className="image-diff-previous" style={style}>
            <div className="image-diff-header">{t('image.deleted')}</div>
            <ImageContainer
              image={previous}
              onElementLoad={this.props.onPreviousImageLoad}
            />

            <div className="image-diff-footer">
              <span className="strong">{t('image.width')}</span>{' '}
              {previousImageSize.width}
              px | <span className="strong">{t('image.height')}</span>{' '}
              {previousImageSize.height}
              px | <span className="strong">{t('image.size')}</span>{' '}
              {formatBytes(previous.bytes, 2)}
            </div>
          </div>

          <div className="image-diff-current" style={style}>
            <div className="image-diff-header">{t('image.added')}</div>
            <ImageContainer
              image={current}
              onElementLoad={this.props.onCurrentImageLoad}
            />

            <div className="image-diff-footer">
              <span className="strong">{t('image.width')}</span>{' '}
              {currentImageSize.width}
              px | <span className="strong">{t('image.height')}</span>{' '}
              {currentImageSize.height}
              px | <span className="strong">{t('image.size')}</span>{' '}
              {formatBytes(current.bytes, 2)}
            </div>
          </div>
        </div>
        <div className="image-diff-summary">
          {translateUIRich('ui.sentence.c3d2b09ba385', {
            p0: (
              <span
                className={classNames({
                  added: diffBytes > 0,
                  removed: diffBytes < 0,
                })}
              >
                {diffBytes !== 0
                  ? `${diffBytesSign}${formatBytes(
                      diffBytes,
                      2
                    )} (${diffPercent})`
                  : translateUI('ui.no-size-difference.494b4d1')}
              </span>
            ),
          })}
        </div>
      </div>
    )
  }
}
