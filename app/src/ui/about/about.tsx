import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'

import { Row } from '../lib/row'
import { Button } from '../lib/button'
import {
  Dialog,
  DialogError,
  DialogContent,
  DefaultDialogFooter,
} from '../dialog'
import { LinkButton } from '../lib/link-button'
import { IUpdateState, UpdateStatus } from '../lib/update-store'
import { Loading } from '../lib/loading'
import { RelativeTime } from '../relative-time'
import { assertNever } from '../../lib/fatal-error'
import { ReleaseNotesUri } from '../lib/releases'
import { encodePathAsUrl } from '../../lib/path'
import { isOSNoLongerSupportedByElectron } from '../../lib/get-os'
import { AriaLiveContainer } from '../accessibility/aria-live-container'
import { formatDate } from '../../lib/format-date'

const logoPath = __DARWIN__
  ? 'static/logo-64x64@2x.png'
  : 'static/windows-logo-64x64@2x.png'
const DesktopLogo = encodePathAsUrl(__dirname, logoPath)

interface IAboutProps {
  /**
   * Event triggered when the dialog is dismissed by the user in the
   * ways described in the Dialog component's dismissible prop.
   */
  readonly onDismissed: () => void

  /**
   * The name of the currently installed (and running) application
   */
  readonly applicationName: string

  /**
   * The currently installed (and running) version of the app.
   */
  readonly applicationVersion: string

  /**
   * The currently installed (and running) architecture of the app.
   */
  readonly applicationArchitecture: string

  /** A function to call to kick off a non-staggered update check. */
  readonly onCheckForNonStaggeredUpdates: () => void

  readonly onShowAcknowledgements: () => void

  /** A function to call when the user wants to see Terms and Conditions. */
  readonly onShowTermsAndConditions: () => void
  readonly onQuitAndInstall: () => void

  readonly updateState: IUpdateState

  /**
   * A flag to indicate whether the About dialog should ignore that
   * it's running in development mode. Used exclusively by the AboutTestDialog
   */
  readonly allowDevelopment?: boolean
}

interface IUpdateInfoProps {
  readonly message: string
  readonly richMessage?: JSX.Element
  readonly loading?: boolean
}

class UpdateInfo extends React.Component<IUpdateInfoProps> {
  public render() {
    return (
      <div className="update-status">
        <AriaLiveContainer message={this.props.message} />

        {this.props.loading && <Loading />}
        {this.props.richMessage ?? this.props.message}
      </div>
    )
  }
}

/**
 * A dialog that presents information about the
 * running application such as name and version.
 */
export class About extends React.Component<IAboutProps> {
  private get canCheckForUpdates() {
    return (
      __RELEASE_CHANNEL__ !== 'development' ||
      this.props.allowDevelopment === true
    )
  }

  private renderUpdateButton() {
    if (!this.canCheckForUpdates) {
      return null
    }

    const updateStatus = this.props.updateState.status

    switch (updateStatus) {
      case UpdateStatus.UpdateReady:
        return (
          <Row>
            <Button onClick={this.props.onQuitAndInstall}>
              {translateUI('ui.quit-and-install-update.29e3c2d')}
            </Button>
          </Row>
        )
      case UpdateStatus.UpdateNotAvailable:
      case UpdateStatus.CheckingForUpdates:
      case UpdateStatus.UpdateAvailable:
      case UpdateStatus.UpdateNotChecked:
        const disabled =
          ![
            UpdateStatus.UpdateNotChecked,
            UpdateStatus.UpdateNotAvailable,
          ].includes(updateStatus) || isOSNoLongerSupportedByElectron()

        const buttonTitle = 'Check for Updates'

        return (
          <Row>
            <Button
              disabled={disabled}
              onClick={this.props.onCheckForNonStaggeredUpdates}
            >
              {buttonTitle}
            </Button>
          </Row>
        )
      default:
        return assertNever(
          updateStatus,
          `Unknown update status ${updateStatus}`
        )
    }
  }

