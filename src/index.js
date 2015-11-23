import postcss                   from 'postcss';
import Core                      from 'css-modules-loader-core';
import generateScopedName        from './generateScopedName';
import plugins                   from './plugins';
import cleanImportAndExportRules from './cleanImportAndExportRules';
import cleanUnusedClasses        from './cleanUnusedClasses';

export default postcss.plugin('postcss-modules', (opts = {}) => {
  const scope = Core.scope;
  scope.generateScopedName = opts.generateScopedName || generateScopedName;

  return postcss([
    ...plugins,
    cleanUnusedClasses,
    cleanImportAndExportRules,
  ]);
});
