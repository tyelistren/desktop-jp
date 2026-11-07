import { translateUIRich } from './lib/translated-text'
import { t as translateUI } from '../lib/localization'
import * as React from 'react'

import { UiView } from './ui-view'
import { Dispatcher } from './dispatcher'
import { Repository } from '../models/repository'

import { Button } from './lib/button'
import { Row } from './lib/row'
import { LinkButton } from './lib/link-button'
import { addSafeDirectory, getRepositoryType } from '../lib/git'
import { Ref } from './lib/ref'
import { Loading } from './lib/loading'

interface IMissingRepositoryProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
}

interface IMissingRepositoryState {
  readonly isPathUnsafe: boolean
  readonly unsafePath?: string
  readonly isTrustingPath: boolean
}

/** The view displayed when a repository is missing. */
export class MissingRepository extends React.Component<
  IMissingRepositoryProps,
  IMissingRepositoryState
> {
  public constructor(props: IMissingRepositoryProps) {
    super(props)
    this.state = { isPathUnsafe: false, isTrustingPath: false }
  }

  private onTrustDirectory = async () => {
    this.setState({ isTrustingPath: true })
    const { unsafePath } = this.state
    const { repository } = this.props

    try {
      if (unsafePath) {
        await addSafeDirectory(unsafePath)
        const type = await getRepositoryType(repository.path)
        if (type.kind !== 'unsafe') {
          this.checkAgain()
        }
      }
    } catch (error) {
      this.props.dispatcher.postError(error)
    } finally {
      this.setState({ isTrustingPath: false })
    }
  }

  public async componentDidMount() {
    this.updateUnsafePathState()
  }

  public async componentDidUpdate(prevProps: IMissingRepositoryProps) {
    if (prevProps.repository.path !== this.props.repository.path) {
      this.updateUnsafePathState()
    }
  }

  private updateUnsafePathState = async () => {
    const { path } = this.props.repository
    const type = await getRepositoryType(path)
    if (path === this.props.repository.path) {
      this.setState({
        isPathUnsafe: type.kind === 'unsafe',
        unsafePath: type.kind === 'unsafe' ? type.path : undefined,
      })
    }
  }

  public render() {
    const buttons = new Array<JSX.Element>()
    const { isPathUnsafe, unsafePath } = this.state

    if (!isPathUnsafe) {
      buttons.push(
        <Button key="locate" onClick={this.locate} type="submit">
          {translateUI('ui.locate.a96a0f9')}
        </Button>
      )

      if (this.canCloneAgain()) {
        buttons.push(
          <Button key="clone-again" onClick={this.cloneAgain}>
            {translateUI('ui.clone-again.fc70bd1')}
          </Button>
        )
      }
    } else {
      buttons.push(
        <Button
          key="trustDirectory"
          onClick={this.onTrustDirectory}
          type="submit"
          disabled={this.state.isTrustingPath}
        >
          {this.state.isTrustingPath && <Loading />}
          {__DARWIN__
            ? translateUI('ui.trust-repository.a390952')
            : translateUI('ui.trust-repository.e35fff2')}
        </Button>
      )
    }

    buttons.push(
      <Button key="remove" onClick={this.remove}>
        {translateUI('ui.remove.e963907')}
      </Button>
    )

    if (isPathUnsafe) {
      return (
        <UiView id="missing-repository-view">
          <div className="title-container">
            <div className="title">
              {translateUIRich('ui.sentence.084c8782c986', {
                p0: this.props.repository.name,
              })}
            </div>
            <div className="details">
              <p>
                {translateUIRich('ui.sentence.4bb845de521e', {
                  p0: <Ref>{unsafePath}</Ref>,
                })}
              </p>
              <p>
                {translateUI(
                  'ui.if-you-trust-the-owner-of-the-directory-you-can-.02131f0'
                )}
              </p>
            </div>
          </div>

          <Row>{buttons}</Row>
        </UiView>
      )
    }

    return (
      <UiView id="missing-repository-view">
        <div className="title-container">
          <div className="title">
            {translateUIRich('ui.sentence.375ac01ab9c6', {
              p0: this.props.repository.name,
            })}
          </div>
          <div className="details">
            {translateUIRich('ui.sentence.37e418e5872e', {
              p0: <span className="path">{this.props.repository.path}</span>,
              p1: (
                <LinkButton onClick={this.checkAgain}>
                  {translateUI('ui.check-again.3965174')}
                </LinkButton>
              ),
            })}
          </div>
        </div>

        <Row>{buttons}</Row>
      </UiView>
    )
  }

  private canCloneAgain() {
    const gitHubRepository = this.props.repository.gitHubRepository
    return gitHubRepository && gitHubRepository.cloneURL
  }

  private checkAgain = () => {
    this.props.dispatcher.refreshRepository(this.props.repository)
  }

  private remove = () => {
    this.props.dispatcher.removeRepository(this.props.repository, false)
  }

  private locate = () => {
    this.props.dispatcher.relocateRepository(this.props.repository)
  }

  private cloneAgain = async () => {
    const gitHubRepository = this.props.repository.gitHubRepository
    if (!gitHubRepository) {
      return
    }

    const cloneURL = gitHubRepository.cloneURL
    if (!cloneURL) {
      return
    }

    try {
      await this.props.dispatcher.cloneAgain(
        cloneURL,
        this.props.repository.path
      )
    } catch (error) {
      this.props.dispatcher.postError(error)
    }
  }
}
