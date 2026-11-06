import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { SuccessBanner } from './success-banner'

export function SuccessfulMerge({
  ourBranch,
  theirBranch,
  onDismissed,
}: {
  readonly ourBranch: string
  readonly theirBranch?: string
  readonly onDismissed: () => void
}) {
  const message =
    theirBranch !== undefined
      ? translateUI('ui.final.successful-merge', {
          source: theirBranch,
          target: ourBranch,
        })
      : translateUI('ui.final.successful-mergeSingle', { target: ourBranch })

  return (
    <SuccessBanner timeout={5000} onDismissed={onDismissed}>
      <div className="banner-message">{message}</div>
    </SuccessBanner>
  )
}
