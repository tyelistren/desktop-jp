import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { assertNever } from '../../lib/fatal-error'
import { ComputedAction } from '../../models/computed-action'
import { MergeTreeResult } from '../../models/merge'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'

interface IPullRequestMergeStatusProps {
  /** The result of merging the pull request branch into the base branch */
  readonly mergeStatus: MergeTreeResult | null
}

/** The component to display message about the result of merging the pull
 * request. */
export class PullRequestMergeStatus extends React.Component<IPullRequestMergeStatusProps> {
  private getMergeStatusDescription = () => {
    const { mergeStatus } = this.props
    if (mergeStatus === null) {
      return ''
    }

    const { kind } = mergeStatus
    switch (kind) {
      case ComputedAction.Loading:
        return (
          <span className="pr-merge-status-loading">
            {translateUIRich('ui.sentence.0b80d44559f2', {
              p0: (
                <strong>
                  {translateUI('ui.checking-mergeability.7d9d2e2')}
                </strong>
              ),
            })}
          </span>
        )
      case ComputedAction.Invalid:
        return (
          <span className="pr-merge-status-invalid">
            {translateUIRich('ui.sentence.afa4c02e3f47', {
              p0: (
                <strong>
                  {translateUI('ui.error-checking-merge-status.868e561')}
                </strong>
              ),
            })}
          </span>
        )
      case ComputedAction.Clean:
        return (
          <span className="pr-merge-status-clean">
            {translateUIRich('ui.sentence.fc0eef9ac4c2', {
              p0: (
                <strong>
                  {translateUIRich('ui.sentence.d9c53e391a91', {
                    p0: <Octicon symbol={octicons.check} />,
                  })}
                </strong>
              ),
            })}
          </span>
        )
      case ComputedAction.Conflicts:
        return (
          <span className="pr-merge-status-conflicts">
            {translateUIRich('ui.sentence.0b80d44559f2', {
              p0: (
                <strong>
                  {translateUIRich('ui.sentence.6cf574b5068d', {
                    p0: <Octicon symbol={octicons.x} />,
                  })}
                </strong>
              ),
            })}
          </span>
        )
      default:
        return assertNever(kind, `Unknown merge status kind of ${kind}.`)
    }
  }

  public render() {
    return (
      <div className="pull-request-merge-status">
        {this.getMergeStatusDescription()}
      </div>
    )
  }
}
