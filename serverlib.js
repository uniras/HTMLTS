const url = require('url');
const path = require('path');
const fs = require('fs');

(() => {

    let WebRoot = '';
    let RenderExt = '';
    let Modules = {};

    const funcs = {
        indexServe: (request, response) =>  // /でアクセスした場合index.htmlを表示
            render(request, response, 'index.html'),

        defaultServe: (request, response) => // ファイルをそのまま表示
            FileSend(fileExist(request), response),

        renderHtml: (request, response) =>  // .html
            render(request, response),
    };
    // 許可する静的ファイルの拡張子
    const AllowExtents = ['.js', '.css', '.jpg', '.png', '.gif', '.mp3', '.ogg', '.avi', '.mov', '.mpeg4', '.flv'];

    // 動的な処理をするファイルの拡張子と処理内容
    const fileExtentsFunc = {
        '/': funcs.indexServe,
        '.html': funcs.renderHtml,
        '.ejs': funcs.renderHtml,
    };
    // パスをテストするための正規表現を作成 post用
    const postReg = createReg(fileExtentsFunc);

    // fileExtentsFuncにAllowExtentsを統合
    AllowExtents.forEach(e => fileExtentsFunc[e] = funcs.defaultServe);

    // パスをテストするための正規表現を作成 get用
    const getReg = createReg(fileExtentsFunc);

    function createReg(obj) {
        return new RegExp('(' +
            Object.keys(obj)         // キーを配列に変換
                .sort((a, b) => b.length - a.length) // キーを文字数が多い順にソート
                .map(e => e.replace(/\./g, '\\.'))  // . を \\.に置換
                .join('|') +        // | を区切りとして一つの文字列へ
            ')$');
    }

    const FileSendeOpt = {
        dotfiles: 'deny'
    };

    // 静的ファイルの送信
    function FileSend(filename, response) {

        if (filename === null) resError(response, 404);
        else {
            response.sendFile(path.join(__dirname, filename), FileSendeOpt,
                function (err) {
                    if (err) resError(response, 404);
                });
        }
    }

    // テンプレートファイルがあればレンダーして送信
    // なければ静的ファイルを送信
    function render(request, response) {
        //const fpath = fileExist(request, addName + RenderExt);
        const fpath = fileExist(request);
        //リクエスト用の連想配列とモジュール用の連想配列を結合
        const renderObj = Object.assign({ WebRoot: path.resolve(WebRoot), request: request }, Modules);
        if (fpath === null) {
            resError(response, 404);
        } else {
            //レンダリング
            response.render(path.join(__dirname, fpath), renderObj);
        }
        /*
        if (fpath !== null) response.render(path.join(__dirname, fpath)
            , { get: request.query, post: request.body });
        else FileSend(fileExist(request, addName), response);
        */
    }

    // ファイルがない=null ある=パス を返す
    function fileExist(request) {
        const path = url.parse(request.url, true).pathname;

        let date = new Date();
        let datestr = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDay().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;


        if (path.includes('/..')) {
            console.log(datestr + ' - 404: ' + WebRoot + path);
            return null;
        }

        const rpath = WebRoot + path;

        try {
            fs.statSync(rpath);
            console.log(datestr + ' - 200: ' + rpath);
            return rpath;
        } catch (error) {
            console.log(datestr + ' - 404: ' + rpath);
            return null;
        }
    }

    function resError(response, type) {
        response.sendStatus(type);
    }

    // exportsにプロパティ登録・外部に公開
    Object.defineProperties(exports, {
        getReg: {
            value: getReg,
            enumerable: true,
        },
        postReg: {
            value: postReg,
            enumerable: true,
        },
        SendFile: {
            value: (request, response) => fileExtentsFunc[request.params[0]](request, response),
            enumerable: true,
        },
        WebRoot: {
            set: (r) => WebRoot = r,
            enumerable: true,
        },
        RenderExt: {
            set: (r) => RenderExt = r,
            enumerable: true,
        },
        //EJSで使うモジュールをserver.jsで設定できるようにする。
        Modules: {
            set: (r) => Modules = r,
            enumerable: true,
        }
    });
    Object.freeze(exports);

})();