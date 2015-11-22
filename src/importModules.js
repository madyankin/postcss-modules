import atImport from 'postcss-import';

const importRegexp = /\:import\(['"](.*)['"]\)/;


function getImportedClasses(css) {
  const importedClasses = {};

  css.each(importRule => {
    if (!importRegexp.test(importRule.selector)) return;
    importRule.walkDecls(decl => importedClasses[decl.prop] = decl.value);
  });

  return importedClasses;
}


function selectClassesFromImportedCss(importedClasses) {
  const transformedClasses = Object.keys(importedClasses);
  const originalClasses = transformedClasses.map(key => importedClasses[key]);

  return importedCss => {
    importedCss.each(node => {
      const nodeSelector = node.selector.replace('.', '');
      const selectorIndex = originalClasses.indexOf(nodeSelector);

      if (selectorIndex > -1) {
        node.selector = `.${ transformedClasses[selectorIndex] }`;
      } else {
        node.remove();
      }
    });
  };
}


export default function importModule(css, result) {
  const importedClasses = getImportedClasses(css);

  css.each(importRule => {
    const match = importRegexp.exec(importRule.selector);

    if (!match) return;

    const moduleName = match[1];
    css.prepend({ name: 'import', params: `"${ moduleName }"` });

    importRule.remove();
  });

  // Replace @import directives with imported modules
  atImport({
    plugins: [
      // ...result.processor.plugins,
      selectClassesFromImportedCss(importedClasses),
    ],
  })(css, result);
}
