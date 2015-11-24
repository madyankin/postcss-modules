export default function addGlobalComments(css) {
  css.each(node => {
    if (node.selector.indexOf(':global') === 0) {
      node.prepend({ text: 'global' });
    }
  });
}
