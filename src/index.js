const fs = require('fs')
const exec = require('child_process').exec
const tar = require('tar')
const puppeteer = require('puppeteer')
const imageDiff = require('image-diff')
const aws = require('aws-sdk')
const s3 = new aws.S3({apiVersion: '2006-03-01'})

const config = require('./config')

exports.handler = async (event, context, callback) => {
    try {
        await setupChrome()
        await setFontconfig()
        await capture()
        // await upload()
        await compare()
        callback(null, 'Success')
    } catch (err) {
        callback(err, null)
    }
}

function setupChrome() {
    return new Promise((resolve, reject) => {
        if (existsFile(config.execPath)) {
            return resolve()
        }

        // fs.createReadStream(config.tarPath)
        s3.getObject({Bucket: config.bucket, Key: config.readKey}).createReadStream()
            .on('error', (err) => reject(err))
            .pipe(tar.x({C: config.tmpPath}))
            .on('error', (err) => reject(err))
            .on('end', () => resolve())
    })
}

function existsFile(path) {
    try {
        fs.statSync(path)
        return true
    } catch(err) {
        return false
    }
}

function setFontconfig() {
    return new Promise((resolve, reject) => {
        process.env.HOME = process.env.LAMBDA_TASK_ROOT
        const command = `fc-cache -v ${process.env.HOME}.fonts`
        exec(command, (error, stdout, stderr) => {
            if (error) {
                return reject(error)
            }
            resolve()
        })
    })
}

async function capture() {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: config.execPath,
        args: [
            '--no-sandbox',
            '--disable-gpu',
            '--single-process',
        ],
    })
    const page = await browser.newPage()
    await page.setViewport(config.captureSize)
    await page.goto(config.url)
    await page.screenshot({path: config.captureImagePath})
    await browser.close()
}

function upload() {
    return new Promise((resolve, reject) => {
        s3.upload({
            Bucket: config.bucket,
            Key: config.writeKey,
            Body: fs.createReadStream(config.captureImagePath)
        }, (err) => {
            if (err) reject(err)
            resolve()
        })
    })
}

function compare() {
    return new Promise((resolve, reject) => {
        const option = {
            actualImage: config.captureImagePath,
            expectedImage: config.expectImagePath,
        }
        imageDiff.getFullResult(option, (err, result) => {
            if (err) {
                reject(err)
            } else if (result.percentage > 0.01) {
                reject(`Error image-diff: difference is over 1%`)
            } else {
                resolve()
            }
        })
    })
}
