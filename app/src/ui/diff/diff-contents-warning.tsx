import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import React from 'react'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { LinkButton } from '../lib/link-button'
import { ITextDiff, LineEndingsChange } from '../../models/diff'

enum DiffContentsWarningType {
  UnicodeBidiCharacters,
  LineEndingsChange,
}

type DiffContentsWarningItem =
  | {
      readonly type: DiffContentsWarningType.UnicodeBidiCharacters
    }
  | {
      readonly type: DiffContentsWarningType.LineEndingsChange
      readonly lineEndingsChange: LineEndingsChange
    }

interface IDiffContentsWarningProps {
  readonly diff: ITextDiff
}

export class DiffContentsWarning extends React.Component<IDiffContentsWarningProps> {
  public render() {
    const items = this.getTextDiffWarningItems()

    if (items.length === 0) {
      return null
    }

    return (
      <div className="diff-contents-warning-container">
        {items.map((item, i) => (
          <div className="diff-contents-warning" key={i}>
            <Octicon symbol={octicons.alert} />
            {this.getWarningMessageForItem(item)}
          </div>
        ))}
      </div>
    )
  }

  private getTextDiffWarningItems(): ReadonlyArray<DiffContentsWarningItem> {
    const items = new Array<DiffContentsWarningItem>()
    const { diff } = this.props

    if (diff.hasHiddenBidiChars) {
      items.push({
        type: DiffContentsWarningType.UnicodeBidiCharacters,
      })
    }

    if (diff.lineEndingsChange) {
      items.push({
        type: DiffContentsWarningType.LineEndingsChange,
        lineEndingsChange: diff.lineEndingsChange,
      })
    }

    return items
  }

  private getWarningMessageForItem(item: DiffContentsWarningItem) {
    switch (item.type) {
      case DiffContentsWarningType.UnicodeBidiCharacters:
        return (
          <>
            {translateUIRich('ui.sentence.8b3677accf8e', {
              p0: (
                <LinkButton uri="https://github.co/hiddenchars">
                  {translateUI(
                    'ui.learn-more-about-bidirectional-unicode-character.c268b7c'
                  )}
                </LinkButton>
              ),
            })}
          </>
        )

      case DiffContentsWarningType.LineEndingsChange:
        const { lineEndingsChange } = item
        return (
          <>
            {translateUIRich('ui.sentence.1f8204e4ad37', {
              p0: lineEndingsChange.from,
              p1: (
                <LinkButton uri="https://docs.github.com/get-started/git-basics/configuring-git-to-handle-line-endings">
                  {translateUI('ui.git-is-configured-to-convert-them.31936e3')}
                </LinkButton>
              ),
              p2: lineEndingsChange.to,
            })}
          </>
        )
    }
  }
}
