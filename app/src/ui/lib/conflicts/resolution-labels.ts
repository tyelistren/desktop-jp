import { t } from '../../../lib/localization'
import { GitStatusEntry } from '../../../models/status'
import { assertNever } from '../../../lib/fatal-error'

type UnmergedStatusEntry =
  | GitStatusEntry.Added
  | GitStatusEntry.UpdatedButUnmerged
  | GitStatusEntry.Deleted

/** Describe a manual resolution using a complete, reorderable translation. */
export function getResolutionLabel(
  entry: UnmergedStatusEntry,
  selected: boolean,
  branch?: string
): string {
  switch (entry) {
    case GitStatusEntry.Added:
      return selected
        ? t(
            branch
              ? 'resolution.selected.added.branch'
              : 'resolution.selected.added',
            { branch: branch || '' }
          )
        : t(
            branch
              ? 'resolution.choice.added.branch'
              : 'resolution.choice.added',
            { branch: branch || '' }
          )
    case GitStatusEntry.UpdatedButUnmerged:
      return selected
        ? t(
            branch
              ? 'resolution.selected.modified.branch'
              : 'resolution.selected.modified',
            { branch: branch || '' }
          )
        : t(
            branch
              ? 'resolution.choice.modified.branch'
              : 'resolution.choice.modified',
            { branch: branch || '' }
          )
    case GitStatusEntry.Deleted:
      return selected
        ? t(
            branch
              ? 'resolution.selected.deleted.branch'
              : 'resolution.selected.deleted',
            { branch: branch || '' }
          )
        : t(
            branch
              ? 'resolution.choice.deleted.branch'
              : 'resolution.choice.deleted',
            { branch: branch || '' }
          )
    default:
      return assertNever(entry, 'Unknown status entry to format')
  }
}
