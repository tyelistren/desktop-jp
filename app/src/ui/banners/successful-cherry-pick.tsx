import { t as translateUI } from '../../lib/localization'
import { translateUIRich } from '../lib/translated-text'
import * as React from 'react'
import { SuccessBanner } from './success-banner'

interface ISuccessfulCherryPickBannerProps {
  readonly targetBranchName: string
  readonly countCherryPicked: number
  readonly onDismissed: () => void
  readonly onUndo: () => void
}

export class SuccessfulCherryPick extends React.Component<
  ISuccessfulCherryPickBannerProps,
  {}
> {
  public render() {
    const { countCherryPicked, onDismissed, onUndo, targetBranchName } =
      this.props

    const pluralized =
      countCherryPicked === 1
        ? translateUI('ui.dynamic.commit')
        : translateUI('ui.dynamic.commits')

    return (
      <SuccessBanner timeout={15000} onDismissed={onDismissed} onUndo={onUndo}>
        <span>
          {translateUIRich('ui.sentence.8bc3d4750cf9', {
            p0: countCherryPicked,
            p1: pluralized,
            p2: <strong>{targetBranchName}</strong>,
          })}
        </span>
      </SuccessBanner>
    )
  }
}
