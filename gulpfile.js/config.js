const path = require('path')

const isDev = process.argv.indexOf('--develop') >= 0
const isWatch = process.argv.indexOf('--watch') >= 0
const srcPath = path.resolve(__dirname, '../src')
const distPath = path.resolve(__dirname, '../dist')

module.exports = {
  isDev,
  isWatch,
  srcPath, // 源目录
  distPath, // 目标目录
}
