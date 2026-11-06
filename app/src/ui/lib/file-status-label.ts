import { t as translateUI } from '../../lib/localization'
import { mapStatus } from '../../lib/status'
import { AppFileStatus } from '../../models/status'

/** Translate file state for display without modifying Git status values. */
export function fileStatusLabel(status: AppFileStatus): string {
  const value = mapStatus(status)
  switch (value) {
    case 'New':
      return translateUI('ui.dynamic.statusNew')
    case 'Modified':
      return translateUI('ui.dynamic.statusModified')
    case 'Deleted':
      return translateUI('ui.dynamic.statusDeleted')
    case 'Renamed':
      return translateUI('ui.dynamic.statusRenamed')
    case 'Conflicted':
      return translateUI('ui.dynamic.statusConflicted')
    case 'Resolved':
      return translateUI('ui.dynamic.statusResolved')
    case 'Copied':
      return translateUI('ui.dynamic.statusCopied')
    default:
      return value
  }
}
