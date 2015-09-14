var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');

gulp.task('default', function() {
    var bundler = browserify('./app.js', {debug: true});
    bundler.plugin('minifyify', {map: null, output: '/dev/null'});
    bundler.bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./'));
});

gulp.task('watch', function(){
    gulp.watch(['./gulpfile.js', './app.js', './package.json', '!./bundle.js'], 'default');
});
