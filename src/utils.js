import stringHash from 'string-hash';


export function getImports(css) {
  const imports = {};

  css.each(importRule => {
    if (importRule.selector.indexOf(':import') === -1) return;
    importRule.walkDecls(decl => imports[decl.prop] = decl.value);
  });

  return imports;
}


export default function getExports(css) {
  const exports = {};

  css.each(exportRule => {
    if (exportRule.selector !== ':export') return;
    exportRule.walkDecls(decl => exports[decl.prop] = decl.value);
  });

  return exports;
}


export function getNodeBySelector(css, selector) {
  let found = null;

  css.each(node => {
    if (node.selector === selector) found = node;
  });

  return found;
}


export function generateScopedName(name, filename, css) {
  const i         = css.indexOf('.' + name);
  const numLines  = css.substr(0, i).split(/[\r\n]/).length;
  const hash      = stringHash(css).toString(36).substr(0, 5);

  return `_${ name }_${ hash }_${ numLines }`;
}
