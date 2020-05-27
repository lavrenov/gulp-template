'use strict';

let path = {
    // paths to final files (dist)
    dist: {
        html: 'dist/',
        js: 'dist/js/',
        css: 'dist/css/',
        img: 'dist/img/',
        fonts: 'dist/fonts/'
    },

    // paths to source files (src)
    src: {
        html: 'src/*.html',
        js: 'src/js/main.js',
        sass: 'src/sass/main.scss',
        img: 'src/img/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },

    // paths to files whose changes you need to watch (watch)
    watch: {
        html: 'src/**/*.html',
        js: 'src/js/**/*.js',
        sass: 'src/sass/**/*.scss',
        img: 'src/img/**/*.*',
        fonts: 'srs/fonts/**/*.*'
    },

    // paths to clean (dist)
    clean: './dist/*'
};

// gulp and plugins
let gulp = require('gulp'),
    mode = require('gulp-mode')({
        modes: ["production", "development"],
        default: "development",
        verbose: false
    }),
    webServer = require('browser-sync').create(),
    plumber = require('gulp-plumber'),
    rigger = require('gulp-rigger'),
    sourcemaps = require('gulp-sourcemaps'),
    sass = require('gulp-sass'),
    autoPreFixer = require('gulp-autoprefixer'),
    cleanCSS = require('gulp-clean-css'),
    uglify = require('gulp-uglify'),
    cache = require('gulp-cache'),
    imageMin = require('gulp-imagemin'),
    jpegCompress = require('imagemin-jpeg-recompress'),
    pngCompress = require('imagemin-pngquant'),
    rimraf = require('gulp-rimraf');

// Tasks

// html build
gulp.task('html:build', function () {
    return gulp.src(path.src.html)
        .pipe(plumber())
        .pipe(rigger())
        .pipe(gulp.dest(path.dist.html));
});

// sass build
gulp.task('sass:build', function () {
    const isDevelopment = mode.development();
    let options = {}
    if(isDevelopment) {
        options = {
            format: 'beautify',
            level: 0
        }
    }
    return gulp.src(path.src.sass)
        .pipe(plumber())
        .pipe(mode.development(sourcemaps.init()))
        .pipe(sass())
        .pipe(autoPreFixer({
            overrideBrowserslist: ['last 2 versions']
        }))
        .pipe(cleanCSS(options))
        .pipe(mode.development(sourcemaps.write('./')))
        .pipe(gulp.dest(path.dist.css));
});

// js build
gulp.task('js:build', function () {
    return gulp.src(path.src.js)
        .pipe(plumber())
        .pipe(rigger())
        .pipe(mode.development(sourcemaps.init()))
        .pipe(mode.production(uglify()))
        .pipe(mode.development(sourcemaps.write('./')))
        .pipe(gulp.dest(path.dist.js));
});

// fonts build
gulp.task('fonts:build', function () {
    return gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.dist.fonts));
});

// images build
gulp.task('image:build', function () {
    return gulp.src(path.src.img)
        .pipe(mode.production(cache(imageMin([
            imageMin.gifsicle({ interlaced: true }),
            jpegCompress({
                progressive: true,
                max: 90,
                min: 80
            }),
            pngCompress(),
            imageMin.svgo({ plugins: [{ removeViewBox: false }] })
        ]))))
        .pipe(gulp.dest(path.dist.img));
});

// clean dist folder
gulp.task('clean:dist', function () {
    return gulp.src(path.clean, { read: false })
        .pipe(rimraf());
});

// clear cache
gulp.task('cache:clear', function () {
    cache.clearAll();
});

// build all
gulp.task('build',
    gulp.series('clean:dist',
        gulp.parallel(
            'html:build',
            'sass:build',
            'js:build',
            'fonts:build',
            'image:build'
        )
    )
);

// watch
gulp.task('watch', function () {
    webServer.init({
        server: './dist',
        notify: true,
        open: true,
        cors: true,
    });

    gulp.watch(path.watch.html, gulp.series('html:build')).on('change', webServer.reload);
    gulp.watch(path.watch.sass, gulp.series('sass:build')).on('change', webServer.reload);
    gulp.watch(path.watch.js, gulp.series('js:build')).on('change', webServer.reload);
    gulp.watch(path.watch.img, gulp.series('image:build'));
    gulp.watch(path.watch.fonts, gulp.series('fonts:build'));
});

// default
gulp.task('default', gulp.series('build', 'watch'));
