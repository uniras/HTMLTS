const serverlib = require('./serverlib.js');
const WebRoot = './public';
serverlib.WebRoot = WebRoot;
serverlib.RenderExt = '';

// EJSで利用するモジュールの設定
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const babel = require('@babel/core');
const UglifyJS = require('uglify-js');
const less = require('less');
serverlib.Modules = { fs: fs, path: path, ejs: ejs, babel: babel, UglifyJS: UglifyJS, less: less};

const app = require('express')();

// .htmlをEJSでレンダーさせる設定
app.set('view engine', 'ejs');
app.engine('html',require('ejs').renderFile);
 
// expressでpostデータを受け取る3行のおまじない
const bodyparser = require('body-parser')
app.use(bodyparser.urlencoded({extended: true}))
app.use(bodyparser.json())
 
app.get( serverlib.getReg , ( request, response) => serverlib.SendFile(request, response) );
app.post( serverlib.postReg , ( request, response) => serverlib.SendFile(request, response) );
 
app.listen(3000);