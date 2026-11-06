import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'

import {
  RepositoryWithForkedGitHubRepository,
  getForkContributionTarget,
} from '../../models/repository'
import { Dispatcher } from '../dispatcher'
import { Row } from '../lib/row'
import { Dialog, DialogContent, DialogFooter } from '../dialog'

import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { ForkContributionTarget } from '../../models/workflow-preferences'
import { VerticalSegmentedControl } from '../lib/vertical-segmented-control'
import { ForkSettingsDescription } from '../repository-settings/fork-contribution-target-description'

interface IChooseForkSettingsProps {
  readonly dispatcher: Dispatcher
  /**
   * The current repository.
   * It needs to be a forked GitHub-based repository
   */
  readonly repository: RepositoryWithForkedGitHubRepository
  /**
   * Event triggered when the dialog is dismissed by the user.
   * This happens both when the user clicks on "Continue" to
   * save their changes or when they click on "Cancel".
   */
  readonly onDismissed: () => void
}

interface IChooseForkSettingsState {
  /** The currently selected ForkContributionTarget value */
  readonly forkContributionTarget: ForkContributionTarget
}

export class ChooseForkSettings extends React.Component<
  IChooseForkSettingsProps,
  IChooseForkSettingsState
> {
  public constructor(props: IChooseForkSettingsProps) {
    super(props)

    this.state = {
      forkContributionTarget: getForkContributionTarget(props.repository),
    }
  }

  public render() {
    const items = [
      {
        title: translateUI('ui.to-contribute-to-the-parent-project.8ba2b85'),
        description: (
          <>
            {translateUIRich('ui.sentence.7ca88871724e', {
              p0: (
                <strong>
                  {this.props.repository.gitHubRepository.parent.fullName}
                </strong>
              ),
            })}
          </>
        ),
        key: ForkContributionTarget.Parent,
      },
      {
        title: translateUI('ui.for-my-own-purposes.1e59828'),
        description: (
          <>
            {translateUIRich('ui.sentence.7ca88871724e', {
              p0: (
                <strong>
                  {this.props.repository.gitHubRepository.fullName}
                </strong>
              ),
            })}
          </>
        ),
        key: ForkContributionTarget.Self,
      },
    ]

    return (
      <Dialog
        id="fork-settings"
        title={translateUI('ui.how-are-you-planning-to-use-this-fork.af6f0bb')}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <Row>
            <VerticalSegmentedControl
              label={translateUI(
                'ui.this-repository-is-a-fork-how-do-you-plan-to-use.9841bb5'
              )}
              items={items}
              selectedKey={this.state.forkContributionTarget}
              onSelectionChanged={this.onSelectionChanged}
            />
          </Row>
          <Row>
            <ForkSettingsDescription
              repository={this.props.repository}
              forkContributionTarget={this.state.forkContributionTarget}
            />
          </Row>
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={translateUI('ui.continue.2e02623')}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSelectionChanged = (value: ForkContributionTarget) => {
    this.setState({
      forkContributionTarget: value,
    })
  }

  private onSubmit = async () => {
    this.props.dispatcher.updateRepositoryWorkflowPreferences(
      this.props.repository,
      {
        forkContributionTarget: this.state.forkContributionTarget,
      }
    )
    this.props.onDismissed()
  }
}
