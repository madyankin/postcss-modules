import postcss from 'postcss';
import assert  from 'assert';
import fs      from 'fs';
import path    from 'path';
import plugin  from '../src';

const FIXTURES = './test/fixtures/';

describe('postcss-modules', () => {
  it('transforms css', () => {
    const fileName          = path.join(FIXTURES, 'styles.css');
    const fileNameExpected  = path.join(FIXTURES, 'styles.expected.css');
    const css               = fs.readFileSync(fileName).toString();
    const cssExpected       = fs.readFileSync(fileNameExpected).toString();

    const result   = postcss([plugin()]).process(css, { from: fileName });

    assert.equal(result.css, cssExpected);
  });
});
