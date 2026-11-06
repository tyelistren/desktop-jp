import { t as translateUI } from '../../lib/localization'
import { translateUIRich } from '../lib/translated-text'
import * as React from 'react'
import { SuccessBanner } from './success-banner'

interface ISuccessfulSquashedBannerProps {
  readonly count: number
  readonly onDismissed: () => void
  readonly onUndo: () => void
}

export class SuccessfulSquash extends React.Component<
  ISuccessfulSquashedBannerProps,
  {}
> {
  public render() {
    const { count, onDismissed, onUndo } = this.props

    const pluralized =
      count === 1
        ? translateUI('ui.dynamic.commit')
        : translateUI('ui.dynamic.commits')

    return (
      <SuccessBanner timeout={15000} onDismissed={onDismissed} onUndo={onUndo}>
        <span>
          {translateUIRich('ui.sentence.c992953191e1', {
            p0: count,
            p1: pluralized,
          })}
        </span>
      </SuccessBanner>
    )
  }
}
