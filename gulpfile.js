'use strict';

/* пути к исходным файлам (src), к готовым файлам (dist), а также к тем, за изменениями которых нужно наблюдать (watch) */
let path = {
    dist: {
        html: 'dist/',
        js: 'dist/js/',
        css: 'dist/css/',
        img: 'dist/img/',
        fonts: 'dist/fonts/'
    },
    src: {
        html: 'src/*.html',
        js: 'src/js/main.js',
        sass: 'src/sass/main.scss',
        img: 'src/img/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },
    watch: {
        html: 'src/**/*.html',
        js: 'src/js/**/*.js',
        sass: 'src/sass/**/*.scss',
        img: 'src/img/**/*.*',
        fonts: 'srs/fonts/**/*.*'
    },
    clean: './dist/*'
};

/* настройки сервера */
let config = {
    server: {
        baseDir: './dist'
    },
    notify: false
};

/* подключаем gulp и плагины */
let gulp = require('gulp'),  // подключаем Gulp
    webServer = require('browser-sync'), // сервер для работы и автоматического обновления страниц
    plumber = require('gulp-plumber'), // модуль для отслеживания ошибок
    rigger = require('gulp-rigger'), // модуль для импорта содержимого одного файла в другой
    sourcemaps = require('gulp-sourcemaps'), // модуль для генерации карты исходных файлов
    sass = require('gulp-sass'), // модуль для компиляции SASS (SCSS) в CSS
    autoPreFixer = require('gulp-autoprefixer'), // модуль для автоматической установки автопрефиксов
    cleanCSS = require('gulp-clean-css'), // плагин для минимизации CSS
    uglify = require('gulp-uglify'), // модуль для минимизации JavaScript
    cache = require('gulp-cache'), // модуль для кэширования
    imageMin = require('gulp-imagemin'), // плагин для сжатия PNG, JPEG, GIF и SVG изображений
    jpegCompress = require('imagemin-jpeg-recompress'), // плагин для сжатия jpeg
    pngCompress = require('imagemin-pngquant'), // плагин для сжатия png
    rimraf = require('gulp-rimraf'), // плагин для удаления файлов и каталогов
    rename = require('gulp-rename'); // плагин для переименования файлов и каталогов

/* задачи */

// запуск сервера
gulp.task('webServer', function () {
    webServer(config);
});

// сбор html
gulp.task('html:build', function () {
    return gulp.src(path.src.html) // выбор всех html файлов по указанному пути
        .pipe(plumber()) // отслеживание ошибок
        .pipe(rigger()) // импорт вложений
        .pipe(gulp.dest(path.dist.html)) // выкладывание готовых файлов
        .pipe(webServer.reload({ stream: true })); // перезагрузка сервера
});

// сбор SASS стилей
gulp.task('sass:build', function () {
    return gulp.src(path.src.sass) // получим main.scss
        .pipe(plumber()) // для отслеживания ошибок
        .pipe(sourcemaps.init()) // инициализируем sourcemap
        .pipe(sass()) // scss -> css
        .pipe(autoPreFixer({ // добавим префиксы
            overrideBrowserslist: ['last 2 versions']
        }))
        .pipe(gulp.dest(path.dist.css))
        .pipe(rename({ suffix: '.min' }))
        .pipe(cleanCSS()) // минимизируем CSS
        .pipe(sourcemaps.write('./')) // записываем sourcemap
        .pipe(gulp.dest(path.dist.css)) // выгружаем в dist
        .pipe(webServer.reload({ stream: true })); // перезагрузим сервер
});

// сбор js
gulp.task('js:build', function () {
    return gulp.src(path.src.js) // получим файл main.js
        .pipe(plumber()) // для отслеживания ошибок
        .pipe(rigger()) // импортируем все указанные файлы в main.js
        .pipe(gulp.dest(path.dist.js))
        .pipe(rename({ suffix: '.min' }))
        .pipe(sourcemaps.init()) //инициализируем sourcemap
        .pipe(uglify()) // минимизируем js
        .pipe(sourcemaps.write('./')) //  записываем sourcemap
        .pipe(gulp.dest(path.dist.js)) // положим готовый файл
        .pipe(webServer.reload({ stream: true })); // перезагрузим сервер
});

// перенос шрифтов
gulp.task('fonts:build', function () {
    return gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.dist.fonts));
});

// обработка картинок
gulp.task('image:build', function () {
    return gulp.src(path.src.img) // путь с исходниками картинок
        .pipe(cache(imageMin([ // сжатие изображений
            imageMin.gifsicle({ interlaced: true }),
            jpegCompress({
                progressive: true,
                max: 90,
                min: 80
            }),
            pngCompress(),
            imageMin.svgo({ plugins: [{ removeViewBox: false }] })
        ])))
        .pipe(gulp.dest(path.dist.img)); // выгрузка готовых файлов
});

// удаление каталога dist
gulp.task('clean:build', function () {
    return gulp.src(path.clean, { read: false })
        .pipe(rimraf());
});

// очистка кэша
gulp.task('cache:clear', function () {
    cache.clearAll();
});

// сборка
gulp.task('build',
    gulp.series('clean:build',
        gulp.parallel(
            'html:build',
            'sass:build',
            'js:build',
            'fonts:build',
            'image:build'
        )
    )
);

// запуск задач при изменении файлов
gulp.task('watch', function () {
    gulp.watch(path.watch.html, gulp.series('html:build'));
    gulp.watch(path.watch.sass, gulp.series('sass:build'));
    gulp.watch(path.watch.js, gulp.series('js:build'));
    gulp.watch(path.watch.img, gulp.series('image:build'));
    gulp.watch(path.watch.fonts, gulp.series('fonts:build'));
});

// задача по умолчанию
gulp.task('default', gulp.series(
    'build',
    gulp.parallel('webServer','watch')
));
