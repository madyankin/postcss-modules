import postcss from 'postcss';

module.exports = postcss.plugin('test-plugin', () => { // eslint-disable-line
  return async (root) => {
    root.walkRules((rule) => {
      rule.walkDecls(/^overflow-?/, (decl) => {
        if (decl.value === 'scroll') {
          const hasTouch = rule.some(i => i.prop === '-webkit-overflow-scrolling');
          if (!hasTouch) {
            rule.append({
              prop: '-webkit-overflow-scrolling',
              value: 'touch',
            });
          }
        }
        decl.value = '666'; // eslint-disable-line
      });
    });
  };
});
