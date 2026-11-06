import * as React from 'react'
import { t } from '../../lib/localization'
import { formatTranslationParts } from '../../lib/localization/parts'

/** Translate a whole sentence while retaining links, controls, and emphasis. */
export function translateUIRich(
  key: string,
  values: Readonly<Record<string, React.ReactNode>>
): React.ReactNode {
  return formatTranslationParts(t(key), values).map((part, index) => (
    <React.Fragment key={index}>{part}</React.Fragment>
  ))
}
