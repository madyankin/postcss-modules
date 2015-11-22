import postcss                from 'postcss';
import Core                   from 'css-modules-loader-core';
import importModules          from './importModules';
import applyMixins            from './applyMixins';
import { generateScopedName } from './utils';


export default postcss.plugin('postcss-modules', (opts = {}) => {
  const scope = Core.scope;

  scope.generateScopedName = opts.generateScopedName || generateScopedName;

  const processor = postcss([
    // Core.values,
    Core.localByDefault,
    Core.extractImports,
    scope,
    importModules,
    applyMixins,
  ]);

  return processor;
});
