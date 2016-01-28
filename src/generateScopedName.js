import stringHash from 'string-hash';

export default function generateScopedName(name, filename, css) {
  const i         = css.indexOf(`.${ name }`);
  const numLines  = css.substr(0, i).split(/[\r\n]/).length;
  const hash      = stringHash(css).toString(36).substr(0, 5);

  return `_${ name }_${ hash }_${ numLines }`;
}
