//<%
//サーバーサイドトランスパイラ
(function (fname, ejsdata) {
    let directory = 'compile';       //出力ディレクトリ
    let compile = false;             //ファイルに出力
    let translate = false;           //JavaScript/cssにトランスパイル
    let insertscripttag = false;     //別のJavaScriptを指すscriptタグを出力
    let suffix = '';                 //出力ファイルの拡張子
    let usecode = false;             //TypeScript(JavaScript)コードを出力
    let usehtml = false;             //HTMLを出力
    let usecss = false;              //less/cssを出力
    let usefootscript = false;       //ブラウザでトランスパイルするコードを出力
    let scripttag = ['', ''];        //コード部分に適用するタグの設定
    let echostr = '';                //メッセージ表示用の戻り値
    let sourcemap = false;           //インラインソースマップの生成
    let ejsstart = ['<', '%'].join('');
    let ejsend = ['%', '>'].join('');
    let hcomstart = ['<', '!', '-', '-'].join('');
    let hcomend = ['-', '-', '>'].join('');

    if (request.query.compile === 'html') {
        //TypeScriptコード(Babel Standaloneトランスパイル用コードも)含むHTMLファイルを出力
        compile = true;
        usecode = true;
        usehtml = true;
        usecss = true;
        usefootscript = true;
        scripttag = ['<textarea id="_ts" style="display:none;">', '    </textarea>'];
        suffix = '.html';
    } else if (request.query.compile === 'htmljs') {
        //トランスパイルしたJavaScriptコードを含むHTMLファイルを出力
        compile = true;
        usecode = true;
        usehtml = true;
        usecss = true;
        translate = true;
        scripttag = ['<script type="text/javascript">', '    </script>'];
        suffix = '.html';
    } else if (request.query.compile === 'htmljsdebug') {
        //トランスパイルしたJavaScriptコードを含むHTMLファイルを出力
        compile = true;
        usecode = true;
        usehtml = true;
        usecss = true;
        translate = true;
        sourcemap = true;
        scripttag = ['<script type="text/javascript">', '    </script>'];
        suffix = '.html';
    } else if (request.query.compile === 'htmljstag') {
        //script src="ファイル名.js"を含むHTMLファイルを出力(JavaScriptコードは別に要出力)
        compile = true;
        usehtml = true;
        insertscripttag = true;
        suffix = '.html';
    } else if (request.query.compile === 'htmlonly') {
        //HTML部分のみをファイルに出力
        compile = true;
        usehtml = true;
        suffix = '.html';
    } else if (request.query.compile === 'typescript') {
        //TypeScriptコード部分のみファイルに出力
        compile = true;
        usecode = true;
        suffix = '.ts';
    } else if (request.query.compile === 'javascript') {
        //トランスパイルしたJavaScriptコードをファイルに出力
        compile = true;
        translate = true;
        usecode = true;
        suffix = '.js';
    } else if (request.query.compile === 'javascriptdebug') {
        //トランスパイルしたJavaScriptコードをファイルに出力(インラインソースマップ付き)
        compile = true;
        translate = true;
        sourcemap = true;
        usecode = true;
        suffix = '.js';
    } else if (request.query.compile === 'css') {
        //トランスパイルしたcssコードをファイルに出力
        compile = true;
        translate = true;
        usecode = true;
        usecss = true;
        suffix = '.css';
    } else if (request.query.compile === undefined) {
        //EJSコードを削除したHTMLをブラウザに表示
        usecode = true;
        usehtml = true;
        usecss = true;
        usefootscript = true;
        scripttag = ['<textarea id="_ts" style="display:none;">', '    </textarea>'];
    } else {
        //別のトランスレータ―でコンパイルされる場合
        return;
    }

    //自分自身のファイルを読み込み
    let source = fs.readFileSync(fname, 'utf-8').toString();

    //HTMLコメントの前の//を除去(名前付きキャプチャグループにしないとminifierがおかしな変換をする)
    source = source.replaceAll(/\/\/\s*?(?<nocom>[<]!--)/g, '$<nocom>');

    //特殊ブロックコメント文字列の除去
    source = source.replaceAll(/\/\*\*\//g, '');

    //特殊コメントをEJSタグに置換
    source = source.replaceAll(/\/\*%/g, ejsstart);
    source = source.replaceAll(/%\*\/([a-zA-Z0-9_]*)/g, ejsend);
    source = source.replaceAll(/[<]!--%/g, ejsstart);
    source = source.replaceAll(/%--[>]/g, ejsend);

    let htmlcode = source;
    let output = '';

    if (usehtml) {
        //HTML相当のコードを抜き出す
        if (usecode || insertscripttag) {
            //あとでTypeScriptやJavaScriptコードを挿入できるようにマーク文字列を埋め込み
            htmlcode = htmlcode.replace(/[<]!-- cstart --[>]/, hcomstart + ' start ' + hcomend + '[*script*]' + hcomstart + ' end ' + hcomend);
            htmlcode = htmlcode.replace(/[<]!-- sstart --[>]/, hcomstart + ' start ' + hcomend + '[*sscript*]' + hcomstart + ' end ' + hcomend);
            htmlcode = htmlcode.replace(/[<]!-- fstart --[>]/, hcomstart + ' start ' + hcomend + '[*fscript*]' + hcomstart + ' end ' + hcomend);
        }

        //HTMLコメントの前の//を除去
        htmlcode = htmlcode.replaceAll(/\/\/\s*?(?<nocom>[<]!--)/g, '$<nocom>');

        //HTMLコードを抜き出す
        let matches = htmlcode.matchAll(/[<]!-- start --[>](.*?)[<]!-- end --[>]/sg);

        for (const value of matches) {
            output += value[1];
        }
    }

    if (insertscripttag) {
        //マークを付けた所にscriptタグを埋め込む
        output = output.replace(/\[\*(?<scr>script.*?\/script)\*\]/, '$<scr>');
        output = output.replace(/\[\*fscript\*\]/, '');
    } else if (usecode) {
        let tscode = '';

        //TypeScriptコードを抜き出す
        let matches = source.match(/[<]!-- cstart --[>](.*?)[<]!-- end --[>]/s);
        tscode = matches[1];

        //lessコードを抜き出す
        matches = source.match(/[<]!-- sstart --[>].*?<style type="text\/less">(.*?)<\/style>.*?[<]!-- end --[>]/s);
        lesscode = matches[1];

        //必要ならTypeScriptからJavaScript、lessからcssにトランスパイル
        if (translate) {
            //TypeScriptのトランスパイル
            const option = { 'targets': 'defaults', 'plugins': [['@babel/plugin-transform-typescript', { 'allExtensions': true, 'loose': true }]], presets: ['@babel/env'] };
            if (sourcemap) Object.assign(option, { sourceMaps: "inline" });
            tscode = babel.transform(tscode, option).code;

            //lessのトランスパイル
            less.render(lesscode, {sync: true}, function (err, result) {
                if (err) {
                    css = err.toString();
                } else {
                    css = result.css;
                }
            });
            lesscode = css;
        }

        if (usehtml) {
            //TypeScriptコードまたはJavaScriptコードをHTMLに埋め込む
            if (!insertscripttag) {
                output = output.replace(/\[\*script\*\]/, scripttag[0] + "\n" + tscode + "\n" + scripttag[1]);
            }

            //lessコードまたはcssコードをHTMLに埋め込む
            if (usecss) {
                if (translate) {
                    output = output.replace(/\[\*sscript\*\]/, '<style>' + lesscode + '</style>');
                } else {
                    output = output.replace(/\[\*sscript\*\]/, '<style type="text/less">' + lesscode + '</style>');
                }
            } else {
                output = output.replace(/\[\*sscript\*\]/, '');
            }

            if (usefootscript) {
                //ブラウザでトランスパイルするコードを埋め込む
                let footer;
                let matches = source.match(/[<]!-- fstart --[>](.*?)[<]!-- end --[>]/s);
                footer = matches[1];
                output = output.replace(/\[\*fscript\*\]/, footer);
            } else {
                //コードを出力しないのでマークだけ除去
                output = output.replace(/\[\*fscript\*\]/, '');
            }
        } else {
            if(usecss) {
                //cssファイルを出力
                output = lesscode;
            } else {
                //HTMLは出力しないのでそのままTypeScriptまたはJavaScriptファイルを出力
                output = tscode;
            }
        }
    }

    //前後の余分な空白を除去
    output = output.trim();

    //EJSコードの変換
    output = (ejs.compile(output, { client: true }))(ejsdata);

    if (compile) {
        //ファイルに出力
        //自身のファイル情報を取得
        let path_parts = path.parse(fname);

        if (insertscripttag) {
            //別のJavaScriptファイルを参照するscriptタグを出力
            output = output.replace(/\[\*script\*\]/, '<script src="./' + path_parts.name + '.js"></script>');
            output = output.replace(/\[\*sscript\*\]/, '<link href="' + path_parts.name + '.css" rel="stylesheet">');
        }

        //出力用ディレクトリが存在しないときは作成する
        if (!fs.existsSync(path_parts.dir + '/' + directory + '/')) {
            fs.mkdirSync(path_parts.dir + '/' + directory + '/');
        }

        //設定した出力先ディレクトリに同名のファイルを書き込み
        fs.writeFileSync(path_parts.dir + '/' + directory + '/' + path_parts.name + suffix, output, 'utf-8');

        //書き込んだファイルのパスと書き込んだ旨のメッセージを出力
        _echostr = hcomend + path_parts.dir + '/' + directory + '/' + path_parts.name + suffix + '　にファイルを作成しました。' + hcomstart;
    } else {
        //そのままブラウザに出力
        _echostr = hcomend + output + hcomstart;
    }

    return echostr;
})(__filename, _ejsdata);
//%>