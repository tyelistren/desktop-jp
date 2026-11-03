import * as React from 'react'
import { promises as fs } from 'fs'
import { Button } from '../lib/button'
import { Select } from '../lib/select'
import { showOpenDialog, showSaveDialog } from '../main-process-proxy'
import {
  getLanguage,
  getLanguagePack,
  saveLanguage,
  t,
  Language,
} from '../../lib/localization'
import {
  parseLanguagePack,
  serializeLanguagePack,
} from '../../lib/localization/pack'

interface ILanguageState {
  readonly language: Language
  readonly source?: string
  readonly message: string
  readonly busy: boolean
}

/** Editable language pack controls; Git data and credentials are never touched. */
export class LanguagePreferences extends React.Component<{}, ILanguageState> {
  public state: ILanguageState = {
    language: getLanguage(),
    message: '',
    busy: false,
  }

  private onLanguageChanged = (event: React.FormEvent<HTMLSelectElement>) => {
    const language = event.currentTarget.value
    if (language === 'ja' || language === 'en' || language === 'custom') {
      this.setState({ language, message: '' })
    }
  }

  private onImport = async () => {
    this.setState({ busy: true, message: '' })
    try {
      const result = await showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Language pack', extensions: ['ini', 'txt'] }],
      })
      const path = result
      if (path === null) {
        return
      }
      if ((await fs.stat(path)).size > 1024 * 1024) {
        throw new Error(
          'Language pack exceeds 1 MB / 言語パックは1MB以下にしてください'
        )
      }
      const source = await fs.readFile(path, 'utf8')
      parseLanguagePack(source)
      this.setState({ source, language: 'custom' })
    } catch (error) {
      this.setState({ message: String(error) })
    } finally {
      this.setState({ busy: false })
    }
  }

  private onExport = async () => {
    this.setState({ busy: true, message: '' })
    try {
      const result = await showSaveDialog({
        defaultPath: `${this.state.language}.ini`,
        filters: [{ name: 'Language pack', extensions: ['ini'] }],
      })
      if (result !== null) {
        const pack =
          this.state.language === 'custom' && this.state.source !== undefined
            ? parseLanguagePack(this.state.source)
            : getLanguagePack(this.state.language)
        await fs.writeFile(result, serializeLanguagePack(pack), 'utf8')
      }
    } catch (error) {
      this.setState({ message: String(error) })
    } finally {
      this.setState({ busy: false })
    }
  }

  private onSave = () => {
    try {
      saveLanguage(
        this.state.language,
        this.state.language === 'custom' ? this.state.source : undefined
      )
      this.setState({ message: t('language.restart') })
    } catch (error) {
      this.setState({ message: String(error) })
    }
  }

  public render() {
    return (
      <section className="appearance-section">
        <h2>{t('language.title')}</h2>
        <p>{t('language.help')}</p>
        <Select
          label={t('language.select')}
          value={this.state.language}
          onChange={this.onLanguageChanged}
          disabled={this.state.busy}
        >
          <option value="ja">日本語</option>
          <option value="en">English</option>
          <option value="custom">{t('language.custom')}</option>
        </Select>
        <Button
          type="button"
          disabled={this.state.busy}
          onClick={this.onImport}
        >
          {t('language.import')}
        </Button>
        <Button
          type="button"
          disabled={this.state.busy}
          onClick={this.onExport}
        >
          {t('language.export')}
        </Button>
        <Button type="button" disabled={this.state.busy} onClick={this.onSave}>
          {t('language.apply')}
        </Button>
        <p role="status">{this.state.message}</p>
      </section>
    )
  }
}
