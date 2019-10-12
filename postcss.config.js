module.exports = {
  plugins: [
    require('postcss-preset-env')({
      stage: 3,
      browsers: ['IOS 9', 'android 4'],
      features: {
        autoprefixer: true,
        preserve: true,
        'nesting-rules': true
      }
    })
  ]
}
