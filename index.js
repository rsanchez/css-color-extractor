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

  function extractColors (string, options) {
    const colors = []
    let values = []

    options = Object.assign({
      withoutGrey: false,
      withoutMonochrome: false,
      allColors: false,
      colorFormat: null
    }, options)

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

      if (options.withoutMonochrome && isColorMonochrome(color)) {
        return
      }

      if (options.withoutGrey && isColorGrey(color)) {
        return
      }

      if (options.colorFormat === 'keyword') {
        value = color.keyword()
        // convert back to rgb to see if keyword is an exact match
        const keywordColor = new Color(value)
        if (keywordColor.rgbNumber() !== color.rgbNumber()) {
          return
        }
      } else if (isValidColorFormat(options.colorFormat)) {
        let colorFormat = options.colorFormat
        if (!color[options.colorFormat]) {
          colorFormat = colorFormat.replace(/String$/, '')
        }
        value = color[colorFormat]()
        if (typeof value !== 'string') {
          value = value.string()
        }
      }

      if (value) {
        colors.push(value)
      }
    })

    return options.allColors ? colors : unique(colors)
  }

  function extractColorsFromDecl (decl, options) {
    if (!doesPropertyAllowColor(decl.prop)) {
      return []
    }

    return extractColors(decl.value, options)
  }

  function extractColorsFromCss (css, options) {
    let colors = []

    postcss.parse(css).walkDecls(function (decl) {
      colors = colors.concat(extractColorsFromDecl(decl, options))
    })

    if (options && options.allColors) {
      return colors
    }

    return unique(colors)
  }

  this.fromDecl = extractColorsFromDecl
  this.fromCss = extractColorsFromCss
  this.fromString = extractColors
}

module.exports = new CssColorExtractor()
