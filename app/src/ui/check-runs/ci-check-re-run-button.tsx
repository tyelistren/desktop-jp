import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { APICheckConclusion } from '../../lib/api'
import { IRefCheck } from '../../lib/ci-checks/ci-checks'
import { IMenuItem, showContextualMenu } from '../../lib/menu-item'
import { Button } from '../lib/button'
import { Octicon, syncClockwise } from '../octicons'
import * as octicons from '../octicons/octicons.generated'

interface ICICheckReRunButtonProps {
  readonly disabled: boolean
  readonly checkRuns: ReadonlyArray<IRefCheck>
  readonly canReRunFailed: boolean
  readonly onRerunChecks: (failedOnly: boolean) => void
}

export class CICheckReRunButton extends React.PureComponent<ICICheckReRunButtonProps> {
  private get failedChecksExist() {
    return this.props.checkRuns.some(
      cr => cr.conclusion === APICheckConclusion.Failure
    )
  }

  private onRerunChecks = () => {
    if (!this.props.canReRunFailed || !this.failedChecksExist) {
      this.props.onRerunChecks(false)
      return
    }

    const items: IMenuItem[] = [
      {
        label: __DARWIN__
          ? translateUI('ui.re-run-failed-checks.1b83031')
          : translateUI('ui.re-run-failed-checks.5930ee7'),
        action: () => this.props.onRerunChecks(true),
      },
      {
        label: __DARWIN__
          ? translateUI('ui.re-run-all-checks.790ef6b')
          : translateUI('ui.re-run-all-checks.d0a3765'),
        action: () => this.props.onRerunChecks(false),
      },
    ]

    showContextualMenu(items)
  }

  private onRerunKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!this.props.canReRunFailed || !this.failedChecksExist) {
      return
    }

    if (event.key === 'ArrowDown') {
      this.onRerunChecks()
    }
  }

  public render() {
    const text =
      this.props.canReRunFailed && this.failedChecksExist ? (
        <>
          {translateUIRich('ui.sentence.c038368821b2', {
            p0: <Octicon symbol={octicons.triangleDown} />,
          })}
        </>
      ) : (
        'Re-run Checks'
      )
    return (
      <Button
        onClick={this.onRerunChecks}
        onKeyDown={this.onRerunKeyDown}
        disabled={this.props.disabled}
      >
        <Octicon symbol={syncClockwise} /> {text}
      </Button>
    )
  }
}
