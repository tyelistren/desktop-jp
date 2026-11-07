import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import React from 'react'
import { Button } from '../lib/button'
import { Octicon, syncClockwise } from '../octicons'
import {
  DropdownItem,
  DropdownItemClassName,
  DropdownItemType,
  forcePushIcon,
} from './push-pull-button'

interface IPushPullButtonDropDownProps {
  readonly itemTypes: ReadonlyArray<DropdownItemType>
  /** The name of the remote. */
  readonly remoteName: string | null

  /** Will the app prompt the user to confirm a force push? */
  readonly askForConfirmationOnForcePush: boolean

  readonly fetch: () => void
  readonly forcePushWithLease: () => void
}

export class PushPullButtonDropDown extends React.Component<IPushPullButtonDropDownProps> {
  private buttonsContainerRef: HTMLDivElement | null = null

  public componentDidMount() {
    window.addEventListener('keydown', this.onDropdownKeyDown)
  }

  public componentWillUnmount() {
    window.removeEventListener('keydown', this.onDropdownKeyDown)
  }

  private onButtonsContainerRef = (ref: HTMLDivElement | null) => {
    this.buttonsContainerRef = ref
  }

  private onDropdownKeyDown = (event: KeyboardEvent) => {
    // Allow using Up and Down arrow keys to navigate the dropdown items
    // (equivalent to Tab and Shift+Tab)
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return
    }

    event.preventDefault()
    const items = this.buttonsContainerRef?.querySelectorAll<HTMLElement>(
      `.${DropdownItemClassName}`
    )

    if (items === undefined) {
      return
    }

    const focusedItem =
      this.buttonsContainerRef?.querySelector<HTMLElement>(':focus')
    if (!focusedItem) {
      return
    }

    const focusedIndex = Array.from(items).indexOf(focusedItem)
    const nextIndex =
      event.key === 'ArrowDown' ? focusedIndex + 1 : focusedIndex - 1
    // http://javascript.about.com/od/problemsolving/a/modulobug.htm
    const nextItem = items[(nextIndex + items.length) % items.length]
    nextItem?.focus()
  }

  private getDropdownItemWithType(type: DropdownItemType): DropdownItem {
    const { remoteName } = this.props

    switch (type) {
      case DropdownItemType.Fetch:
        return {
          title: `Fetch ${remoteName}`,
          description: `Fetch the latest changes from ${remoteName}`,
          action: this.props.fetch,
          icon: syncClockwise,
        }
      case DropdownItemType.ForcePush: {
        const forcePushWarning = this.props
          .askForConfirmationOnForcePush ? null : (
          <div className="warning">
            {translateUIRich('ui.sentence.a5ca31f211e5', {
              p0: (
                <span className="warning-title">
                  {translateUI('ui.warning.3217f29')}
                </span>
              ),
            })}
          </div>
        )
        return {
          title: `Force push ${remoteName}`,
          description: (
            <>
              {translateUIRich('ui.sentence.8bde373f3543', {
                p0: remoteName,
                p1: forcePushWarning,
              })}
            </>
          ),
          action: this.props.forcePushWithLease,
          icon: forcePushIcon,
        }
      }
    }
  }

  public renderDropdownItem = (type: DropdownItemType) => {
    const item = this.getDropdownItemWithType(type)
    return (
      <Button
        className={DropdownItemClassName}
        key={type}
        onClick={item.action}
      >
        <Octicon symbol={item.icon} />
        <div className="text-container">
          <div className="title">{item.title}</div>
          <div className="detail">{item.description}</div>
        </div>
      </Button>
    )
  }

  public render() {
    const { itemTypes } = this.props
    return (
      <div className="push-pull-dropdown" ref={this.onButtonsContainerRef}>
        {itemTypes.map(this.renderDropdownItem)}
      </div>
    )
  }
}
