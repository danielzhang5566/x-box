// 打包生成zip供上传Chrome Web Store
const JSZip = require('jszip')
const fs = require('fs')

let zip = new JSZip()

// 有点笨，每个要打包压缩的文件都要写出来。。。
zip.file('x-box/manifest.json', fs.readFileSync('./manifest.json')) // 注意路径是相对于package.json的./

zip.file('x-box/popup.html', fs.readFileSync('./popup.html'))

zip.folder('x-box/img').file('icon16.png', fs.readFileSync('./img/icon16.png'))
zip.folder('x-box/img').file('icon48.png', fs.readFileSync('./img/icon48.png'))
zip.folder('x-box/img').file('icon128.png', fs.readFileSync('./img/icon128.png'))
zip.folder('x-box/img').file('question.png', fs.readFileSync('./img/question.png'))
zip.folder('x-box/img').file('dollar.png', fs.readFileSync('./img/dollar.png'))
zip.folder('x-box/img').file('rmb.png', fs.readFileSync('./img/rmb.png'))
zip.folder('x-box/img').file('smile.png', fs.readFileSync('./img/smile.png'))

zip.folder('x-box/css').file('popup.css', fs.readFileSync('./css/popup.css'))

zip.folder('x-box/js').file('insert_script_cart.js', fs.readFileSync('./js/insert_script_cart.js'))
zip.folder('x-box/js').file('insert_script_meal.js', fs.readFileSync('./js/insert_script_meal.js'))
zip.folder('x-box/js').file('popup.js', fs.readFileSync('./js/popup.js'))


zip
    .generateNodeStream({type: 'nodebuffer', streamFiles: true})
    .pipe(fs.createWriteStream('x-box.zip'))
    .on('finish', function () {
        console.log("Finished: x-box.zip written.");
    });