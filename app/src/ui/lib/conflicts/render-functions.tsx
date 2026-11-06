import { t } from '../../../lib/localization'
import * as React from 'react'
import { Octicon } from '../../octicons'
import * as octicons from '../../octicons/octicons.generated'
import { LinkButton } from '../link-button'

export function renderUnmergedFilesSummary(conflictedFilesCount: number) {
  const message =
    conflictedFilesCount === 1
      ? t('conflict.filesOne', { count: conflictedFilesCount })
      : t('conflict.filesMany', { count: conflictedFilesCount })
  return <h2 className="summary">{message}</h2>
}

export function renderAllResolved() {
  return (
    <div className="all-conflicts-resolved">
      <div className="green-circle">
        <Octicon symbol={octicons.check} />
      </div>
      <div className="message">{t('conflict.all')}</div>
    </div>
  )
}

export function renderShellLink(openThisRepositoryInShell: () => void) {
  return (
    <div>
      <LinkButton onClick={openThisRepositoryInShell}>
        {t('conflict.shell')}
      </LinkButton>{' '}
      {t('conflict.manualHelp')}
    </div>
  )
}
