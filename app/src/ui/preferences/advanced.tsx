import { t } from '../../lib/localization'
import * as React from 'react'
import { DialogContent } from '../dialog'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { LinkButton } from '../lib/link-button'
import { SamplesURL } from '../../lib/stats'
import { isWindowsOpenSSHAvailable } from '../../lib/ssh/ssh'

interface IAdvancedPreferencesProps {
  readonly useWindowsOpenSSH: boolean
  readonly optOutOfUsageTracking: boolean
  readonly useExternalCredentialHelper: boolean
  readonly repositoryIndicatorsEnabled: boolean
  readonly onUseWindowsOpenSSHChanged: (checked: boolean) => void
  readonly onOptOutofReportingChanged: (checked: boolean) => void
  readonly onUseExternalCredentialHelperChanged: (checked: boolean) => void
  readonly onRepositoryIndicatorsEnabledChanged: (enabled: boolean) => void
}

interface IAdvancedPreferencesState {
  readonly optOutOfUsageTracking: boolean
  readonly canUseWindowsSSH: boolean
  readonly useExternalCredentialHelper: boolean
}

export class Advanced extends React.Component<
  IAdvancedPreferencesProps,
  IAdvancedPreferencesState
> {
  public constructor(props: IAdvancedPreferencesProps) {
    super(props)

    this.state = {
      optOutOfUsageTracking: this.props.optOutOfUsageTracking,
      canUseWindowsSSH: false,
      useExternalCredentialHelper: this.props.useExternalCredentialHelper,
    }
  }

  public componentDidMount() {
    this.checkSSHAvailability()
  }

  private async checkSSHAvailability() {
    this.setState({ canUseWindowsSSH: await isWindowsOpenSSHAvailable() })
  }

  private onReportingOptOutChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked

    this.setState({ optOutOfUsageTracking: value })
    this.props.onOptOutofReportingChanged(value)
  }

  private onUseExternalCredentialHelperChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ useExternalCredentialHelper: value })
    this.props.onUseExternalCredentialHelperChanged(value)
  }

  private onRepositoryIndicatorsEnabledChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onRepositoryIndicatorsEnabledChanged(event.currentTarget.checked)
  }

  private onUseWindowsOpenSSHChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onUseWindowsOpenSSHChanged(event.currentTarget.checked)
  }

  private reportDesktopUsageLabel() {
    return (
      <span>
        {t('advanced.usageHelp')}{' '}
        <LinkButton uri={SamplesURL}>{t('advanced.usageDetails')}</LinkButton>
      </span>
    )
  }

  public render() {
    return (
      <DialogContent>
        <div className="advanced-section">
          <h2>{t('advanced.background')}</h2>
          <Checkbox
            label={t('advanced.indicators')}
            value={
              this.props.repositoryIndicatorsEnabled
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onRepositoryIndicatorsEnabledChanged}
            ariaDescribedBy="periodic-fetch-description"
          />
          <div id="periodic-fetch-description" className="settings-description">
            <p>{t('advanced.indicatorsHelp')}</p>
            <p>{t('advanced.performance')}</p>
          </div>
        </div>
        <div className="advanced-section">
          <h2>{t('advanced.usage')}</h2>
          <Checkbox
            label={this.reportDesktopUsageLabel()}
            value={
              this.state.optOutOfUsageTracking
                ? CheckboxValue.Off
                : CheckboxValue.On
            }
            onChange={this.onReportingOptOutChanged}
          />
        </div>
        <h2>{t('advanced.network')}</h2>
        {this.renderSSHSettings()}
        <div className="advanced-section">
          <Checkbox
            label={t('advanced.credential')}
            value={
              this.state.useExternalCredentialHelper
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onUseExternalCredentialHelperChanged}
            ariaDescribedBy="use-external-credential-helper-description"
          />
          <div
            id="use-external-credential-helper-description"
            className="settings-description"
          >
            <p>
              {t('advanced.credentialHelp')}{' '}
              <LinkButton uri="https://gh.io/gcm">
                Git Credential Manager
              </LinkButton>
            </p>
          </div>
        </div>
      </DialogContent>
    )
  }

  private renderSSHSettings() {
    if (!this.state.canUseWindowsSSH) {
      return null
    }

    return (
      <div className="advanced-section">
        <Checkbox
          label={t('advanced.ssh')}
          value={
            this.props.useWindowsOpenSSH ? CheckboxValue.On : CheckboxValue.Off
          }
          onChange={this.onUseWindowsOpenSSHChanged}
        />
      </div>
    )
  }
}
