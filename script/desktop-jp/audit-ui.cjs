// Run after installing repository dependencies:
// node script/desktop-jp/audit-ui.cjs > remaining-ui.json
// This is a candidate inventory, not a translation-coverage percentage.
const ts = require('typescript')
const fs = require('fs')
const path = require('path')
const root = path.resolve(__dirname, '../..')
const candidates = []
const attributes = new Set([
  'title', 'label', 'ariaLabel', 'placeholder', 'tooltip', 'okButtonText',
  'cancelButtonText', 'buttonText', 'headerText', 'description',
])
function visitFile(file) {
  const source = ts.createSourceFile(
    file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  )
  function visit(node) {
    let value
    let kind
    if (ts.isJsxText(node)) {
      value = node.text.replace(/\s+/g, ' ').trim()
      kind = 'jsx-text'
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (ts.isJsxAttribute(node.parent) && attributes.has(node.parent.name.text)) {
        value = node.text
        kind = 'jsx-attribute'
      } else if (ts.isVariableDeclaration(node.parent) &&
        /(title|label|message|description|text)$/i.test(node.parent.name.getText(source))) {
        value = node.text
        kind = 'display-variable'
      }
    }
    if (value && /[A-Za-z]{2}/.test(value) && !/[\u3040-\u9fff]/.test(value)) {
      candidates.push({
        file: path.relative(root, file).replace(/\\/g, '/'),
        line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
        kind, value,
      })
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
}
function walk(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name)
    if (item.isDirectory()) walk(file)
    else if (/\.tsx?$/.test(file)) visitFile(file)
  }
}
walk(path.join(root, 'app/src/ui'))
process.stdout.write(JSON.stringify(candidates, null, 2) + '\n')
