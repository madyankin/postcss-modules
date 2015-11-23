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


export default function cleanUnusedClasses(css) {
  const classes = getUsedClasses(css);

  css.each(node => {
    const className = node.selector.replace('.', '');
    const isUnused  = classes.indexOf(className) === -1;
    if (isUnused) node.remove();
  });
}
