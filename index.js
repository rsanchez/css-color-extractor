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
   * @param {string} string
   * @param {Partial<Options>} options
   * @returns {string[]}
   */
  function extractColorsFromString(string, options) {
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
   * @returns {string[]}
   */
  function extractColorsFromDecl(decl, options) {
    if (!doesPropertyAllowColor(decl.prop)) {
      return [];
    }

    return extractColorsFromString(decl.value, options);
  }

  /**
   * @param {string} css
   * @param {Partial<Options>} options
   * @returns {string[]}
   */
  function extractColorsFromCss(css, options) {
    let colors = [];

    postcss.parse(css).walkDecls(function(decl) {
      colors = colors.concat(extractColorsFromDecl(decl, options));
    });

    return colors;
  }

  /** @type {(decl: postcss.Declaration, options: Partial<Options>) => string[]} */
  this.fromDecl = (decl, options) => sortColors(extractColorsFromDecl(decl, options), options);

  /** @type {(css: string, options: Partial<Options>) => string[]} */
  this.fromCss = (css, options) => sortColors(extractColorsFromCss(css, options), options);

  /** @type {(string: string, options: Partial<Options>) => string[]} */
  this.fromString = (string, options) => sortColors(extractColorsFromString(string, options), options);
}

module.exports = new CssColorExtractor();
