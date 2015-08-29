'use strict';

module.exports = new CssColorExtractor();

function CssColorExtractor() {
    var postcss = require('postcss');
    var cssColorList = require('css-color-list');
    var hexRegex = require('hex-color-regex');
    var rgbaRegex = require('rgba-regex');
    var rgbRegex = require('rgb-regex');
    var hslaRegex = require('hsla-regex');
    var hslRegex = require('hsl-regex');
    var util = require('util');
    var unique = require('array-unique');

    var greyRegex =
    '^(' +
    '#([a-fA-F0-9]{1,2})\\2\\2' + '|' +
    '(dim|dark|light)?gr[ae]y' + '|' +
    'rgb\\((\\d+),\\s*\\4,\\s*\\4\\)' + '|' +
    'rgba\\((\\d+),\\s*\\5,\\s*\\5,\\s*\\d*(?:\\.\\d+)?\\)' + '|' +
    'hsl\\(\\s*0\\s*,\\s*0(\\.[0]+)?%\\s*,\\s*\\d*(?:\\.\\d+)?%\\)' + '|' +
    'hsla\\(0,\\s*0(\\.[0]+)?%,\\s*\\d*(?:\\.\\d+)?%,\\s*\\d*(?:\\.\\d+)?\\)' +
    ')$';

    var blackOrWhiteRegex =
    '^(' +
    '#([fF]{3}([fF]{3})?|000|000000)' + '|' +
    'black' + '|' +
    'white' + '|' +
    'rgb\\((0|255),\\s*\\4,\\s*\\4\\)' + '|' +
    'rgba\\((0|255),\\s*\\5,\\s*\\5,\\s*\\d*(?:\\.\\d+)?\\)' + '|' +
    'hsl\\(\\s*0\\s*,\\s*0(\\.[0]+)?%\\s*,\\s*(0|100)(\\.[0]+)?%\\)' + '|' +
    'hsla\\(0,\\s*0(\\.[0]+)?%,\\s*(0|100)(\\.[0]+)?%,\\s*\\d*(?:\\.\\d+)?\\)' +
    ')$';

    function doesPropertyAllowColor(property) {
        var properties = [
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
            'box-shadow'
        ];

        return properties.indexOf(property) > -1;
    }

    function isColor(value) {
        var regex = new RegExp(
            '^(' +
            cssColorList().join('|') + '|' +
            rgbRegex().source + '|' +
            rgbaRegex().source + '|' +
            hslRegex().source + '|' +
            hslaRegex().source + '|' +
            hexRegex().source +
            ')$'
        );

        return regex.test(value);
    }

    function isColorBlackOrWhite(color) {
        return new RegExp(blackOrWhiteRegex).test(color);
    }

    function isColorGrey(color) {
        if (isColorBlackOrWhite(color)) {
            return false;
        }

        return new RegExp(greyRegex).test(color);
    }

    function isColorMonochrome(color) {
        return isColorBlackOrWhite(color) || isColorGrey(color);
    }

    function extractColors(string, options) {
        var colors = [];
        var values = [];

        options = util._extend({
            withoutGrey:       false,
            withoutMonochrome: false
        }, options);

        postcss.list.comma(string).forEach(function (items) {
            postcss.list.space(items).forEach(function (item) {
                var regex = new RegExp(
                    '^' +
                    '(-webkit-|-moz-|-o-)?' +
                    '(repeating-)?' +
                    '(radial|linear)-gradient\\((.*?)\\)' +
                    '$'
                );

                var match = item.match(regex);

                if (match) {
                    values = values.concat(postcss.list.comma(match[4]));
                } else {
                    values.push(item);
                }
            });
        });

        values.forEach(function (value) {
            if (!isColor(value)) {
                return;
            }

            if (options.withoutMonochrome && isColorMonochrome(value)) {
                return;
            }

            if (options.withoutGrey && isColorGrey(value)) {
                return;
            }

            colors.push(value);
        });

        return unique(colors);
    }

    function extractColorsFromDecl(decl, options) {
        if (!doesPropertyAllowColor(decl.prop)) {
            return [];
        }

        return extractColors(decl.value, options);
    }

    function extractColorsFromCss(css, options) {
        var colors = [];

        postcss.parse(css).walkDecls(function (decl) {
            colors = colors.concat(extractColorsFromDecl(decl, options));
        });

        return unique(colors);
    }

    this.fromDecl = extractColorsFromDecl;
    this.fromCss = extractColorsFromCss;
    this.fromString = extractColors;
}
