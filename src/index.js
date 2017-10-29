const fs = require('fs')
const path = require('path')
const tar = require('tar')
const puppeteer = require('puppeteer')
const aws = require('aws-sdk')
const s3 = new aws.S3({apiVersion: '2006-03-01'})

const tmpPath = '/tmp'
const execPath = tmpPath + '/headless_shell'
const imageName = 'screenshot.png'
const imagePath = tmpPath + '/' + imageName
const tarPath = path.join('HeadlessChrome-63.0.3213.0.tar.gz')
const url = 'https://www.google.co.jp/'
const bucket = 'chrome-health-check'
const key = imageName

exports.handler = (event, context, callback) => {
    setupChrome()
    .then(() => checkFile())
    .then(() => capture())
    .then(() => upload())
    .then(() => callback(null, 'Success'))
    .catch(err => callback(err, null))
};

function setupChrome() {
    return new Promise((resolve, reject) => {
        if (isFileExisting(execPath)) {
            resolve()
            return
        }

        fs.createReadStream(tarPath)
        .on('error', (err) => reject(err))
        .pipe(tar.x({C: tmpPath}))
        .on('error', (err) => reject(err))
        .on('end', () => resolve());
    });
}

function isFileExisting(path) {
    try {
        fs.statSync(path);
        return true
    } catch(err) {
        return false
    }
}

function checkFile() {
    return new Promise((resolve, reject) => {
        try {
            var list = fs.readdirSync(tmpPath)
            for (var i = 0; i < list.length; i++) {
                var stats = fs.statSync(path.join(tmpPath, list[i]))
                if (stats.isFile()) {
                    console.log(list[i])
                }
            }
            console.log('no file')
            resolve()
        }
        catch (err) {
            console.error(err)
            reject(err)
        }
    })
}

async function capture() {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: execPath,
        args: ['--disable-gpu'],
    })
    const page = await browser.newPage()
    await page.goto(url)
    await page.screenshot({path: imagePath})
    await browser.close()
}

function upload() {
    return new Promise((resolve, reject) => {
        s3.upload({
            Bucket: bucket,
            Key: key,
            Body: fs.createReadStream(imagePath)
        }, (err) => {
            if (err) reject(err)
            resolve()
        })
    })
}