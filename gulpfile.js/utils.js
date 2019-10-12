const fs = require('fs')
const path = require('path')
const log = require('fancy-log')
const colors = require('ansi-colors')

const logger = {
  out(msg) {
    log.info(msg)
  },
  info(msg) {
    log.info(colors.green(msg))
  },
  error(msg) {
    log.info(colors.red(msg))
  },
  warn(msg) {
    log.info(colors.yellow(msg))
  }
}

/**
 * 异步函数封装
 */
function wrap(func, scope) {
  return function (...args) {
    if (args.length) {
      const temp = args.pop()
      if (typeof temp !== 'function') {
        args.push(temp)
      }
    }

    return new Promise(function (resolve, reject) {
      args.push(function (err, data) {
        if (err) reject(err)
        else resolve(data)
      })

      func.apply((scope || null), args)
    })
  }
}

const accessSync = wrap(fs.access)
const statSync = wrap(fs.stat)
const renameSync = wrap(fs.rename)
const mkdirSync = wrap(fs.mkdir)
const readFileSync = wrap(fs.readFile)
const writeFileSync = wrap(fs.writeFile)

/**
 * 检查文件是否存在
 */
async function checkFileExists(filePath) {
  try {
    await accessSync(filePath)
    return true
  } catch (err) {
    return false
  }
}

/**
 * 递归创建目录
 */
async function recursiveMkdir(dirPath) {
  const prevDirPath = path.dirname(dirPath)
  try {
    await accessSync(prevDirPath)
  } catch (err) {
    // 上一级目录不存在
    await recursiveMkdir(prevDirPath)
  }

  try {
    await accessSync(dirPath)

    const stat = await statSync(dirPath)
    if (stat && !stat.isDirectory()) {
      // 目标路径存在，但不是目录
      await renameSync(dirPath, `${dirPath}.bak`) // 将此文件重命名为 .bak 后缀
      await mkdirSync(dirPath)
    }
  } catch (err) {
    // 目标路径不存在
    await mkdirSync(dirPath)
  }
}

/**
 * 读取 json
 */
function readJson(filePath) {
  try {
    // eslint-disable-next-line import/no-dynamic-require
    const content = require(filePath)
    delete require.cache[require.resolve(filePath)]
    return content
  } catch (err) {
    logger.warn(err)
    return null
  }
}

/**
 * 读取文件
 */
async function readFile(filePath) {
  try {
    return await readFileSync(filePath, 'utf8')
  } catch (err) {
    // eslint-disable-next-line no-console
    return logger.error(err)
  }
}

/**
 * 写文件
 */
async function writeFile(filePath, data) {
  try {
    await recursiveMkdir(path.dirname(filePath))
    return await writeFileSync(filePath, data, 'utf8')
  } catch (err) {
    // eslint-disable-next-line no-console
    return logger.error(err)
  }
}

// Wrap a stream in an error-handler (needed until Gulp 4).
function wrapStream(stream) {
  stream.on('error', function(error) {
    logger.out(error.message)
    logger.error(error.stack);
    stream.end()
  })
  return stream;
}

/**
 * 获取 id
 */
let seed = +new Date()
function getId() {
  return ++seed
}

const extnameMap = {
  '.jade': '.wxml',
  '.pug': '.wxml',
  '.ts': '.js',
  '.pcss': '.wxss',
  '.css': '.wxss'
}

module.exports = {
  wrap,

  checkFileExists,
  readJson,
  readFile,
  writeFile,

  wrapStream,
  logger,
  getId,

  extnameMap
}
