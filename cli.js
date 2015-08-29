#!/usr/bin/env node

var usage = 'Usage: css-color-extractor <inputFile> ' +
    '[-g|--without-grey] [-m|--without-monochrome]';

var argv = require('yargs')
    .usage(usage)
    .demand(1)
    .alias('g', 'without-grey')
    .alias('m', 'without-monochrome')
    .argv;

var inputFile = argv._[0];

var options = {
    withoutGrey: argv.g,
    withoutMonochrome: argv.m
};

var extractor = require('./');

var fs = require('fs');

fs.readFile(inputFile, 'utf8', function(err, data) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    var colors = extractor.fromCss(data);

    colors.forEach(function(color) {
        console.log(color);
    });
});