  private renderUpdateDetails() {
    if (__LINUX__) {
      return null
    }

    if (!this.canCheckForUpdates) {
      return (
        <p>
          {translateUI(
            'ui.the-application-is-currently-running-in-developm.9608b53'
          )}
        </p>
      )
    }

    const { status, lastSuccessfulCheck } = this.props.updateState

    switch (status) {
      case UpdateStatus.CheckingForUpdates:
        return <UpdateInfo message="Checking for updates…" loading={true} />
      case UpdateStatus.UpdateAvailable:
        return <UpdateInfo message="Downloading update…" loading={true} />
      case UpdateStatus.UpdateNotAvailable:
        if (!lastSuccessfulCheck) {
          return null
        }

        const richMessage = (
          <p>
            {translateUIRich('ui.sentence.e14897e87c79', {
              p0: <RelativeTime date={lastSuccessfulCheck} />,
            })}
          </p>
        )

        const absoluteDate = formatDate(lastSuccessfulCheck, {
          dateStyle: 'full',
          timeStyle: 'short',
        })

        return (
          <UpdateInfo
            message={`You have the latest version (last checked ${absoluteDate})`}
            richMessage={richMessage}
          />
        )
      case UpdateStatus.UpdateReady:
        return (
          <UpdateInfo message="An update has been downloaded and is ready to be installed." />
        )
      case UpdateStatus.UpdateNotChecked:
        return null
      default:
        return assertNever(status, `Unknown update status ${status}`)
    }
  }

  private renderUpdateErrors() {
    if (__LINUX__) {
      return null
    }

    if (!this.canCheckForUpdates) {
      return null
    }

    if (isOSNoLongerSupportedByElectron()) {
      return (
        <DialogError>
          {translateUIRich('ui.sentence.401d2dda16bf', {
            p0: (
              <LinkButton uri="https://docs.github.com/en/desktop/installing-and-configuring-github-desktop/overview/supported-operating-systems">
                {translateUI('ui.supported-operating-systems.f416493')}
              </LinkButton>
            ),
          })}
        </DialogError>
      )
    }

    if (!this.props.updateState.lastSuccessfulCheck) {
      return (
        <DialogError>
          {translateUI(
            'ui.couldn-t-determine-the-last-time-an-update-check.30f660d'
          )}
        </DialogError>
      )
    }

    return null
  }

  private renderBetaLink() {
    if (__RELEASE_CHANNEL__ === 'beta') {
      return
    }

    return (
      <div>
        <p className="no-padding">
          {translateUI('ui.looking-for-the-latest-features.b572def')}
        </p>
        <p className="no-padding">
          {translateUIRich('ui.sentence.cae4e00827bf', {
            p0: (
              <LinkButton uri="https://desktop.github.com/beta">
                {translateUI('ui.beta-channel.c7dde0b')}
              </LinkButton>
            ),
          })}
        </p>
      </div>
    )
  }

  public render() {
    const name = this.props.applicationName
    const version = this.props.applicationVersion
    const releaseNotesLink = (
      <LinkButton uri={ReleaseNotesUri}>
        {translateUI('ui.release-notes.36d60d5')}
      </LinkButton>
    )

    const versionText = __DEV__ ? `Build ${version}` : `Version ${version}`
    const titleId = 'Dialog_about'

    return (
      <Dialog
        id="about"
        titleId={titleId}
        onSubmit={this.props.onDismissed}
        onDismissed={this.props.onDismissed}
      >
        {this.renderUpdateErrors()}
        <DialogContent>
          <Row className="logo">
            <img
              src={DesktopLogo}
              alt="GitHub Desktop"
              width="64"
              height="64"
            />
          </Row>
          <h1 id={titleId}>
            {translateUIRich('ui.sentence.91bc7847f0de', { p0: name })}
          </h1>
          <p className="no-padding">
            <span className="selectable-text">
              {versionText} ({this.props.applicationArchitecture})
            </span>{' '}
            ({releaseNotesLink})
          </p>
          {this.renderUpdateDetails()}
          {this.renderUpdateButton()}
          {this.renderBetaLink()}
          <div className="terms-and-license-container">
            <p className="no-padding terms-and-license">
              <LinkButton onClick={this.props.onShowTermsAndConditions}>
                {translateUI('ui.terms-and-conditions.894031e')}
              </LinkButton>
            </p>
            <p className="no-padding terms-and-license">
              <LinkButton onClick={this.props.onShowAcknowledgements}>
                {translateUI('ui.license-and-open-source-notices.77699e8')}
              </LinkButton>
            </p>
            <p className="terms-and-license">
              <LinkButton uri="https://gh.io/copilot-for-desktop-transparency">
                {translateUI(
                  'ui.responsible-use-of-copilot-in-github-desktop.8a98c73'
                )}
              </LinkButton>
            </p>
          </div>
        </DialogContent>
        <DefaultDialogFooter />
      </Dialog>
    )
  }
}
