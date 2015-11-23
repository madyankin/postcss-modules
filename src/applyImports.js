function getImports(css) {
  const imports = {};

  css.each(importRule => {
    if (importRule.selector.indexOf(':import') === -1) return;
    importRule.walkDecls(decl => imports[decl.prop] = decl.value);
  });

  return imports;
}


function connectExportsWithImports(css) {
  css.each(importRule => {
    if (importRule.selector.indexOf(':import') === -1) return;

    const exportRule = importRule.prev();
    if (!exportRule || !exportRule.selector === ':export') return;

    const exports = {};
    exportRule.walkDecls(decl => exports[decl.prop] = decl.value);

    importRule.walkDecls(decl => {
      Object.keys(exports).forEach(key => {
        if (decl.value === key) decl.value = exports[key];
      });
    });
  });
}


export default function applyImports(css) {
  connectExportsWithImports(css);

  const imports         = getImports(css);
  const importedClasses = Object.keys(imports);

  css.each(exportRule => {
    if (exportRule.selector !== ':export') return;

    exportRule.walkDecls(decl => {
      const exportedClasses = decl.value.split(' ');

      importedClasses.forEach(importedClass => {
        const index = exportedClasses.indexOf(importedClass);

        if (index > -1) {
          exportedClasses[index] = imports[importedClass];
          decl.value = exportedClasses.join(' ');
        }
      });
    });
  });
}
