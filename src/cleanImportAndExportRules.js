export default function cleanImportAndExportRules(css) {
  css.each(node => {
    const isImport = node.selector.indexOf(':import') === 0;
    const isExport = node.selector.indexOf(':export') === 0;
    if (isImport || isExport) node.remove();
  });
}
