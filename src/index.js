import postcss    from 'postcss';
import Core       from 'css-modules-loader-core';
import stringHash from 'string-hash';
import imports    from './imports';


function generateShortScopedName(name, filename, css) {
  const i         = css.indexOf('.' + name);
  const numLines  = css.substr(0, i).split(/[\r\n]/).length;
  const hash      = stringHash(css).toString(36).substr(0, 5);

  return `_${ name }_${ hash }_${ numLines }`;
}

export default postcss.plugin('postcss-modules', (opts = {}) => {
  const scope = Core.scope;

  scope.generateScopedName = opts.generateScopedName || generateShortScopedName;

  const processor = postcss([
    // Core.values,
    Core.localByDefault,
    Core.extractImports,
    scope,
    imports,
  ]);

  return processor;
});
