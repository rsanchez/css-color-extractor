# CSS Color Extractor [![Build Status][ci-img]][ci]

Extract colors (named, hex, rgb, rgba, hsl, and hsla) from CSS.

This tool is useful if you are re-skinning a site with a new color scheme and need a starting point for a new stylesheet.

[ci-img]:  https://travis-ci.org/rsanchez/css-color-extractor.svg
[ci]:      https://travis-ci.org/rsanchez/css-color-extractor

```css
.foo {
  color: red;
  border: 1px solid #ab560f;
  font-size: 16px;
  background-image: linear-gradient(to-bottom, red, blue);
}

.bar {
  color: rgba(0, 128, 255, 0.5);
}

.baz {
  display: block;
}
```

```
red
#ab560f
blue
rgba(0, 128, 255, 0.5)
```

This module looks at the following CSS properties for colors:

* `color`
* `background`
* `background-color`
* `background-image`
* `border`
* `border-top`
* `border-right`
* `border-bottom`
* `border-left`
* `border-color`
* `border-top-color`
* `border-right-color`
* `border-bottom-color`
* `border-left-color`
* `outline`
* `outline-color`
* `text-shadow`
* `box-shadow`

## Installation

[![NPM version](https://badge.fury.io/js/css-color-extractor.svg)](https://www.npmjs.org/package/css-color-extractor)

[Use npm](https://www.npmjs.org/doc/cli/npm-install.html).

```
npm install css-color-extractor
```

## Usage

```javascript
var extractor = require('css-color-extractor');

var options = {
  withoutGrey: false, // set to true to remove rules that only have grey colors
  withoutMonochrome: false, // set to true to remove rules that only have grey, black, or white colors
};

// extract from a full stylesheet
extractor.fromCss('a { color: red; } p { color: blue; }');
// => ['red', 'blue']

// extract from a string
extractor.fromString('1px solid blue');
// => ['blue']

// extract from a declaration
extractor.fromDecl({ prop: 'color', value: '1px solid blue' });
// => ['blue']
```

## CLI

Install globally:

```
npm install -g css-color-extractor
```

Then:

```
css-color-extractor input.css
```

Use the `--without-grey` or `--without-monochrome` flag(s):

```
css-color-extractor input.css --without-grey
```

## License

Copyright (c) 2015 [Rob Sanchez](https://github.com/rsanchez)

Licensed under [the MIT License](./LICENSE).
