import getExports from './getExports';


function getUniqueItem(value, index, self) {
  return self.indexOf(value) === index;
}


function getUsedClasses(css) {
  const exports = getExports(css);
  let classes = [];

  Object.keys(exports).forEach(exportedClass => {
    const classList = exports[exportedClass].split(' ');
    classes = [ ...classes, ...classList ];
  });

  return classes.filter(getUniqueItem);
}


function isGlobal(node) {
  const firstChild = node.nodes[0];
  if (!firstChild) return false;
  return firstChild.type === 'comment' && firstChild.text === 'global';
}


export default function cleanUnusedClasses(css) {
  const usedClasses = getUsedClasses(css);

  css.each(node => {
    if (node.selector.indexOf('.') !== 0) return;

    if (isGlobal(node)) {
      node.nodes[0].remove();
      return;
    }

    const nodeClass = node.selector.replace('.', '');
    let used = false;

    usedClasses.forEach(usedClass => {
      if (nodeClass.indexOf(usedClass) > -1) used = true;
    });

    if (!used) node.remove();
  });
}
