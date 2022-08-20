# TypeScript埋め込みHTML開発環境スクリプト

HTMLにTypeScriptコードを直接記述してなおかつ快適にデバッグしつつコーディングがしたい。

という願望を無理やり実現するためのスクリプト群です。

# 方針

- VSCodeにおいてHTMLモードでもTypeScriptモードでもエラーが出ないように
- いずれのモードにおいてもドキュメントのフォーマットをしたときに大きく崩れないように
- HTMLをそのままブラウザで実行しても表示上問題がないよう余計な出力はしないように
- ブラウザのDevTools(最低限Chrome)でデバッグができるように
- BabelによってJavaScriptへのトランスパイルが事前でもブラウザ実行中でもできるように
- Node.js(EJS)によってHTML文法上問題のないHTML及びTypeScript(JavaScript)が出力できるように
- 上記が基本的に1ファイルで完結できるように

# 仕組み

HTML埋め込みTypeScriptコードをTypeScriptモードでエラーを出さないようにするにはHTML部分をコメントで囲むしかないのですが、
TypeScriptのコメントは`//`と`/* ... */`だけのためそのまま書いてしまうとブラウザではコメント文字列がそのまま表示されてしまいます。

だからといってHTMLコメント`<!-- ... -->`で囲むとTypeScriptでエラーが発生します。

そこで、HTMLのタグ表現である山括弧(<...>)がTypeScriptではキャストであることと、TypeScriptがany型に対してのエラーチェックが緩いことを利用しました。

`<any>0;/*</any>`で囲むことでTypeScriptからみればany型にキャストした値0からコメント開始というこでエラーにならず、
HTMLから見れば`<any>`という謎のタグで囲まれた謎の文字列ということでエラーになりません。

あとはCSSで`<any>`タグを非表示に(`any{display:none;}`)すればブラウザにも表示されないようになります。

これでコメント開始に目途が立ちました。

コメントの終了はTypeScriptコード部分なら`/**/`(前にブロックコメントの開始がればここまでコメント、なければ単なる短いブロックコメント)、
HTML部分なら`<!-- */ //-->`(HTMLコメント内でブロックコメントを終了させ、後ろのHTMLコメント終了を行コメントでコメントアウト)
でどちらからもエラーにせずに終了できるので、目的を達成することが出来ました。

ただこのままだとCSSにコメントが付けられません(ブロックコメントの終了と被る)ので、less.jsでcss拡張構文lessを採用する事で//を使えるようにしました。
とはいえVSCodeのHTMLモードには対応していないので、HTML › Validate: Stylesのチェックを外す必要があります・・・。

# トランスパイル

単純にTypeScriptを埋め込んだだけではDevToolsでデバッグの対象コードにならず、快適にデバッグすることができないので、ブラウザでロードされたときにBabel Standaloneでトランスパイルし、そのコードをScriptタグに入れてDOMで追加することによりデバッグ対象となるようにしました。

Babelは(インラインの)ソースマップの出力にも対応しているので、ソースマップをインラインで出力して元のTypeScriptコードをベースにデバッグができるようになっています。

# サーバーサイド

## モジュール

今回利用したモジュールはこれだけです。

```json
{
  "dependencies": {
    "@babel/core": "^7.18.10",
    "@babel/plugin-transform-typescript": "^7.18.12",
    "@babel/preset-env": "^7.18.10",
    "@babel/preset-typescript": "^7.18.6",
    "body-parser": "^1.20.0",
    "ejs": "^3.1.8",
    "express": "^4.18.1",
    "less": "^4.1.3",
    "uglify-js": "^3.17.0"
  }
}
```

## 実装

Node.js(EJS)を利用して上記の悪あがき部分を取り除いたきれいなHTMLを出力できるようにしました。

最初はPHPでやるつもりでしたが、Node.jsならBabelを使ってサーバーサイドでもトランスパイルができる(というか本来はこっち)しどっちもJavaScriptだから作りやすそうということで。

でもNode.jsでApache+PHPみたいに普通にWebサーバーしつつEJSするサーバーってあんまり実例がないんですよね・・・・

https://note.affi-sapo-sv.com/nodejs-webserver.php?utm_source=pocket_mylist#i2

今回は上記のコードをカスタマイズして実現することにしました。

## コンパイル

Node.js上で実行している時はURKのクエリストリングに`?compile=<モード>`を設定することでcompileディレクトリにHTMLやコードを出力できるようにしました。

- ?compile=html - TypeScript埋め込みHTML
- ?compile=htmljs - トランスパイル済みJavaScript埋め込みHTML
- ?compile=htmljsdebug - トランスパイル済みJavaScriptとソースマップ埋め込みHTML
- ?compile=htmljstag - コードの代わりに&lt;script src="..."&gt;を埋め込んだHTML
- ?compile=htmlonly - コード関係部分を全て除去したHTML
- ?compile=typescript - TypeScriptコード
- ?compile=javascript - トランスパイル済みJavaScriptコード
- ?compile=javascriptdebug - ソースマップ付きトランスパイル済みJavaScriptコード
- ?compile=css -トランスパイル済みcssコード

# ミニファイ

基本的に1ファイルで実現する方針のためトランスパイルするJavaScriptコードもコンパイルするEJSコードも埋め込むことになるのですが、そのままではどうかと思ったので1行にミニファイして埋め込むことにしました。

inclde関数でJavaScriptコードを取り込む形のEJSファイルを作ってテンプレートのデバッグができるようにし、最終的に`?compile=template`を付ければミニファイしたコードが埋め込まれたテンプレートHTMLを出力するように作りました。

uglify-jsってキャプチャグループを利用してreplaceするとおかしな変換をするんですがあれなんなのでしょう？

# EJSタグコメント

HTMLやTypeScriptコード内にEJSタグを埋めてEJS実行時に処理してもらうことができ、プリプロセッサやメタプログラミングのようなことができるようになります。
EJSタグ`<% ～ %>`そのままでは動作に影響があるしTypeScriptモードでエラーが出るので、
`/*% ～ %*/`(TypeScript用)や`<!--% ～ %-->`(HTML用)を埋め込むとEJSでテンプレート実行時にEJSタグとして実行してくれます。
TypeScript用では`%*/`のすぐ後ろに(スペースを挟まない)英数字と_を入れることでEJS非適用時のデフォルト値やエラー回避用のダミー識別子を入れることができます。この部分はEJS適用時は除去されます。