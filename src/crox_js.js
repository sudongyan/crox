/// <reference path="codegen_js.js"/>
function parsetmpl(s) {
	/// <summary>解析模板，得到语法树</summary>
	/// <param name="s" type="String">模板</param>
	var ast = parse(Lexer(s));
	return ast;
}
function compile2jsfn(s, config) {
	/// <summary>编译模板，得到一个 js 函数</summary>
	/// <param name="config" type="Object" optional="true"></param>
	/// <param name="s" type="String">模板</param>
	/// <returns type="Function" />
	var ast = parsetmpl(s);
	var encodeName;
	if (config) encodeName = config.htmlEncode;
	s = codegen_js_tran(ast, encodeName || '_htmlEncode', true);
	var body = '';
	if (!encodeName)
		body = "var _obj = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '\"': '&quot;' };\
	function _htmlEncode(s) {\
		return String(s).replace(/[<>&\"]/g, function(c) {\
			return _obj[c];\
		});\
	}";
	body += "var _t,_s = '';";
	if (config && config.debug) {
		var posLog = s.posLog;
		body += 'try{\n';
		body += 'eval(' + JSON.stringify(s) + ');';
		body += '}catch(_e){throw ' + function(e, posLog) {
			var msg = e.stack;
			var msgLines = msg.split(/\r\n?|\n/);
			var re_pos = /:(\d+):(\d+)\)$/m;
			var m = re_pos.exec(msgLines[1]);
			//var row = +m[1];
			//if (row != 1) throw Error("row != 1");
			var col = +m[2];
			var pos = null;
			for (var i = 0; i < posLog.length; ++i) {
				if (posLog[i][0] + 1 >= col) {
					pos = posLog[i][1];
					break;
				}
			}
			//if (pos == null) throw Error("pos == null");
			function posToString(pos) {
				return '(' + pos.row + ',' + pos.col + ')';
			}
			return Error('CroxError: ' + posToString(pos.pos) + '\n' + msg);
		} + '(_e,' + JSON.stringify(posLog) + ');}';
	}
	else {
		body += s;
	}
	body += "return _s;";

	var f = Function('root', body);
	return f;
}
var Crox = {
	parse: parsetmpl,
	compile: compile2jsfn,
	render: function(s, data) {
		/// <summary>将数据 data 填充到模板 s</summary>
		/// <param name="s" type="String">模板</param>
		/// <returns type="String" />
		var fn = compile2jsfn(s);
		return fn(data);
	}
};
