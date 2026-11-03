import { t } from '../../lib/localization'
import { IMenuItem } from '../../lib/menu-item'
import { writeClipboardText } from '../main-process-proxy'
import { Branch, BranchType } from '../../models/branch'

interface IBranchContextMenuConfig {
  branch: Branch
  onRenameBranch?: (branchName: string) => void
  onViewBranchOnGitHub?: () => void
  onViewPullRequestOnGitHub?: () => void
  onDeleteBranch?: (branchName: string) => void
  onCheckoutInNewWorktree?: (branch: Branch) => void
}

export function generateBranchContextMenuItems(
  config: IBranchContextMenuConfig
): IMenuItem[] {
  const {
    branch,
    onRenameBranch,
    onViewBranchOnGitHub,
    onViewPullRequestOnGitHub,
    onDeleteBranch,
    onCheckoutInNewWorktree,
  } = config
  const items = new Array<IMenuItem>()

  if (onRenameBranch !== undefined) {
    items.push({
      label: t('branch.renameMenu'),
      action: () => onRenameBranch(branch.name),
      enabled: branch.type === BranchType.Local,
    })
  }

  items.push({
    label: __DARWIN__ ? t('branch.copyMac') : t('branch.copy'),
    action: () => writeClipboardText(branch.name),
  })

  if (onViewBranchOnGitHub !== undefined) {
    items.push({
      label: t('branch.view'),
      action: () => onViewBranchOnGitHub(),
    })
  }

  if (onViewPullRequestOnGitHub !== undefined) {
    items.push({
      label: t('branch.viewPR'),
      action: () => onViewPullRequestOnGitHub(),
    })
  }

  if (onCheckoutInNewWorktree !== undefined) {
    items.push({
      label: __DARWIN__ ? t('branch.worktreeMac') : t('branch.worktree'),
      action: () => onCheckoutInNewWorktree(branch),
    })
  }

  items.push({ type: 'separator' })

  if (onDeleteBranch !== undefined) {
    items.push({
      label: t('branch.deleteMenu'),
      action: () => onDeleteBranch(branch.name),
    })
  }

  return items
}
