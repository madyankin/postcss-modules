# postcss-modules [![Build Status][ci-img]][ci]

A [PostCSS] plugin to use [CSS Modules] everywhere. Not only at the client side.

[PostCSS]:      https://github.com/postcss/postcss
[ci-img]:       https://travis-ci.org/outpunk/postcss-modules.svg
[ci]:           https://travis-ci.org/outpunk/postcss-modules
[CSS Modules]:  https://github.com/css-modules/css-modules

<a href="https://evilmartians.com/?utm_source=postcss-modules">
<img src="https://evilmartians.com/badges/sponsored-by-evil-martians.svg" alt="Sponsored by Evil Martians" width="236" height="54">
</a>

What is this? For example, you have the following CSS:

```css

/* styles.css */
:global .page {
    padding: 20px;
}

.title {
    composes: title from "./mixins.css";
    color: green;
}

.article {
    font-size: 16px;
}

/* mixins.css */
.title {
    color: black;
    font-size: 40px;
}

.title:hover {
    color: red;
}

```
After the transformation it will become like this:

```css
._title_116zl_1 {
    color: black;
    font-size: 40px;
}

._title_116zl_1:hover {
    color: red;
}

.page {
    padding: 20px;
}

._title_xkpkl_5 {
    color: green;
}

._article_xkpkl_10 {
    font-size: 16px;
}
```

And the plugin will give you a JSON object for transformed classes:
```json
{
  "title": "_title_xkpkl_5 _title_116zl_1",
  "article": "_article_xkpkl_10",
}
```


## Usage

You have a freedom to make everything you want with exported classes, just
use the `getJSON` callback. For example, save data about classes into a corresponding JSON file:

```js
postcss([
  require('postcss-modules')({
    getJSON: function(cssFileName, json) {
      var path          = require('path');
      var cssName       = path.basename(cssFileName, '.css');
      var jsonFileName  = path.resolve('./build' + cssName + '.json');
      fs.writeFileSync(jsonFileName, JSON.stringify(json));
    }
  });
]);
```

Generate custom classes with the `generateScopedName` callback:

```js
postcss([
  require('postcss-modules')({
    getJSON: function(cssFileName, json) {},
    generateScopedName: function(name, filename, css) {
      var path      = require('path');
      var i         = css.indexOf('.' + name);
      var numLines  = css.substr(0, i).split(/[\r\n]/).length;
      var file      = path.basename(filename, '.css');

      return '_' + file + '_' + numLines + '_' + name;
    }
  });
]);
```

See [PostCSS] docs for examples for your environment and don't forget to run
```
npm install --save-dev postcss-modules
```
