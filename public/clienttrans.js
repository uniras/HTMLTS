(async function (id) {
    //appendChild関数を短縮
    let body = document.body;

    //動的に外部JavaScriptファイルのロード
    let includescript = async function (url) {
        return new Promise(function (resolve) {
            let script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = url;
            script.onload = function () {
                resolve();
            }
            body.appendChild(script);
        });
    }

    //クライアントトランスパイラ
    //Babelとpolyfillのロード
    await includescript('https://cdn.jsdelivr.net/npm/@babel/polyfill@latest/dist/polyfill.min.js');
    await includescript('https://cdn.jsdelivr.net/npm/@babel/standalone@latest/babel.min.js');

    //ブラウザでトランスパイルする(そうしないとDevToolでデバッグ出来ない)
    //Babel Standaloneの設定(TypeScriptプリセット使用)
    Babel.registerPreset('ts-plus', {
        presets: [
            [Babel.availablePresets['typescript'], { 'allExtensions': true, 'loose': true }]
        ],
        sourceMaps: "inline"
    });
    //JavaScriptにトランスパイル
    let transcode = Babel.transform(document.getElementById(id).textContent, { presets: ['ts-plus'] }).code;
    //トランスパイルしたコードを動作させるためのScriptタグを設定
    let script = document.createElement('script');
    script.type = 'text/javascript';
    //最後に「//#sourceURL='ファイル名'」というコメントを追加すると動的に追加したJavaScriptコードもデバッグの対象にできる。
    script.textContent = '(function() {' + transcode + "\n})()\n"// + '/' + '/' + '# sourceURL=' + location.href + '.js';
    //scriptタグを追加してトランスパイルしたJavaScriptを動作させる
    body.appendChild(script);
})('_ts');