'use strict'

const postcss = require('postcss')
const unique = require('array-unique')
const Color = require('color')

/**
 * @typedef Options
 * @property {boolean} withoutGrey
 * @property {boolean} withoutMonochrome
 * @property {boolean} allColors
 * @property {string|null} colorFormat
 */

/**
 * @typedef Data
 * @property {string} value
 * @property {Color} color
 */

function CssColorExtractor () {
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
    'text-shadow',
    'box-shadow',
    'fill',
    'stroke',
    'stop-color',
    'flood-color',
    'lighting-color'
  ]
  const colorFormats = [
    'hexString',
    'rgbString',
    'percentString',
    'hslString',
    'hwbString',
    'keyword',
  ]

  /**
   * @param {string} property
   * @returns {boolean}
   */
  function doesPropertyAllowColor (property) {
    return propertiesWithColors.indexOf(property) > -1
  }

  /**
   * @param {Color} color
   * @returns {boolean}
   */
  function isColorGrey (color) {
    const red = color.red()

    // we only need to test one color
    // since isColorMonochrome assures that all
    // three rgb colors are equal

    return isColorMonochrome(color) && red > 0 && red < 255
  }

  /**
   * @param {Color} color
   * @returns {boolean}
   */
  function isColorMonochrome (color) {
    const hsl = color.hsl().object()

    return hsl.h === 0 && hsl.s === 0
  }

  /**
   * @param {string} format
   * @returns {boolean}
   */
  function isValidColorFormat (format) {
    return colorFormats.indexOf(format) > -1
  }

  /**
   * @param {string} value the original string color value extracted from css
   * @param {Color} color
   * @param {Options} options
   * @returns {string}
   */
  function serializeColor (value, color, options) {
    if (options.colorFormat && isValidColorFormat(options.colorFormat)) {
      let colorFormat = options.colorFormat
      if (!color[options.colorFormat]) {
        colorFormat = colorFormat.replace(/String$/, '')
      }
      const formatted = color[colorFormat]()
      if (typeof formatted === 'string') {
        return formatted
      }
      return formatted.string()
    }
    return value
  }

  /**
   * @param {Partial<Options>} options
   * @returns {Options}
   */
  function defaultOptions (options) {
    return Object.assign({
      withoutGrey: false,
      withoutMonochrome: false,
      allColors: false,
      colorFormat: null,
    }, options)
  }

  /**
   * @param {Data[]} data
   * @param {Options} options
   * @returns {string[]}
   */
  function sortColors (data, options) {
    options = defaultOptions(options)
    const colors = data.map(({ value, color }) => serializeColor(value, color, options))
    return options.allColors ? colors : unique(colors)
  }

  /**
   * @param {string} string
   * @param {Options} options
   * @returns {Data[]}
   */
  function extractColorsFromString (string, options) {
    const colors = []
    let values = []

    const {
      withoutMonochrome,
      withoutGrey,
      colorFormat,
    } = defaultOptions(options)

    postcss.list.comma(string).forEach(function (items) {
      postcss.list.space(items).forEach(function (item) {
        const regex = new RegExp(
          '^' +
                    '(-webkit-|-moz-|-o-)?' +
                    '(repeating-)?' +
                    '(radial|linear)-gradient\\((.*?)\\)' +
                    '$'
        )

        const match = item.match(regex)

        if (match) {
          values = values.concat.apply(
            values,
            postcss.list.comma(match[4]).map(postcss.list.space)
          )
        } else {
          values.push(item)
        }
      })
    })

    values.forEach(function (value) {
      let color

      // check if it is a valid color
      try {
        color = new Color(value)
      } catch (e) {
        return
      }

      if (withoutMonochrome && isColorMonochrome(color)) {
        return
      }

      if (withoutGrey && isColorGrey(color)) {
        return
      }

      if (colorFormat === 'keyword') {
        // convert back to rgb to see if keyword is an exact match
        const keywordColor = new Color(color.keyword())
        if (keywordColor.rgbNumber() !== color.rgbNumber()) {
          return
        }
      }

      colors.push({ value, color })
    })

    return colors
  }

  /**
   * @param {postcss.Declaration} decl
   * @param {Options} options
   * @returns {Data[]}
   */
  function extractColorsFromDecl (decl, options) {
    if (!doesPropertyAllowColor(decl.prop)) {
      return []
    }

    return extractColorsFromString(decl.value, options)
  }

  /**
   * @param {string} css
   * @param {Options} options
   * @returns {Data[]}
   */
  function extractColorsFromCss (css, options) {
    let colors = []

    postcss.parse(css).walkDecls(function (decl) {
      colors = colors.concat(extractColorsFromDecl(decl, options))
    })

    return colors
  }

  this.fromDecl = (decl, options) => sortColors(extractColorsFromDecl(decl, options), options)
  this.fromCss = (css, options) => sortColors(extractColorsFromCss(css, options), options)
  this.fromString = (string, options) => sortColors(extractColorsFromString(string, options), options)
}

module.exports = new CssColorExtractor()
