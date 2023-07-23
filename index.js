'use strict';

const postcss = require('postcss');
const Color = require('color');

/**
 * @typedef Options
 * @property {boolean} withoutGrey
 * @property {boolean} withoutMonochrome
 * @property {boolean} allColors
 * @property {string|null} colorFormat
 * @property {"hue"|"frequency"|null} sort
 */

/**
 * @typedef {Record<string, string>} Variables
 */

/**
 * @typedef {Record<string, Variables>} SelectorVariables
 */

function CssColorExtractor() {
  const propertiesWithColors = [
    'color',
    'background',
    'background-color',
    'background-image',
    'border',
    'border-top',
    'border-right',
    'border-bottom',
    'border-left',
    'border-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'outline',
    'outline-color',
    'text-decoration',
    'text-decoration-color',
    'text-shadow',
    'box-shadow',
    'fill',
    'stroke',
    'stop-color',
    'flood-color',
    'lighting-color',
  ];
  const colorFormats = [
    'hexString',
    'hexaString',
    'rgbString',
    'percentString',
    'hslString',
    'hwbString',
    'keyword',
  ];

  /**
   * @param {string} property
   * @returns {boolean}
   */
  function doesPropertyAllowColor(property) {
    return propertiesWithColors.indexOf(property) > -1;
  }

  /**
   * @param {Color} color
   * @returns {boolean}
   */
  function isColorGrey(color) {
    const red = color.red();

    // we only need to test one color
    // since isColorMonochrome assures that all
    // three rgb colors are equal

    return isColorMonochrome(color) && red > 0 && red < 255;
  }

  /**
   * @param {Color} color
   * @returns {boolean}
   */
  function isColorMonochrome(color) {
    const hsl = color.hsl().object();

    return hsl.h === 0 && hsl.s === 0;
  }

  /**
   * @param {string} format
   * @returns {boolean}
   */
  function isValidColorFormat(format) {
    return colorFormats.indexOf(format) > -1;
  }

  /**
   * @param {string} value the original string color value extracted from css
   * @param {Options} options
   * @returns {string}
   */
  function serializeColor(value, options) {
    if (!options.colorFormat || !isValidColorFormat(options.colorFormat)) {
      return value;
    }
    const color = new Color(value);
    let colorFormat = options.colorFormat;
    if (!color[options.colorFormat]) {
      colorFormat = colorFormat.replace(/String$/, '');
    }
    const formatted = color[colorFormat]();
    if (typeof formatted === 'string') {
      return formatted;
    }
    return formatted.string();
  }

  /**
   * @param {Partial<Options>} options
   * @returns {Options}
   */
  function defaultOptions(options) {
    return Object.assign({
      withoutGrey: false,
      withoutMonochrome: false,
      allColors: false,
      colorFormat: null,
      sort: null,
    }, options);
  }

  /**
   * @param {string[]} colors
   * @param {Partial<Options>} sortOptions
   * @returns {string[]}
   */
  function sortColors(colors, sortOptions) {
    const options = defaultOptions(sortOptions);
    colors = colors.map((value) => serializeColor(value, options));
    if (options.sort === 'hue') {
      colors = colors.sort((a, b) => {
        return new Color(a).hue() - new Color(b).hue();
      });
    }
    if (options.sort === 'frequency') {
      const frequencyMap = new Map();
      colors.forEach((value) => {
        frequencyMap.set(value, (frequencyMap.get(value) || 0) + 1);
      });
      colors = colors.sort((a, b) => {
        return frequencyMap.get(b) - frequencyMap.get(a);
      });
    }
    return options.allColors ? colors : unique(colors);
  }

  /**
   * @param {string[]} items
   * @returns {string[]}
   */
  function unique(items) {
    return [...new Set(items)];
  }

  /**
   * @param {postcss.Root} root
   * @returns {SelectorVariables}
   */
  function extractVariables(root) {
    /** @type {SelectorVariables} */
    const selectorVariables = {};

    root.walkDecls(function(decl) {
      // @ts-ignore
      const selector = /** @type {string|undefined} */ (decl.parent?.selector);

      if (selector && decl.prop.startsWith('--')) {
        selectorVariables[selector] = {
          ...(selectorVariables[selector] || {}),
          [decl.prop]: decl.value,
        };
      }
    });

    return selectorVariables;
  }

  /**
   * @param {string} string
   * @param {Partial<Options>} options
   * @param {Variables|undefined} variables
   * @returns {string[]}
   */
  function extractColorsFromString(string, options, variables = undefined) {
    /** @type {string[]} */
    let colors = [];

    const {
      withoutMonochrome,
      withoutGrey,
      colorFormat,
    } = defaultOptions(options);

    postcss.list.comma(string).forEach(function(items) {
      postcss.list.space(items).forEach(function(item) {
        const regex = new RegExp(
          '^' +
                    '(-webkit-|-moz-|-o-)?' +
                    '(repeating-)?' +
                    '(radial|linear)-gradient\\((.*?)\\)' +
                    '$',
        );

        const match = item.match(regex);

        if (match) {
          colors = colors.concat.apply(
            colors,
            postcss.list.comma(match[4]).map(postcss.list.space),
          );
        } else {
          colors.push(item);
        }
      });
    });

    if (variables) {
      // use the variable's value if this color is a CSS variable
      colors = colors
        .map((value) => {
          const isVariable = value.match(/^var\((--.*?)\)$/);

          if (isVariable) {
            const variable = isVariable[1];

            if (variables[variable]) {
              return variables[variable];
            }
          }

          return value;
        });
    }

    return colors.filter((value) => {
      let color;

      // check if it is a valid color
      try {
        color = new Color(value);
      } catch (e) {
        return false;
      }

      if (withoutMonochrome && isColorMonochrome(color)) {
        return false;
      }

      if (withoutGrey && isColorGrey(color)) {
        return false;
      }

      if (colorFormat === 'keyword') {
        // convert back to rgb to see if keyword is an exact match
        const keywordColor = new Color(color.keyword());
        if (keywordColor.rgbNumber() !== color.rgbNumber()) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * @param {postcss.Declaration} decl
   * @param {Partial<Options>} options
   * @param {SelectorVariables|undefined} selectorVariables
   * @returns {string[]}
   */
  function extractColorsFromDecl(decl, options, selectorVariables = undefined) {
    if (!doesPropertyAllowColor(decl.prop)) {
      return [];
    }

    // @ts-ignore
    const selector = /** @type {string|undefined} */ (decl.parent?.selector);

    /** @type {Variables|undefined} */
    let variables;

    if (selectorVariables) {
      variables = {
        ...(selectorVariables[':root'] || {}),
        ...(selector && selectorVariables[selector] ? selectorVariables[selector] : {}),
      };
    }

    return extractColorsFromString(
      decl.value,
      options,
      variables,
    );
  }

  /**
   * @param {string} css
   * @param {Partial<Options>} options
   * @returns {string[]}
   */
  function extractColorsFromCss(css, options) {
    let colors = [];

    const root = postcss.parse(css);

    const selectorVariables = extractVariables(root);

    root.walkDecls(function(decl) {
      colors = colors.concat(extractColorsFromDecl(decl, options, selectorVariables));
    });

    return colors;
  }

  this.extractVariables = extractVariables;

  /** @type {(decl: postcss.Declaration, options: Partial<Options>, selectorVariables?: SelectorVariables) => string[]} */
  this.fromDecl = (decl, options, selectorVariables) => sortColors(extractColorsFromDecl(decl, options, selectorVariables), options);

  /** @type {(css: string, options: Partial<Options>) => string[]} */
  this.fromCss = (css, options) => sortColors(extractColorsFromCss(css, options), options);

  /** @type {(string: string, options: Partial<Options>, variables?: Variables) => string[]} */
  this.fromString = (string, options, variables) => sortColors(extractColorsFromString(string, options, variables), options);
}

module.exports = new CssColorExtractor();
