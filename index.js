'use strict'

const postcss = require('postcss')
const unique = require('array-unique')
const Color = require('color')

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

  function doesPropertyAllowColor (property) {
    return propertiesWithColors.indexOf(property) > -1
  }

  function isColorGrey (color) {
    const red = color.red()

    // we only need to test one color
    // since isColorMonochrome assures that all
    // three rgb colors are equal

    return isColorMonochrome(color) && red > 0 && red < 255
  }

  function isColorMonochrome (color) {
    const hsl = color.hsl().object()

    return hsl.h === 0 && hsl.s === 0
  }

  function isValidColorFormat (format) {
    return colorFormats.indexOf(format) > -1
  }

  function serializeColor (value, color, options) {
    if (options && isValidColorFormat(options.colorFormat)) {
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

  function defaultOptions (options) {
    return Object.assign({
      withoutGrey: false,
      withoutMonochrome: false,
      allColors: false,
      colorFormat: null
    }, options)
  }

  function sortColors (data, options) {
    const colors = data.map(({ value, color }) => serializeColor(value, color, options))
    const { allColors } = defaultOptions(options)
    return allColors ? colors : unique(colors)
  }

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

  function extractColorsFromDecl (decl, options) {
    if (!doesPropertyAllowColor(decl.prop)) {
      return []
    }

    return extractColorsFromString(decl.value, options)
  }

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
