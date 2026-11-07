import { translateUIRich } from '../lib/translated-text'
import { t as translateUI } from '../../lib/localization'
import * as React from 'react'

import { encodePathAsUrl } from '../../lib/path'

const CodeImage = encodePathAsUrl(__dirname, 'static/code.svg')
const TeamDiscussionImage = encodePathAsUrl(
  __dirname,
  'static/github-for-teams.svg'
)
const CloudServerImage = encodePathAsUrl(
  __dirname,
  'static/github-for-business.svg'
)

export class TutorialWelcome extends React.Component {
  public render() {
    return (
      <div id="tutorial-welcome">
        <div className="header">
          <h1>{translateUI('ui.welcome-to-github-desktop.7c415f8')}</h1>
          <p>
            {translateUI(
              'ui.use-this-tutorial-to-get-comfortable-with-git-gi.2fa699d'
            )}
          </p>
        </div>
        <ul className="definitions">
          <li>
            <img src={CodeImage} alt="Html syntax icon" />
            <p>
              {translateUIRich('ui.sentence.118837477445', {
                p0: <strong>Git</strong>,
              })}
            </p>
          </li>
          <li>
            <img
              src={TeamDiscussionImage}
              alt="People with discussion bubbles overhead"
            />
            <p>
              {translateUIRich('ui.sentence.23e9e3660bcf', {
                p0: <strong>GitHub</strong>,
              })}
            </p>
          </li>
          <li>
            <img src={CloudServerImage} alt="Server stack with cloud" />
            <p>
              {translateUIRich('ui.sentence.896546cc5bf1', {
                p0: <strong>GitHub Desktop</strong>,
              })}
            </p>
          </li>
        </ul>
      </div>
    )
  }
}
