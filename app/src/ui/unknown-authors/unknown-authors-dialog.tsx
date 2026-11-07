import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'

import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { PathText } from '../lib/path-text'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { UnknownAuthor } from '../../models/author'

interface IUnknownAuthorsProps {
  readonly authors: ReadonlyArray<UnknownAuthor>
  readonly onCommit: () => void
  readonly onDismissed: () => void
}

/**
 * Don't list more than this number of authors.
 */
const MaxAuthorsToList = 10

/** A component to confirm commit when unknown co-authors were added. */
export class UnknownAuthors extends React.Component<IUnknownAuthorsProps> {
  public constructor(props: IUnknownAuthorsProps) {
    super(props)
  }

  public render() {
    return (
      <Dialog
        id="unknown-authors"
        title={
          __DARWIN__
            ? translateUI('ui.unknown-co-authors.855658a')
            : translateUI('ui.unknown-co-authors.15a2b43')
        }
        onDismissed={this.props.onDismissed}
        onSubmit={this.commit}
        type="warning"
      >
        <DialogContent>{this.renderAuthorList()}</DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={
              __DARWIN__
                ? translateUI('ui.commit-anyway.ced8790')
                : translateUI('ui.commit-anyway.ce72911')
            }
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private renderAuthorList() {
    if (this.props.authors.length > MaxAuthorsToList) {
      return (
        <p>
          {translateUIRich('ui.sentence.1de0501c5f21', {
            p0: this.props.authors.length,
          })}
        </p>
      )
    } else {
      return (
        <div>
          <p>
            {translateUI(
              'ui.these-users-weren-t-found-and-won-t-be-added-as-.78e2fc9'
            )}
          </p>
          <div className="author-list">
            <ul>
              {this.props.authors.map(a => (
                <li key={a.username}>
                  <PathText path={a.username} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    }
  }

  private commit = async () => {
    this.props.onCommit()
    this.props.onDismissed()
  }
}
