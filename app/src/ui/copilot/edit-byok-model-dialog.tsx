import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'
import { Dialog, DialogContent, DialogFooter, DialogError } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { TextBox } from '../lib/text-box'
import { Select } from '../lib/select'
import { Row } from '../lib/row'
import { IBYOKModel } from '../../lib/copilot/byok'
import {
  formatReasoningEffort,
  ReasoningEffort,
  ReasoningEffortOrder,
} from '../../lib/stores/copilot-store'

const NoReasoningEffort = '__none__'

interface IEditCopilotBYOKModelDialogProps {
  /** The model being edited, or `null` when adding a new model. */
  readonly model: IBYOKModel | null
  /**
   * Existing model IDs in the same provider, used to detect duplicates.
   * Excludes the model being edited.
   */
  readonly otherModelIds: ReadonlyArray<string>
  readonly onSave: (model: IBYOKModel) => void
  readonly onDismissed: () => void
}

interface IEditCopilotBYOKModelDialogState {
  readonly id: string
  readonly name: string
  readonly reasoningEffort: ReasoningEffort | typeof NoReasoningEffort
  readonly errorMessage: string | null
}

/**
 * Add/edit dialog for a single model belonging to a BYOK Copilot provider.
 * The model is returned to the parent via the `onSave` callback prop and is
 * not persisted directly.
 */
export class EditCopilotBYOKModelDialog extends React.Component<
  IEditCopilotBYOKModelDialogProps,
  IEditCopilotBYOKModelDialogState
> {
  public constructor(props: IEditCopilotBYOKModelDialogProps) {
    super(props)
    this.state = {
      id: props.model?.id ?? '',
      name: props.model?.name ?? '',
      reasoningEffort: props.model?.reasoningEffort ?? NoReasoningEffort,
      errorMessage: null,
    }
  }

  public render() {
    const isEditing = this.props.model !== null
    const title = isEditing
      ? __DARWIN__
        ? translateUI('ui.edit-model.c1a2355')
        : translateUI('ui.edit-model.3e5f6c0')
      : __DARWIN__
      ? translateUI('ui.add-model.e0f7f21')
      : translateUI('ui.add-model.b6a86ca')

    return (
      <Dialog
        id="edit-copilot-byok-model"
        title={title}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
      >
        {this.state.errorMessage !== null && (
          <DialogError>{this.state.errorMessage}</DialogError>
        )}
        <DialogContent>
          <Row className="copilot-byok-field">
            <TextBox
              label={
                __DARWIN__
                  ? translateUI('ui.display-name.8d6b348')
                  : translateUI('ui.display-name.c7874aa')
              }
              value={this.state.name}
              onValueChanged={this.onNameChanged}
              placeholder="GPT-4o"
              autoFocus={true}
            />
            <p className="copilot-byok-field-hint">
              {translateUI(
                'ui.the-friendly-name-shown-in-the-copilot-model-pic.2bb9f5a'
              )}
            </p>
          </Row>
          <Row className="copilot-byok-field">
            <TextBox
              label={
                __DARWIN__
                  ? translateUI('ui.model-identifier.26af455')
                  : translateUI('ui.model-identifier.1f7b6c1')
              }
              value={this.state.id}
              onValueChanged={this.onIdChanged}
              placeholder="gpt-4o"
              required={true}
            />
            <p className="copilot-byok-field-hint">
              {translateUIRich('ui.sentence.cb8ca58da76f', {
                p0: <code>gpt-4o</code>,
                p1: <code>llama3</code>,
              })}
            </p>
          </Row>
          <Row className="copilot-byok-field">
            <Select
              label={
                __DARWIN__
                  ? translateUI('ui.reasoning-effort.5ca4676')
                  : translateUI('ui.reasoning-effort.cd32c0f')
              }
              value={this.state.reasoningEffort}
              onChange={this.onReasoningEffortChanged}
            >
              <option value={NoReasoningEffort}>
                {translateUI('ui.default-provider-s-choice.5f3aab1')}
              </option>
              {ReasoningEffortOrder.map(effort => (
                <option key={effort} value={effort}>
                  {formatReasoningEffort(effort)}
                </option>
              ))}
            </Select>
            <p className="copilot-byok-field-hint">
              {translateUIRich('ui.sentence.f51f75fe8f27', {
                p0: <em>{translateUI('ui.default.808d7dc')}</em>,
              })}
            </p>
          </Row>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={
              isEditing
                ? translateUI('ui.save.efc007a')
                : translateUI('ui.add.61cc55a')
            }
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onIdChanged = (id: string) => this.setState({ id })

  private onNameChanged = (name: string) => this.setState({ name })

  private onReasoningEffortChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    const value = event.currentTarget.value
    this.setState({
      reasoningEffort:
        value === NoReasoningEffort
          ? NoReasoningEffort
          : (value as ReasoningEffort),
    })
  }

  private onSubmit = () => {
    const validationError = this.validate()
    if (validationError !== null) {
      this.setState({ errorMessage: validationError })
      return
    }

    const id = this.state.id.trim()
    const name = this.state.name.trim() === '' ? id : this.state.name.trim()
    const model: IBYOKModel = {
      id,
      name,
      ...(this.state.reasoningEffort !== NoReasoningEffort
        ? { reasoningEffort: this.state.reasoningEffort }
        : {}),
    }

    this.props.onSave(model)
    this.props.onDismissed()
  }

  private validate(): string | null {
    const id = this.state.id.trim()
    if (id === '') {
      return 'Please enter a model identifier.'
    }
    if (this.props.otherModelIds.includes(id)) {
      return `Another model with the identifier '${id}' already exists.`
    }
    return null
  }
}
