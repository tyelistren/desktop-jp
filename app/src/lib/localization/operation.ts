import { t } from './index'

/** Translate display names without changing operation identifiers. */
export function translateOperation(operation: string): string {
  switch (operation.toLowerCase()) {
    case 'rebase':
      return t('operation.name.rebase')
    case 'cherry-pick':
      return t('operation.name.cherry-pick')
    case 'squash':
      return t('operation.name.squash')
    case 'merge':
      return t('operation.name.merge')
    case 'reorder':
      return t('operation.name.reorder')
    case 'amend':
      return t('operation.name.amend')
    default:
      return operation
  }
}
