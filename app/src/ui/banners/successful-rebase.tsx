import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { SuccessBanner } from './success-banner'

export function SuccessfulRebase({
  baseBranch,
  targetBranch,
  onDismissed,
}: {
  readonly baseBranch?: string
  readonly targetBranch: string
  readonly onDismissed: () => void
}) {
  const message =
    baseBranch !== undefined
      ? translateUI('ui.final.successful-rebase', {
          source: targetBranch,
          target: baseBranch,
        })
      : translateUI('ui.final.successful-rebaseSingle', {
          source: targetBranch,
        })

  return (
    <SuccessBanner timeout={5000} onDismissed={onDismissed}>
      <div className="banner-message">{message}</div>
    </SuccessBanner>
  )
}
