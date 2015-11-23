import atImport                          from 'postcss-import';
import plugins                           from './plugins';
import { getImports, getNodeBySelector } from './utils';

export const importRegexp = /\:import\(['"](.*)['"]\)/;


function selectClassesFromImportedCss(importedClasses) {
  const transformedClasses = Object.keys(importedClasses);
  const originalClasses = transformedClasses.map(key => importedClasses[key]);

  return importedCss => {
    importedCss.each(node => {
      if (node.selector !== ':export') return;

      node.walkDecls(decl => {
        if (originalClasses.indexOf(decl.prop) > -1) return;

        const rule = getNodeBySelector(importedCss, `.${ decl.value }`);
        if (rule) rule.remove();
      });
    });
  };
}


export default function importModule(css, result) {
  const imports = getImports(css);

  css.each(importRule => {
    const match = importRegexp.exec(importRule.selector);

    if (!match) return;

    const moduleName = match[1];
    css.prepend({ name: 'import', params: `"${ moduleName }"` });
  });

  // Replace @import directives with imported modules
  atImport({
    plugins: [
      ...plugins,
      selectClassesFromImportedCss(imports),
    ],
  })(css, result);
}
