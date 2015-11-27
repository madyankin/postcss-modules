import postcss  from 'postcss';
import atImport from 'postcss-import';

const importRegexp = /\:import\(['"](.*)['"]\)/;

function importModule(css, result) {
  css.each(importRule => {
    const match = importRegexp.exec(importRule.selector);

    if (!match) return;

    const moduleName = match[1];
    css.prepend({ name: 'import', params: `"${ moduleName }"` });
  });


  const plugins = result.processor.plugins.filter(plugin => {
    return [
      'postcss-modules:cleanUnusedClasses',
      'postcss-modules:cleanImportAndExportRules',
      'postcss-modules:getExports',
      'postcss-modules',
    ].indexOf(plugin.postcssPlugin) === -1;
  });

  // Replace @import directives with imported modules
  atImport({ plugins })(css, result);
}


export default postcss.plugin('postcss-modules:importModule', () => {
  return importModule;
});
