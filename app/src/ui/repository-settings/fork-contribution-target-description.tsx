import { translateUIRich } from '../lib/translated-text'
import * as React from 'react'
import { ForkContributionTarget } from '../../models/workflow-preferences'
import { RepositoryWithForkedGitHubRepository } from '../../models/repository'

interface IForkSettingsDescription {
  readonly repository: RepositoryWithForkedGitHubRepository
  readonly forkContributionTarget: ForkContributionTarget
}

export function ForkSettingsDescription(props: IForkSettingsDescription) {
  // We can't use the getNonForkGitHubRepository() helper since we need to calculate
  // the value based on the temporary form state.
  const targetRepository =
    props.forkContributionTarget === ForkContributionTarget.Self
      ? props.repository.gitHubRepository
      : props.repository.gitHubRepository.parent

  return (
    <ul className="fork-settings-description">
      <li>
        {translateUIRich('ui.sentence.619746fb789f', {
          p0: <strong>{targetRepository.fullName}</strong>,
        })}
      </li>
      <li>
        {translateUIRich('ui.sentence.ea8f3f5e1ef7', {
          p0: <strong>{targetRepository.fullName}</strong>,
        })}
      </li>
      <li>
        {translateUIRich('ui.sentence.02ffd9547a7f', {
          p0: <strong>{targetRepository.fullName}</strong>,
        })}
      </li>
      <li>
        {translateUIRich('ui.sentence.a0f177ccfabd', {
          p0: <strong>{targetRepository.fullName}</strong>,
        })}
      </li>
      <li>
        {translateUIRich('ui.sentence.d8d484552847', {
          p0: <strong>{targetRepository.fullName}</strong>,
        })}
      </li>
    </ul>
  )
}
