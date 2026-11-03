import { t } from '../../lib/localization'
import * as React from 'react'
import { encodePathAsUrl } from '../../lib/path'
import { LinkButton } from '../lib/link-button'

const BlankSlateImage = encodePathAsUrl(
  __dirname,
  'static/empty-no-pull-requests.svg'
)

interface INoPullRequestsProps {
  /** The name of the repository. */
  readonly repositoryName: string

  /** Is the default branch currently checked out? */
  readonly isOnDefaultBranch: boolean

  /** Is this component being rendered due to a search? */
  readonly isSearch: boolean

  /* Called when the user wants to create a new branch. */
  readonly onCreateBranch: () => void

  /** Called when the user wants to create a pull request. */
  readonly onCreatePullRequest: () => void

  /** Are we currently loading pull requests? */
  readonly isLoadingPullRequests: boolean
}

/** The placeholder for when there are no open pull requests. */
export class NoPullRequests extends React.Component<INoPullRequestsProps, {}> {
  public render() {
    return (
      <div className="no-pull-requests">
        <img src={BlankSlateImage} className="blankslate-image" alt="" />
        {this.renderTitle()}
        {this.renderCallToAction()}
      </div>
    )
  }

  private renderTitle() {
    if (this.props.isSearch) {
      return <div className="title">{t('pr.notFound')}</div>
    } else if (this.props.isLoadingPullRequests) {
      return <div className="title">{t('pr.wait')}</div>
    } else {
      return (
        <div>
          <div className="title">{t('pr.allSet')}</div>
          <div className="no-prs">
            {t('pr.none', { repository: this.props.repositoryName })}
          </div>
        </div>
      )
    }
  }

  private renderCallToAction() {
    if (this.props.isLoadingPullRequests) {
      return <div className="call-to-action">{t('pr.loading')}</div>
    }

    if (this.props.isOnDefaultBranch) {
      return (
        <div className="call-to-action">
          {t('pr.prompt')}{' '}
          <LinkButton onClick={this.props.onCreateBranch}>
            {t('pr.newBranch')}
          </LinkButton>{' '}
          {t('pr.branchHelp')}
        </div>
      )
    } else {
      return (
        <div className="call-to-action">
          {t('pr.prompt')}{' '}
          <LinkButton onClick={this.props.onCreatePullRequest}>
            {t('pr.create')}
          </LinkButton>{' '}
          {t('pr.createHelp')}
        </div>
      )
    }
  }
}
