import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { GitHubRepository } from '../../models/github-repository'
import {
  RepoRulesMetadataFailure,
  RepoRulesMetadataFailures,
} from '../../models/repo-rules'
import { RepoRulesetsForBranchLink } from './repo-rulesets-for-branch-link'
import { RepoRulesetLink } from './repo-ruleset-link'

interface IRepoRulesMetadataFailureListProps {
  readonly repository: GitHubRepository
  readonly branch: string
  readonly failures: RepoRulesMetadataFailures

  /**
   * Text that will come before the standard text, should be the name of the rule
   * that's being checked. For example, "The email in your global Git config" or
   * "This commit message".
   */
  readonly leadingText: string | JSX.Element
}

/**
 * Returns a standard message for failed repo metadata rules.
 */
export class RepoRulesMetadataFailureList extends React.Component<IRepoRulesMetadataFailureListProps> {
  public render() {
    const { repository, branch, failures, leadingText } = this.props

    const totalFails = failures.failed.length + failures.bypassed.length
    let endText: string
    if (failures.status === 'bypass') {
      endText = translateUI('ui.detail.bypassRules')
    } else {
      endText = '.'
    }

    return (
      <div className="repo-rules-failure-list-component">
        <p>
          {translateUIRich('ui.sentence.ca4e9ba7bcd1', {
            p0: leadingText,
            p1:
              totalFails === 1
                ? translateUI('ui.detail.ruleOne', { count: totalFails })
                : translateUI('ui.detail.ruleMany', { count: totalFails }),
            p3: endText,
            p4: (
              <RepoRulesetsForBranchLink
                repository={repository}
                branch={branch}
              >
                {translateUI('ui.view-all-rulesets-for-this-branch.d2b780b')}
              </RepoRulesetsForBranchLink>
            ),
          })}
        </p>
        {this.renderRuleFailureList(failures.failed, 'Failed')}
        {this.renderRuleFailureList(failures.bypassed, 'Bypassed')}
      </div>
    )
  }

  private renderRuleFailureList(
    failures: RepoRulesMetadataFailure[],
    label: string
  ) {
    if (failures.length === 0) {
      return null
    }
    const rulesText =
      label === 'Failed'
        ? translateUI('ui.detail.failedRules')
        : translateUI('ui.detail.bypassedRules')
    const labelId = `repo-rule-list-label-${label.toLowerCase()}`
    return (
      <div className="repo-rule-list">
        <label id={labelId}>{rulesText}:</label>
        <ul aria-labelledby={labelId}>
          {failures.map(f => (
            <li key={`${f.description}-${f.rulesetId}`}>
              <RepoRulesetLink
                repository={this.props.repository}
                rulesetId={f.rulesetId}
              >
                {f.description}
              </RepoRulesetLink>
            </li>
          ))}
        </ul>
      </div>
    )
  }
}
