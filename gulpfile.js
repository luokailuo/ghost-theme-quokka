const {series, watch, src, dest, parallel} = require('gulp');
const pump = require('pump');

// gulp 工具插件
var livereload = require('gulp-livereload');
var postcss = require('gulp-postcss');
var zip = require('gulp-zip');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var beeper = require('beeper');

// postcss 插件
var autoprefixer = require('autoprefixer');
var colorFunction = require('postcss-color-function');
var cssnano = require('cssnano');
var customProperties = require('postcss-custom-properties');
var easyimport = require('postcss-easy-import');

// 监听
function serve(done) {
    livereload.listen();
    done();
}
// 错误
const handleError = (done) => {
    return function (err) {
        if (err) {
            beeper();
        }
        return done(err);
    };
};
// 模板
function hbs(done) {
    pump([
        src(['*.hbs', 'partials/**/*.hbs', '!node_modules/**/*.hbs']),
        livereload()
    ], handleError(done));
}
// img
function img(done) {
    pump([
        src('res/img/*'),
        dest('assets/img/'),
    ], handleError(done));
}
// css
function css(done) {
    var processors = [
        easyimport,
        customProperties({preserve: false}),
        colorFunction(),
        autoprefixer({browsers: ['last 2 versions']}),
        // 压缩
        cssnano()
    ];

    pump([
        src('res/css/*.css'),
        postcss(processors),
        rename('all.min.css'),
        dest('assets/css/'),
        livereload()
    ], handleError(done));
}
// js
function js(done) {
    pump([
        src('res/js/*'),
        //压缩
        uglify(),
        dest('assets/js/'),
        livereload()
    ], handleError(done));
}

// fonts
function fonts(done) {
    pump([
        src('res/fonts/*'),
        dest('assets/fonts/')
    ], handleError(done));
}

function zipper(done) {
    var targetDir = 'dist/';
    var themeName = require('./package.json').name;
    var filename = themeName + '.zip';

    pump([
        src([
            '**',
            '!node_modules', '!node_modules/**',
            '!dist', '!dist/**'
        ]),
        zip(filename),
        dest(targetDir)
    ], handleError(done));
}

const cssWatcher = () => watch('res/css/**', css);
const hbsWatcher = () => watch(['*.hbs', 'partials/**/*.hbs', '!node_modules/**/*.hbs'], hbs);
const watcher = parallel(cssWatcher, hbsWatcher);
const build = series(css, js, img, fonts);
const dev = series(serve, watcher);

exports.build = build;
exports.zip = series(build, zipper);
exports.default = dev;
