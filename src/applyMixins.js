import postcss               from 'postcss';
import { getNodeBySelector } from './utils';


function getSelectorsMap(css) {
  // Format: { className: [/* list of mixins */] }
  const rulesMap = {};

  css.each(exportRule => {
    if (exportRule.selector !== ':export') return;

    exportRule.walkDecls(decl => {
      const classNames      = postcss.list.space(decl.value);
      const currentSelector = classNames[0];

      const importedSelectors = classNames
        .filter(className => className !== currentSelector);

      if (!importedSelectors.length) return;

      rulesMap[currentSelector] = importedSelectors;
      decl.value                = currentSelector;
    });
  });

  return rulesMap;
}


export default function applyMixins(css) {
  const selectorsMap = getSelectorsMap(css);

  Object.keys(selectorsMap).forEach(selector => {
    const rule = getNodeBySelector(css, `.${ selector }`);

    selectorsMap[selector].forEach(mixinSelector => {
      const mixin = getNodeBySelector(css, `.${ mixinSelector }`);

      if (!mixin) return;

      mixin.walkDecls(decl => rule.prepend(decl));
      mixin.remove();
    });
  });

  // console.log('/*==========================================*/');
  // console.log('/* ' + css.source.input.file + ' */');
  // console.log(css.toString());
}
