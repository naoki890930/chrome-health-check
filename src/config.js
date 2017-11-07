const path = require('path')

const url = 'https://www.google.co.jp/'
const captureSize = {width: 1280, height: 720}

const captureImageName = 'screenshot.png'
const expectImageName = 'expect.png'
const tarName = 'headless_shell.tar.gz'
const s3 = {
    bucket: 'chrome-health-check',
    readDir: 'data/',
    writeDir: 'data/',
}

const tmpPath = path.join(path.sep, 'tmp')
const execPath = path.join(tmpPath, 'headless_shell')
const captureImagePath = path.join(tmpPath, captureImageName)
const expectImagePath = path.join(expectImageName)
const tarPath = path.join(tarName)
const fontconfigPath = path.join('fontconfig')
const bucket = s3.bucket
const readKey = path.join(s3.readDir, tarName)
const writeKey = path.join(s3.writeDir, captureImageName)

module.exports = {
    url,
    captureSize,
    tmpPath,
    execPath,
    captureImagePath,
    expectImagePath,
    tarPath,
    fontconfigPath,
    bucket,
    readKey,
    writeKey,
}