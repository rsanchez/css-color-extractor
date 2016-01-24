var expect  = require('chai').expect;

var extractor = require('../');

var test = function (input, output, opts, done) {
    var result = extractor.fromCss(input, opts);
    expect(result).to.eql(output);
    done();
};

describe('postcss-colors-only', function () {

    it('should extract named color.', function (done) {
        test(
            'a { color: red; } p { display: block; }',
            ['red'],
            {},
            done
        );
    });

    it('should extract three-letter hex color.', function (done) {
        test(
            'a { color: #123; } p { display: block; }',
            ['#123'],
            {},
            done
        );
    });

    it('should extract six-letter hex color.', function (done) {
        test(
            'a { color: #123123; } p { display: block; }',
            ['#123123'],
            {},
            done
        );
    });

    it('should extract rgb color.', function (done) {
        test(
            'a { color: rgb(1, 2, 3); } p { display: block; }',
            ['rgb(1, 2, 3)'],
            {},
            done
        );
    });

    it('should extract rgba color.', function (done) {
        test(
            'a { color: rgba(1, 2, 3, 0.5); } p { display: block; }',
            ['rgba(1, 2, 3, 0.5)'],
            {},
            done
        );
    });

    it('should extract hsl color.', function (done) {
        test(
            'a { color: hsl(1, 2%, 3%); } p { display: block; }',
            ['hsl(1, 2%, 3%)'],
            {},
            done
        );
    });

    it('should extract hsla color.', function (done) {
        test(
            'a { color: hsla(1, 2%, 3%, 0.5); } p { display: block; }',
            ['hsla(1, 2%, 3%, 0.5)'],
            {},
            done
        );
    });

    it('should extract background-color.', function (done) {
        test(
            'a { background-color: red; } p { display: block; }',
            ['red'],
            {},
            done
        );
    });

    it('should extract border-color.', function (done) {
        test(
            'a { border-color: red; } p { display: block; }',
            ['red'],
            {},
            done
        );
    });

    it('should extract border-top-color.', function (done) {
        test(
            'a { border-top-color: red; } p { display: block; }',
            ['red'],
            {},
            done
        );
    });

    it('should extract border-right-color.', function (done) {
        test(
            'a { border-right-color: red; } p { display: block; }',
            ['red'],
            {},
            done
        );
    });

    it('should extract border-bottom-color.', function (done) {
        test(
            'a { border-bottom-color: red; } p { display: block; }',
            ['red'],
            {},
            done
        );
    });

    it('should extract border-left-color.', function (done) {
        test(
            'a { border-left-color: red; } p { display: block; }',
            ['red'],
            {},
            done
        );
    });

    it('should extract background-image.', function (done) {
        test(
            'a { background-image: linear-gradient(to bottom, red, blue); } ' +
                'p { display: block; }',
            ['red', 'blue'],
            {},
            done
        );
    });

    it('should extract outline-color.', function (done) {
        test(
            'a { outline-color: red; } p { display: block; }',
            ['red'],
            {},
            done
        );
    });

    it('should extract text-shadow.', function (done) {
        test(
            'a { text-shadow: 1px 1px 2px black; } p { display: block; }',
            ['black'],
            {},
            done
        );
    });

    it('should extract box-shadow.', function (done) {
        test(
            'a { box-shadow: 10px 5px 5px black; } p { display: block; }',
            ['black'],
            {},
            done
        );
    });

    it('should extract complex background.', function (done) {
        test(
            'a { background: red url(../foo.jpg) no-repeat center center; } ' +
                'p { display: block; }',
            ['red'],
            {},
            done
        );
    });

    it('should extract rule with multiple colors.', function (done) {
        test(
            'a { background: red url(../foo.jpg), blue url(../bar.jpg); } ' +
                'p { display: block; }',
            ['red', 'blue'],
            {},
            done
        );
    });

    it('should extract outline.', function (done) {
        test(
            'a { outline: 1px solid white; } p { display: block; }',
            ['white'],
            {},
            done
        );
    });

    it('should extract border.', function (done) {
        test(
            'a { border: 1px solid white; } p { display: block; }',
            ['white'],
            {},
            done
        );
    });

    it('should extract border-top.', function (done) {
        test(
            'a { border-top: 1px solid white; } p { display: block; }',
            ['white'],
            {},
            done
        );
    });

    it('should extract border-right.', function (done) {
        test(
            'a { border-right: 1px solid white; } p { display: block; }',
            ['white'],
            {},
            done
        );
    });

    it('should extract border-bottom.', function (done) {
        test(
            'a { border-bottom: 1px solid white; } p { display: block; }',
            ['white'],
            {},
            done
        );
    });

    it('should extract border-left.', function (done) {
        test(
            'a { border-left: 1px solid white; } p { display: block; }',
            ['white'],
            {},
            done
        );
    });

    it('should omit grey, but not black or white.', function (done) {
        test(
            'a { color: red; } p { color: grey; } h1 { color: black; }',
            ['red', 'black'],
            { withoutGrey: true },
            done
        );
    });

    it('should omit grey', function (done) {
        test(
            'a { color: red; } p { color: grey; }',
            ['red'],
            { withoutGrey: true },
            done
        );
    });

    it('should omit gray', function (done) {
        test(
            'a { color: red; } p { color: gray; }',
            ['red'],
            { withoutGrey: true },
            done
        );
    });

    it('should omit lightgrey', function (done) {
        test(
            'a { color: red; } p { color: lightgrey; }',
            ['red'],
            { withoutGrey: true },
            done
        );
    });

    it('should omit lightgray', function (done) {
        test(
            'a { color: red; } p { color: lightgray; }',
            ['red'],
            { withoutGrey: true },
            done
        );
    });

    it('should omit dimgrey', function (done) {
        test(
            'a { color: red; } p { color: dimgrey; }',
            ['red'],
            { withoutGrey: true },
            done
        );
    });

    it('should omit dimgray', function (done) {
        test(
            'a { color: red; } p { color: dimgray; }',
            ['red'],
            { withoutGrey: true },
            done
        );
    });

    it('should omit darkgrey', function (done) {
        test(
            'a { color: red; } p { color: darkgrey; }',
            ['red'],
            { withoutGrey: true },
            done
        );
    });

    it('should omit darkgray', function (done) {
        test(
            'a { color: red; } p { color: darkgray; }',
            ['red'],
            { withoutGrey: true },
            done
        );
    });

    it('should omit three-letter hex grey', function (done) {
        test(
            'a { color: red; } p { color: #111; }',
            ['red'],
            { withoutGrey: true },
            done
        );
    });

    it('should omit six-letter hex grey', function (done) {
        test(
            'a { color: red; } p { color: #121212; border-color: #111111; }',
            ['red'],
            { withoutGrey: true },
            done
        );
    });

    it('should omit rgb grey', function (done) {
        test(
            'a { color: red; } p { color: rgb(1, 1, 1); }',
            ['red'],
            { withoutGrey: true },
            done
        );
    });

    it('should omit rgba grey', function (done) {
        test(
            'a { color: red; } p { color: rgba(1, 1, 1, 0.5); }',
            ['red'],
            { withoutGrey: true },
            done
        );
    });

    it('should omit hsl grey', function (done) {
        test(
            'a { color: red; } p { color: hsl(0, 0, 1%); }',
            ['red'],
            { withoutGrey: true },
            done
        );
    });

    it('should omit hsla grey', function (done) {
        test(
            'a { color: red; } p { color: hsla(0, 0, 1%, 0.5); }',
            ['red'],
            { withoutGrey: true },
            done
        );
    });

    it('should omit grey', function (done) {
        test(
            'a { color: red; } p { color: grey; }',
            ['red'],
            { withoutMonochrome: true },
            done
        );
    });

    it('should omit white', function (done) {
        test(
            'a { color: red; } p { color: white; }',
            ['red'],
            { withoutMonochrome: true },
            done
        );
    });

    it('should omit three-letter hex white', function (done) {
        test(
            'a { color: red; } p { color: #fFf; }',
            ['red'],
            { withoutMonochrome: true },
            done
        );
    });

    it('should omit six-letter hex white', function (done) {
        test(
            'a { color: red; } p { color: #fFfFfF; }',
            ['red'],
            { withoutMonochrome: true },
            done
        );
    });

    it('should omit rgb white', function (done) {
        test(
            'a { color: red; } p { color: rgba(255, 255, 255); }',
            ['red'],
            { withoutMonochrome: true },
            done
        );
    });

    it('should omit rgba white', function (done) {
        test(
            'a { color: red; } p { color: rgba(255, 255, 255, 0.5); }',
            ['red'],
            { withoutMonochrome: true },
            done
        );
    });

    it('should omit hsl white', function (done) {
        test(
            'a { color: red; } p { color: hsl(0, 0, 100%); }',
            ['red'],
            { withoutMonochrome: true },
            done
        );
    });

    it('should omit hsla white', function (done) {
        test(
            'a { color: red; } p { color: hsla(0, 0, 100%, 0.5); }',
            ['red'],
            { withoutMonochrome: true },
            done
        );
    });

    it('should omit black', function (done) {
        test(
            'a { color: red; } p { color: black; }',
            ['red'],
            { withoutMonochrome: true },
            done
        );
    });

    it('should omit three-letter hex black', function (done) {
        test(
            'a { color: red; } p { color: #000; }',
            ['red'],
            { withoutMonochrome: true },
            done
        );
    });

    it('should omit six-letter hex black', function (done) {
        test(
            'a { color: red; } p { color: #000000; }',
            ['red'],
            { withoutMonochrome: true },
            done
        );
    });

    it('should omit rgb black', function (done) {
        test(
            'a { color: red; } p { color: rgba(0, 0, 0); }',
            ['red'],
            { withoutMonochrome: true },
            done
        );
    });

    it('should omit rgba black', function (done) {
        test(
            'a { color: red; } p { color: rgba(0, 0, 0, 0.5); }',
            ['red'],
            { withoutMonochrome: true },
            done
        );
    });

    it('should omit hsl black', function (done) {
        test(
            'a { color: red; } p { color: hsl(0, 0, 0%); }',
            ['red'],
            { withoutMonochrome: true },
            done
        );
    });

    it('should omit hsla black', function (done) {
        test(
            'a { color: red; } p { color: hsla(0, 0, 0%, 0.5); }',
            ['red'],
            { withoutMonochrome: true },
            done
        );
    });

    it('should read nested @media rules', function (done) {
        test(
            'a { color: red; } @media (screen-only) { a { color: blue; } ' +
                'p { display: block; } }',
            ['red', 'blue'],
            {},
            done
        );
    });

    it('should output rgbString format', function (done) {
        test(
            'a { color: #123123; }',
            ['rgb(18, 49, 35)'],
            { colorFormat: 'rgbString' },
            done
        );
    });

    it('should output hslString format', function (done) {
        test(
            'a { color: #123123; }',
            ['hsl(153, 46%, 13%)'],
            { colorFormat: 'hslString' },
            done
        );
    });

    it('should output percentString format', function (done) {
        test(
            'a { color: #123123; }',
            ['rgb(7%, 19%, 14%)'],
            { colorFormat: 'percentString' },
            done
        );
    });

    it('should output hexString format', function (done) {
        test(
            'a { color: rgb(255, 255, 255); }',
            ['#FFFFFF'],
            { colorFormat: 'hexString' },
            done
        );
    });

    it('should output keyword format', function (done) {
        test(
            'a { color: rgb(255, 255, 255); }',
            ['white'],
            { colorFormat: 'keyword' },
            done
        );
    });
});
