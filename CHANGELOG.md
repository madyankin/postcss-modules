# Changelog

## 8.3.0

### Added

- New `localsConvention` value `'all'` — emit the original class name plus the camelCase and dashes-camelCase variants in one pass.
- New `localsConvention` value `'none'` — emit only the original class name, with no additional aliases.
- The function form of `localsConvention` may now return an array of strings. Every entry in the array is added to the locals map and resolves to the same value, which makes it easy to expose a single CSS class under multiple JS-friendly aliases.

Adapted from the unmerged work in [#154](https://github.com/madyankin/postcss-modules/pull/154) by @CarbonORM.

## 8.1.0

### Internal

- Replaced Babel with swc across the entire toolchain: `@swc/cli` compiles `src/` to `build/`, `@swc/jest` transforms test files, and ESLint now uses its default `espree` parser. Removed five `@babel/*` devDependencies and the unused `@babel/register` runtime hook. The published `build/*.js` keeps the same `module.exports = (opts) => ...; module.exports.postcss = true` shape, so existing CommonJS consumers are unaffected.
- Pinned transitive `file-type` to v22 via `overrides` to silence `@swc/cli`'s vulnerable dependency chain.

## 8.0.0

### Breaking

- Dropped support for Node.js 18. The minimum supported Node.js version is now 20.

### Updated

- All `devDependencies` bumped to latest: `@babel/*` 7 → 8, `eslint` 7 → 9 (now uses flat `eslint.config.mjs`), `eslint-plugin-jest` 23 → 29, `prettier` 2 → 3, `husky` 4 → 9, `lint-staged` 10 → 17, `autoprefixer` to 10.5, `postcss` to 8.5
- Bumped `postcss-modules-local-by-default` to 4.2 and `postcss-modules-scope` to 3.2.1
- Pinned transitive `glob` to v12 via `overrides`

### Internal

- Reformatted source with Prettier 3 (whitespace only)
- Bumped Babel compile target from Node 10 to Node 18

## 7.0.0

### Breaking

- Dropped support for Node.js 10, 12, 14, and 15. The minimum supported Node.js version is now 18.

### Security

- Patched 14 Dependabot security alerts in transitive dependencies (`form-data`, `lodash`, `@babel/core`, `@babel/plugin-transform-modules-systemjs`, `uuid`, `picomatch`, `flatted`, `minimatch`, `qs`, `js-yaml`, `nanoid`)
- Bumped `jest` from 26 to 30 to drop vulnerable `node-notifier`, `sane`, and `jsdom` chains

### Internal

- Regenerated Jest snapshots for the new `pretty-format` serializer (cosmetic only; emitted CSS and JSON are unchanged)

## 6.0.1

- Updated dependencies by Bill Collins (@mrginglymus)

## 6.0.0

### Breaking

The `resolve` option has two parameters now and can return `null`. Thanks to Rene Haas (@KingSora)
https://github.com/madyankin/postcss-modules/commit/86d8135cb5014d0b2848ef395608ee74d82bd179

Parameters:

- `file` — a module we want to resolve
- `importer` — the file that imports the module we want to resolve

Return value: `string | null | Promise<string | null>`

```js
postcss([
	require("postcss-modules")({
    	resolve: function (file, importer) {
			return path.resolve(
				path.dirname(importer),
				file.replace(/^@/, process.cwd()
			);
    	},
  	}),
]);
```

### Fixed

- #140 "'Failed to obtain root' error on Windows" fixed by Pierre LeMoine (@DrInfiniteExplorer) https://github.com/madyankin/postcss-modules/pull/144

### Improved

- `icss-replace-symbols` replaced with with `icss-utils` by Jason Quense (@jquense). The updated replacer works better and will replace values in selectors, which didn't work until now. https://github.com/madyankin/postcss-modules/pull/145

## 5.0.0

- Fixed `composes` on Windows by @sapphi-red https://github.com/madyankin/postcss-modules/pull/135
- Updated Babel to v7 by @sapphi-red. Minimal supported version of Node.js is 10 from now https://github.com/madyankin/postcss-modules/pull/134

## 4.3.1

- Fixed errors when using shorthand selectors by Felix Bruns (@fxb) https://github.com/madyankin/postcss-modules/pull/130

## 4.3.0

- Updated the `generic-names` dependency to reduce packages size by Bogdan Chadkin (@TrySound) https://github.com/madyankin/postcss-modules/pull/129

## 4.2.2

- Fix the build

## 4.2.1

- Fixed the `resolve` option behaviour by @kamilic https://github.com/madyankin/postcss-modules/pull/127

## 4.2.0

- Added the `resolve` option to configure lookup paths for composes/from by @kamilic https://github.com/madyankin/postcss-modules/pull/126

## 4.1.3

- Fixed package contents

## 4.1.1

- Fixed TypeScript typings by Shuman Lim (@origin-master) https://github.com/madyankin/postcss-modules/pull/124

## 4.1.0

- Added TypeScript typings by Shuman Lim (@origin-master) https://github.com/madyankin/postcss-modules/pull/123

## 4.0.0

- Upgraded to PostCSS 8 by Evan You (@yyx990803) https://github.com/css-modules/postcss-modules/pull/114

## 3.2.2

### Fixed

- Fixed user plugins order by Tom Jenkinson (@tjenkinson) https://github.com/css-modules/postcss-modules/pull/112

## 3.2.1

### Fixed

- Fixed an issue when some plugins were running multiple times by Tom Jenkinson (@tjenkinson) https://github.com/css-modules/postcss-modules/pull/111

## 3.2.0

### Changed

- [`localsConvention` option] now supports a custom function `(originalClassName: string, generatedClassName: string, inputFile: string) => className: string` by Gregory Waxman (@Akkuma) https://github.com/css-modules/postcss-modules/pull/109

## 3.1.0

### Added

- Added `exportGlobals` option

## 3.0.0

### Changed

- Dropped `css-modules-loader-core` dependency
- [Upgraded all the dependencies](https://github.com/css-modules/postcss-modules/pull/108)

### Breaking changes

- Dropped support for unsupported Node versions. Supported versions are 10, 12 and 14+ https://nodejs.org/en/about/releases/

## 2.0.0

### Added

- [`localsConvention` option](https://github.com/css-modules/postcss-modules#localsconvention) by Hamza Mihai Daniel (@allocenx) <https://github.com/css-modules/postcss-modules/pull/103>, <https://github.com/css-modules/postcss-modules/issues/93>

### Breaking changes

- `camelCase` camelCase removed, use the [`localsConvention` option](https://github.com/css-modules/postcss-modules#localsconvention) instead.

## 1.5.0

- Added `hashPrefix` option by Jesse Thomson (@jessethomson) <https://github.com/css-modules/postcss-modules/pull/98>

## 1.4.1

- Rebublished the previous release. Sorry :(

## 1.4.0

- Added export for other plugins by Evilebot Tnawi (@evilebottnawi) <https://github.com/css-modules/postcss-modules/pull/88>, <https://github.com/css-modules/postcss-modules/issues/29>

## 1.3.1

- Move dev tools to devDependecies by Anton Khlynovskiy (@ubzey) <https://github.com/css-modules/postcss-modules/pull/85>

## 1.3.0

- Updated dependecies
- Added prettier to format code

## 1.2.0

- Added option to transform classes to camelCase by Igor Ribeiro (@igor-ribeiro) <https://github.com/css-modules/postcss-modules/pull/82>

## 1.1.0

- Added ability to transmit outputFileName into getJSON by @lutien <https://github.com/css-modules/postcss-modules/pull/72>

## 1.0.0

- Dropped support for Node < 6
- Updated dependencies

## 0.8.0

- Updated PostCSS to 6 by Alexey Litvinov (@sullenor) <https://github.com/css-modules/postcss-modules/pull/65>

## 0.7.1

- Allowed empty string as opts.root by Sharon Rolel (@Mosho1) <https://github.com/css-modules/postcss-modules/pull/56>

## 0.7.0

- Allow async getJSON by Philipp A. (@flying-sheep) <https://github.com/css-modules/postcss-modules/pull/59>

## 0.6.4

- Added the `root` option to pass the root path by Sharon Rolel (@Mosho1) (<https://github.com/css-modules/postcss-modules/pull/55>)

## 0.6.3

- Fixed regression in `isValidBehaviour` function (<https://github.com/css-modules/postcss-modules/issues/53>)

## 0.6.2

- Refactored `getDefaultPluginsList` function

## 0.6.1

- Fixed `generateScopedName` bug with multiple postcss-modules instances (<https://github.com/css-modules/postcss-modules/issues/37>)

## 0.6.0

- Added `globalModulePaths` option (Thanks to @pospi).
- Refactored all the things.

## 0.5.2

- Updated dependencies

## 0.5.1

- Fixed sorting for composed dependencies by Josh Johnston (@joshwnj) (<https://github.com/css-modules/postcss-modules/issues/38>)

## 0.5.0

- Added `scopeBehaviour` option (<https://github.com/css-modules/postcss-modules/issues/22>)
- Added ability to pass a string to `generateScopedName` (<https://github.com/css-modules/postcss-modules/issues/21>)
- Updated dependencies

## 0.4.1

- Fixed processing errors capturing by Boris Serdiuk (@just-boris)

## 0.4.0

- Added support for custom loaders by Björn Brauer (@ZauberNerd)

## 0.3.0

- Fixed processing for imported CSS
- Added default callback for saving exported JSON

## 0.2.0

- Fixed JSON export with shallow imports (<https://github.com/outpunk/postcss-modules/issues/12>)
- Fixed lookup paths (<https://github.com/outpunk/postcss-modules/issues/13>)
- Fixed imports overriding (<https://github.com/outpunk/postcss-modules/issues/15>)
- Global refactoring under the hood

## 0.1.3

Fixed failing on comments by @dfreeman (<https://github.com/outpunk/postcss-modules/pull/14>)

## 0.1.2

Fixed module export for ES5 (<https://github.com/outpunk/postcss-modules/issues/9>)

## 0.1.1

Call getExports only for top level css

## 0.1.0

Initial version
