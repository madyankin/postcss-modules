import postcss from 'postcss';

function addGlobalComments(css) {
  css.each(node => {
    if (!node.selector) return;
    if (node.selector.indexOf(':global') === 0) {
      node.prepend({ text: 'global' });
    }
  });
}

export default postcss.plugin('postcss-modules:addGlobalComments', () => {
  return addGlobalComments;
});
