import postcss from 'postcss';

function cleanImportAndExportRules(css) {
  css.each(node => {
    if (!node.selector) return;
    const isImport = node.selector.indexOf(':import') === 0;
    const isExport = node.selector.indexOf(':export') === 0;
    if (isImport || isExport) node.remove();
  });
}

export default postcss.plugin(
  'postcss-modules:cleanImportAndExportRules',
   () => {
     return cleanImportAndExportRules;
   }
);
