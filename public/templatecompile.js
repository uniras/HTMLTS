//<%
(function (fname) {
    if (request.query.compile === 'template') {
        let path_parts = path.parse(fname);
        include(path_parts.dir + '/option.js');
        let template = fs.readFileSync(fname, 'utf-8').toString();
        template = template.replaceAll(/<script.*?>/g, '<script>');
        let matches = template.matchAll(/(\/\*)?[<]!-- (.*?\.js) --[>](\*\/)?/g);
        for (const value of matches) {
            let jsfile = value[2];
            let code = fs.readFileSync(path_parts.dir + '/' + jsfile, 'utf-8').toString();
            let uglify = UglifyJS.minify(code, UglifyOption);
            let reg = RegExp('(\\/\\*)?[<]!-- ' + jsfile + ' --[>](\\*\\/)?(.*)');
            template = template.replace(reg, uglify.code);
        }
        fs.writeFileSync(path_parts.dir + '/template.html', template, 'utf-8');

        _echostr = '-' + '->' + path_parts.dir + '/template.htmlにファイルを出力しました。' + '<!' + '--';
    }
})(__filename);
//%>