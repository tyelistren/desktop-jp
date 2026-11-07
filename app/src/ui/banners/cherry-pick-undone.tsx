import { t as translateUI } from '../../lib/localization'
import { translateUIRich } from '../lib/translated-text'
import * as React from 'react'
import { SuccessBanner } from './success-banner'

interface ICherryPickUndoneBannerProps {
  readonly targetBranchName: string
  readonly countCherryPicked: number
  readonly onDismissed: () => void
}

export class CherryPickUndone extends React.Component<
  ICherryPickUndoneBannerProps,
  {}
> {
  public render() {
    const { countCherryPicked, targetBranchName, onDismissed } = this.props
    const pluralized =
      countCherryPicked === 1
        ? translateUI('ui.dynamic.commit')
        : translateUI('ui.dynamic.commits')
    return (
      <SuccessBanner timeout={5000} onDismissed={onDismissed}>
        {translateUIRich('ui.sentence.a5419a2d79fe', {
          p0: countCherryPicked,
          p1: pluralized,
          p2: <strong>{targetBranchName}</strong>,
        })}
      </SuccessBanner>
    )
  }
}
