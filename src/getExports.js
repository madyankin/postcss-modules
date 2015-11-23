export default function getExports(css) {
  const exportRules = [];
  const exports     = {};

  css.each(exportRule => {
    if (exportRule.selector === ':export') exportRules.push(exportRule);
  });

  const lastExport = exportRules.pop();
  if (lastExport) lastExport.walkDecls(decl => exports[decl.prop] = decl.value);

  return exports;
}
