const path = require('path')
const gulp = require('gulp')
const gulpInstall = require('gulp-install')
const clean = require('gulp-clean')
const rename = require('gulp-rename')
const babel = require('gulp-babel')
const pug = require('gulp-pug')
const postcss = require('gulp-postcss')
const config = require('./config.js')
const _ = require('./utils.js')

function copyFiles(filepath) {
  _.logger.info(`Copy ${filepath}`)
  return gulp.src(filepath, {allowEmpty: true, base: config.srcPath})
      .pipe(gulp.dest(config.distPath))
}

function removeFiles(filepath) {
  const oExtname = path.extname(filepath)
  const nExtname = _.extnameMap[oExtname] || oExtname
  const targetFile = filepath.replace('src/', 'dist/').replace(oExtname, nExtname)
  _.logger.warn(`Remove ${targetFile}`)
  return gulp.src(targetFile, {read: false, allowEmpty: true, base: config.srcPath})
      .pipe(clean({force: true}))
}

function compileScript(filepath) {
  _.logger.info(`Compiling ${filepath}`)
  return gulp.src(filepath, {sourcemaps: true, allowEmpty: true, base: config.srcPath})
      .pipe(_.wrapStream(babel()))
      .pipe(gulp.dest(config.distPath, { sourcemaps: '.' }))
}

function compileTemplate(filepath) {
  _.logger.info(`Compiling ${filepath}`)
  return gulp.src(filepath, {allowEmpty: true, base: config.srcPath})
      .pipe(_.wrapStream(pug({pretty: true, inlineRuntimeFunctions: true})))
      .pipe(rename({ extname: '.wxml' }))
      .pipe(gulp.dest(config.distPath))
}

function compileStyle(filepath) {
  _.logger.info(`Compiling ${filepath}`)
  return gulp.src(filepath, {allowEmpty: true, base: config.srcPath})
    .pipe(_.wrapStream(postcss()))
    .pipe(rename({ extname: '.wxss' }))
    .pipe(gulp.dest(config.distPath))
}

/**
 * 安装 小程序的 npm 依赖
 */
async function install(done) {
  const {srcPath, distPath} = config
  const packageJsonPath = path.join(distPath, 'package.json')
  const packageJson = _.readJson(path.resolve('./package.json'))
  const dependencies = packageJson.dependencies || {}
  await _.writeFile(packageJsonPath, JSON.stringify({dependencies}, null, '\t'))
  gulp.src(packageJsonPath)
    .pipe(gulpInstall({production: true}))
    .on('end', () => {
      done()
      _.logger.info('install done')
    })
}

// 清空
const cleanGlob = ['!(./dist/package.json|./dist/node_modules||./dist/miniprogram_npm)']
gulp.task('clean', gulp.series(() => gulp.src(cleanGlob, {read: false, allowEmpty: true}).pipe(clean())))

// copy npm
gulp.task('install-npm', install)

// copy
const assetsGlob = ['./src/**/!(*.ts|*.js|*.css|*.pcss|*.pug|*.jade)']

gulp.task('copy-assets', done => {
  copyFiles(assetsGlob).on('end', () => done())
})

gulp.task('watch-assets', done => {
  const watcher = gulp.watch(assetsGlob)
  watcher.on('change', copyFiles)
  watcher.on('add', copyFiles)
  watcher.on('unlink', removeFiles)
  return done()
})

// scripts
const scriptGlob = ['./src/**/*.ts', './src/**/*.js']

gulp.task('compile-script', done => {
  compileScript(scriptGlob).on('end', () => done())
})

gulp.task('watch-script', done => {
  const watcher = gulp.watch(scriptGlob)
  watcher.on('change', compileScript)
  watcher.on('add', compileScript)
  watcher.on('unlink', removeFiles)
  return done()
})

// template
const templatreGlob = ['./src/**/*.pug', './src/**/*.jade']

gulp.task('compile-template', done => {
  compileTemplate(templatreGlob).on('end', () => done())
})

gulp.task('watch-template', done => {
  const watcher = gulp.watch(templatreGlob)
  watcher.on('change', compileTemplate)
  watcher.on('add', compileTemplate)
  watcher.on('unlink', removeFiles)
  return done()
})

// styles
const styleGlob = ['./src/**/*.css', './src/**/*.pcss']

gulp.task('compile-style', done => {
  compileStyle(styleGlob).on('end', () => done())
})

gulp.task('watch-style', done => {
  const watcher = gulp.watch(styleGlob)
  watcher.on('change', compileStyle)
  watcher.on('add', compileStyle)
  watcher.on('unlink', removeFiles)
  return done()
})

gulp.task('dev',
  gulp.series(
    'clean',
    'install-npm',
    gulp.parallel(
      gulp.series('copy-assets', 'watch-assets'),
      gulp.series('compile-script', 'watch-script'),
      gulp.series('compile-template', 'watch-template'),
      gulp.series('compile-style', 'watch-style')
    )
  )
)

gulp.task('build',
  gulp.series(
    'clean',
    'install-npm',
    gulp.parallel(
      'copy-assets',
      'compile-script',
      'compile-template',
      'compile-style'
    )
  )
)
