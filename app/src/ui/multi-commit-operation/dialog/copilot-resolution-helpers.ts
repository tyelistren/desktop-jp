import { t as translateUI } from '../../../lib/localization'
import { ManualConflictResolution } from '../../../models/manual-conflict-resolution'
import {
  ConflictedFileStatus,
  GitStatusEntry,
  isManualConflict,
  ManualConflict,
} from '../../../models/status'
import * as octicons from '../../octicons/octicons.generated'

export type CopilotFileResolutionChoice = 'copilot' | 'ours' | 'theirs'

/** Label and icon for each resolution choice. */
export const resolutionChoices = {
  copilot: { label: 'Copilot', icon: octicons.copilot },
  ours: {
    label: translateUI('ui.dynamic.current'),
    icon: octicons.chevronLeft,
  },
  theirs: {
    label: translateUI('ui.dynamic.incoming'),
    icon: octicons.chevronRight,
  },
} as const

/**
 * Derive the resolution choice for a file from the manual resolutions map.
 * Defaults to 'copilot' when no manual override is set.
 */
export function getResolutionChoiceForFile(
  path: string,
  manualResolutions: Map<string, ManualConflictResolution>
): CopilotFileResolutionChoice {
  const manual = manualResolutions.get(path)
  if (manual === ManualConflictResolution.ours) {
    return 'ours'
  }
  if (manual === ManualConflictResolution.theirs) {
    return 'theirs'
  }
  return 'copilot'
}

/**
 * Returns true when the conflicted file status represents a delete-vs-modify
 * conflict: one side deleted the file, the other modified it.
 */
export function isDeleteConflictFile(
  status: ConflictedFileStatus
): status is ManualConflict {
  if (!isManualConflict(status)) {
    return false
  }
  const { us, them } = status.entry
  return (
    (us === GitStatusEntry.Deleted && them !== GitStatusEntry.Deleted) ||
    (them === GitStatusEntry.Deleted && us !== GitStatusEntry.Deleted)
  )
}

/**
 * For a delete-vs-modify conflict, returns which side deleted the file.
 */
export function getDeletedSide(
  status: ManualConflict
): 'ours' | 'theirs' | undefined {
  if (status.entry.us === GitStatusEntry.Deleted) {
    return 'ours'
  }
  if (status.entry.them === GitStatusEntry.Deleted) {
    return 'theirs'
  }
  return undefined
}

/**
 * Context menu labels for a delete-vs-modify conflict file. Returns
 * user-friendly labels like "Keep file (from branch-x)" and
 * "Delete file (from branch-y)" mapped to 'ours' and 'theirs'.
 */
export function getDeleteConflictLabels(
  status: ManualConflict,
  ourBranch?: string,
  theirBranch?: string
): { readonly oursLabel: string; readonly theirsLabel: string } {
  const deletedSide = getDeletedSide(status)

  const keepBranch = deletedSide === 'ours' ? theirBranch : ourBranch
  const deleteBranch = deletedSide === 'ours' ? ourBranch : theirBranch
  const keepLabel = keepBranch
    ? translateUI('ui.dynamic.keepFileBranch', { branch: keepBranch })
    : translateUI('ui.dynamic.keepFile')
  const deleteLabel = deleteBranch
    ? translateUI('ui.dynamic.deleteFileBranch', { branch: deleteBranch })
    : translateUI('ui.dynamic.deleteFile')
  return deletedSide === 'ours'
    ? { oursLabel: deleteLabel, theirsLabel: keepLabel }
    : { oursLabel: keepLabel, theirsLabel: deleteLabel }
}

/**
 * For a delete-vs-modify conflict, returns the resolution choice label
 * ("Keep file" or "Delete file") for the current choice.
 */
export function getDeleteConflictChoiceLabel(
  choice: CopilotFileResolutionChoice,
  status: ManualConflict
): string {
  const deletedSide = getDeletedSide(status)

  if (choice === 'copilot') {
    return 'Copilot'
  }

  if (deletedSide === 'ours') {
    return choice === 'ours'
      ? translateUI('ui.dynamic.deleteFile')
      : translateUI('ui.dynamic.keepFile')
  }

  return choice === 'ours'
    ? translateUI('ui.dynamic.keepFile')
    : translateUI('ui.dynamic.deleteFile')
}

/**
 * Returns the ours/theirs dropdown labels for a conflicted file, handling
 * both delete-vs-modify and regular text conflicts.
 */
export function getOursTheirsLabels(
  status: ConflictedFileStatus | undefined,
  ourBranch?: string,
  theirBranch?: string
): { readonly oursLabel: string; readonly theirsLabel: string } {
  if (status !== undefined && isDeleteConflictFile(status)) {
    return getDeleteConflictLabels(status, ourBranch, theirBranch)
  }

  const oursLabel = ourBranch
    ? translateUI('ui.dynamic.useCurrentBranch', { branch: ourBranch })
    : translateUI('ui.dynamic.useCurrent')
  const theirsLabel = theirBranch
    ? translateUI('ui.dynamic.useIncomingBranch', { branch: theirBranch })
    : translateUI('ui.dynamic.useIncoming')
  return { oursLabel, theirsLabel }
}
