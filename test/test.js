import postcss from 'postcss';
import assert  from 'assert';
import fs      from 'fs';
import path    from 'path';
import plugin  from '../src';

const FIXTURES = './test/fixtures/';


function generateScopedName(name, filename, css) {
  const i         = css.indexOf('.' + name);
  const numLines  = css.substr(0, i).split(/[\r\n]/).length;
  const file      = path.basename(filename, '.css');

  return `_${ file }_${ numLines }_${ name }`;
}


describe('postcss-modules', () => {
  it('transforms css', () => {
    const fileName          = path.join(FIXTURES, 'in/styles.css');
    const fileNameExpected  = path.join(FIXTURES, 'out/styles.css');
    const css               = fs.readFileSync(fileName).toString();
    const cssExpected       = fs.readFileSync(fileNameExpected).toString();

    const processor = postcss([
      plugin({ generateScopedName }),
    ]);

    const result = processor.process(css, { from: fileName });

    assert.equal(result.css, cssExpected);
  });
});
