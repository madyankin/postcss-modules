import postcss  from 'postcss';
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


function insertImportedContent(css, result) {
  css.each(importRule => {
    const match = importRegexp.exec(importRule.selector);

    if (!match) return;

    const moduleName = match[1];
    css.prepend({ name: 'import', params: `"${ moduleName }"` });

    importRule.remove();
  });

  // Replace @import directives with imported modules
  atImport({
    // plugins: result.processor.plugins,
  })(css, result);
}


function getRulesMap(css, importedClasses) {
  const rulesMap = {};

  css.each(exportRule => {
    if (exportRule.selector !== ':export') return;

    exportRule.walkDecls(decl => {
      const classNames      = postcss.list.space(decl.value)
      const currentSelector = classNames[0];

      const importedSelectors = classNames
        .filter(className => Boolean(importedClasses[className]))
        .map(className => importedClasses[className]);

      rulesMap[currentSelector] = importedSelectors;
      decl.value                = currentSelector;
    });
  });

  Object.keys(rulesMap).forEach(selector => {
    if (rulesMap[selector].length) return;
    delete rulesMap[selector];
  })

  return rulesMap;
}


function getNodeBySelector(css, selector) {
  let found = null;

  css.each(node => {
    if (node.selector === selector) found = node;
  });

  return found;
}


function applyImportedRules(css, rulesMap) {
  Object.keys(rulesMap).forEach(selector => {
    const rule = getNodeBySelector(css, `.${ selector }`);

    rulesMap[selector].forEach(selector => {
      const mixin = getNodeBySelector(css, `.${ selector }`);

      if (!mixin) return;

      mixin.walkDecls(decl => rule.prepend(decl));
      mixin.remove();
    })
  });
}


function processCss(css, result) {
  const importedClasses = getImportedClasses(css);
  insertImportedContent(css, result);
  const rulesMap = getRulesMap(css, importedClasses);
  applyImportedRules(css, rulesMap);
  // console.log('/*==========================================*/');
  console.log(css.toString());
}


const plugin = postcss.plugin('postcss-modules:imports', () => processCss);
export default plugin;
