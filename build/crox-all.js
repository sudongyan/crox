/**
 * @preserve Crox v1.4.2
 * https://github.com/thx/crox
 *
 * Released under the MIT license
 * md5: c0a35c45ffc34ea6d9fdf3fc12c35acd
 */
(function(root) {var Crox = (function() {
function Class(base, constructor, methods) {
	/// <param name="base" type="Function"></param>
	/// <param name="constructor" type="Function"></param>
	/// <param name="prototype" type="Object" optional="true"></param>
	function f() { }
	f.prototype = base.prototype;
	var t = new f;
	if (methods) {
		for (var i in methods)
			t[i] = methods[i];
	}
	if (!constructor)
		constructor = f;
	constructor.prototype = t;
	return constructor;
}

function Position(row, col) {
	this.row = row;
	this.col = col;
}
Position.prototype.toString = function() {
	return '(' + this.row + ',' + this.col + ')';
};

function getPos(s, index) {
	/// <summary>取得字符串中某个位置所在的行列</summary>
	/// <param name="s" type="String"></param>
	/// <param name="index" type="Number"></param>
	var t = s.substring(0, index);
	var re_nl = /\r\n?|\n/g;
	var m = t.match(re_nl);
	var row = 1;
	if (m) {
		row += m.length;
	}
	var col = 1 + /[^\r\n]*$/.exec(t)[0].length;
	return new Position(row, col);
}

function Enum(arr) {
	/// <param name="arr" type="Array"></param>
	var obj = {};
	for (var i = 0; i < arr.length; ++i)
		obj[arr[i]] = arr[i];
	return obj;
}

function inArr(a, t) {
	/// <param name="a" type="Array"></param>
	for (var i = 0; i < a.length; ++i)
		if (a[i] == t)
			return i;
	return -1;
}
function inArr_strict(a, t) {
	/// <param name="a" type="Array"></param>
	for (var i = 0; i < a.length; ++i)
		if (a[i] === t)
			return i;
	return -1;
}
function nodup(a, eq) {
	/// <param name="a" type="Array"></param>
	/// <param name="eq" type="Function" optional="true">比较函数</param>
	if (!eq) eq = function(a, b) { return a === b; };
	var b = [];
	var n = a.length;
	for (var i = 0; i < n; i++) {
		for (var j = i + 1; j < n; j++)
			if (eq(a[i], a[j]))
				j = ++i;
		b.push(a[i]);
	}
	return b;
}
function htmlEncode(s) {
	/// <param name="s" type="String"></param>
	/// <returns type="String" />
	return String(s).replace(/[&<>"]/g, function(a) {
		switch (a) {
			case '&': return '&amp;';
			case '<': return '&lt;';
			case '>': return '&gt;';
			default: return '&quot;';
		}
	});
}
function quote(s) {
	/// <param name="s" type="String"></param>
	/// <returns type="String" />
	return '"' + (s).replace(/[\x00-\x1f"\\\u2028\u2029]/g, function(a) {
		switch (a) {
			case '"': return '\\"';
			case '\\': return '\\\\';
			case '\b': return '\\b';
			case '\f': return '\\f';
			case '\n': return '\\n';
			case '\r': return '\\r';
			case '\t': return '\\t';
		}
		return '\\u' + ('000' + a.charCodeAt(0).toString(16)).slice(-4);
	}) + '"';
}
function singleQuote(s) {
	/// <param name="s" type="String"></param>
	/// <returns type="String" />
	return "'" + (s).replace(/[\x00-\x1f'\\\u2028\u2029]/g, function(a) {
		switch (a) {
			case "'": return "\\'";
			case '\\': return '\\\\';
			case '\b': return '\\b';
			case '\f': return '\\f';
			case '\n': return '\\n';
			case '\r': return '\\r';
			case '\t': return '\\t';
		}
		return '\\u' + ('000' + a.charCodeAt(0).toString(16)).slice(-4);
	}) + "'";
}
function phpQuote(s) {
	/// <param name="s" type="String"></param>
	/// <returns type="String" />
	return "'" + String(s).replace(/['\\]/g, '\\$&') + "'";
}
function evalNum(s) {
	return +s;
}
function evalStr(s) {
	return eval(s);
}

function encodeCommonName(s) {
	/// <param name="s" type="String"></param>
	return s.replace(/^_+/, '$&$&');
}

/// <reference path="common.js"/>
function createLexer(g) {

	function Token(tag, text, index, subMatches, end, pos) {
		this.tag = tag;
		this.text = text;
		this.index = index;
		this.subMatches = subMatches;
		this.end = end;
		this.pos = pos;
	}
	Token.prototype.toString = function() {
		return this.text;
	};
	function emptyFunc() { }
	function buildScanner(a) {
		var n = 1;
		var b = [];
		var matchIndexes = [1];
		var fa = [];
		for (var i = 0; i < a.length; ++i) {
			matchIndexes.push(n += RegExp('|' + a[i][0].source).exec('').length);
			fa.push(a[i][1] || emptyFunc);
			b.push('(' + a[i][0].source + ')');
		}

		var re = RegExp(b.join('|') + '|', 'g');
		return [re, matchIndexes, fa];
	}

	var endTag = g.$ || '$';
	var scanner = {};
	for (var i in g) {
		if (i.charAt(0) != '$')
			scanner[i] = buildScanner(g[i]);
	}

	return Lexer;
	function Lexer(s) {
		/// <param name="s" type="String"></param>
		var Length = s.length;
		var i = 0;
		var stateStack = [''];

		var obj = {
			text: '',
			index: 0,
			source: s,
			pushState: function(s) {
				stateStack.push(s);
			},
			popState: function() {
				stateStack.pop();
			},
			retract: function(n) {
				i -= n;
			}
		};
		var currentPos = new Position(1, 1);

		function scan() {
			var st = stateStack[stateStack.length - 1];
			var rule = scanner[st];
			var re = rule[0];
			re.lastIndex = i;
			var t = re.exec(s);
			if (t[0] == '') {
				if (i < Length) {
					throw Error('lexer error: ' + currentPos +
						'\n' + s.slice(i, i + 50));
				}
				return new Token(endTag, '', i, null, i, currentPos);
			}
			obj.index = i;
			i = re.lastIndex;
			var idx = rule[1];
			for (var j = 0; j < idx.length; ++j)
				if (t[idx[j]]) {
					var tag = rule[2][j].apply(obj, t.slice(idx[j], idx[j + 1]));
					if (tag == null) return null;
					return new Token(tag, t[0], obj.index, t.slice(idx[j] + 1, idx[j + 1]), i, currentPos);
				}
		}

		var re_newLine = /\r\n?|\n/g;
		var re_lastLine = /[^\r\n\u2028\u2029]*$/;
		return {
			scan: function() {
				do {
					var t = scan();
					if (t != null) {
						var _row = currentPos.row;
						var _col = currentPos.col;
						var ms = t.text.match(re_newLine);
						var h = ms ? ms.length : 0;
						_row += h;
						if (h == 0) _col += t.text.length;
						else _col = re_lastLine.exec(t.text)[0].length + 1;
						currentPos = new Position(_row, _col);
						return t;
					}
				} while (true);
			},
			GetCurrentPosition: function() {
				return currentPos;
			},
			getPos: function(i) {
				return getPos(s, i);
			}
		};
	}
}

/// <reference path="createLexer.js"/>
var Lexer = function() {
	var re_id = /[A-Za-z_]\w*/;
	var re_str = /"(?:[^"\\]|\\[\s\S])*"|'(?:[^'\\]|\\[\s\S])*'/;
	var re_num = /\d+(?:\.\d+)?(?:e-?\d+)?/;

	function isReserved(s) {
		return " abstract boolean break byte case catch char class const continue debugger default delete do double else enum export extends final finally float for function goto if implements import in instanceof int interface let long native new package private protected public return short static super switch synchronized this throw throws transient try typeof var void volatile while with yield ".indexOf(' ' + s + ' ') != -1;
	}
	var code = [
		[/\s+/],
		[/\/\/[^\r\n]*|\/\*[\s\S]*?\*\//],
		[re_id, function(a) {
			switch (a) {
				case 'true':
				case 'false':
					return 'boolean';
				case 'set':
				case 'include':
				case 'null':
					return a;
				default:
					if (isReserved(a) || a == 'null') throw Error("Reserved: " + a + ' ' + getPos(this.source, this.index));
					return 'realId';
			}
		}],
		[re_str, function(a) {
			return 'string';
		}],
		[re_num, function(a) {
			return 'number';
		}],
		[/{(?!{)/, function(a) { return '{'; }],
		[/}(?!})/, function(a) { return '}'; }],
		[function(a) {
			a.sort().reverse();
			for (var i = 0; i < a.length; ++i)
				a[i] = a[i].replace(/[()*+?.[\]|]/g, '\\$&');
			return RegExp(a.join('|'));
		}(["!", "%", "&&", "(", ")", "*", "+", "-", ".", "/", "<", "<=", "=", ">", ">=", "[", "]", "||", "===", "!==", "==", "!=", ",", ":"]), function(a) {
			return /[*/%]/.test(a) ? 'mul' : /[<>]/.test(a) ? 'rel' : /[!=]=/.test(a) ? 'eq' : a;
		}]
	];

	var Lexer = createLexer({
		'': [
			[/(?:(?!{{)[\s\S])+/, function(a) {
				return 'text';
			}],
			[/{{{/, function(a) {
				this.pushState(a);
				return a;
			}],
			[/{{(?:\/if|else|\/each|\/forin|\/raw)}}/, function(a) {
				return a;
			}],
			[/{{#raw}}/, function(a) {
				this.pushState('raw');
				return a;
			}],
			[/{{(?:#(?:if|each|forin)(?=\s))?/, function(a) {
				this.pushState('{{');
				return a;
			}]
		],
		raw: [
			[/(?:(?!{{\/raw}})[\s\S])+/, function(a) {
				this.popState();
				return 'rawtext';
			}]
		],
		'{{': code.concat([
			[/}}/, function(a) {
				this.popState();
				return a;
			}]
		]),
		'{{{': code.concat([
			[/}}}/, function(a) {
				this.popState();
				return a;
			}]
		])
	});
	return Lexer;
}();

var parse = function() {
	var table = {//conflicts: 4
		"nStart": 41,
		"tSymbols": /*67*/["$", "!", "\u0026\u0026", "(", ")", "+", ",", "-", ".", ":", "=", "[", "]", "boolean", "eq", "include", "mul", "null", "number", "rawtext", "realId", "rel", "set", "string", "text", "{", "{{", "{{#each", "{{#forin", "{{#if", "{{#raw}}", "{{/each}}", "{{/forin}}", "{{/if}}", "{{/raw}}", "{{else}}", "{{{", "||", "}", "}}", "}}}", "AdditiveExpression", "ArrayLiteral", "ElementList", "Elision", "EqualityExpression", "LogicalAndExpression", "LogicalOrExpression", "MemberExpression", "MultiplicativeExpression", "ObjectLiteral", "PrimaryExpression", "PropertyAssignment", "PropertyNameAndValueList", "RelationalExpression", "UnaryExpression", "_text", "args", "empty", "expr", "id", "name", "program", "statement", "statements", "texts", "program\u0027"],
		actionList: [{ "_": -2 }, { "_": -32768 }, { "24": 11, "26": 9, "27": 7, "28": 8, "29": 6, "30": 12, "36": 10, "_": -1 }, { "_": -3 }, { "24": 11, "30": 12, "_": -13 }, { "_": -17 }, { "1": 37, "3": 33, "7": 38, "11": 35, "13": 32, "15": 28, "17": 34, "18": 31, "20": 30, "22": 27, "23": 29, "25": 36, "_": 0 }, { "1": 37, "3": 33, "7": 38, "11": 35, "13": 32, "15": 43, "17": 34, "18": 31, "20": 30, "22": 42, "23": 29, "25": 36, "_": 0 }, { "_": -19 }, { "19": 45, "_": 0 }, { "_": -18 }, { "_": -27 }, { "_": -45 }, { "_": -29 }, { "_": -30 }, { "3": 46, "8": 48, "11": 47, "_": -52 }, { "_": -55 }, { "16": 49, "_": -57 }, { "5": 51, "7": 50, "_": -60 }, { "21": 52, "_": -62 }, { "14": 53, "_": -64 }, { "2": 54, "_": -66 }, { "37": 55, "_": -68 }, { "39": 56, "_": 0 }, { "_": -22 }, { "_": -23 }, { "_": -24 }, { "_": -21 }, { "_": -25 }, { "_": -26 }, { "_": -31 }, { "6": 62, "12": 61, "_": -69 }, { "15": 28, "20": 30, "22": 27, "23": 67, "38": 68, "_": 0 }, { "15": 28, "20": 30, "22": 27, "23": 67, "_": 0 }, { "39": 73, "_": 0 }, { "3": 33, "11": 35, "13": 32, "15": 28, "17": 34, "18": 31, "20": 30, "22": 27, "23": 29, "25": 36, "_": -22 }, { "23": 75, "_": -23 }, { "40": 76, "_": 0 }, { "34": 77, "_": 0 }, { "1": 37, "3": 33, "7": 38, "11": 35, "13": 32, "15": 28, "17": 34, "18": 31, "20": 30, "22": 27, "23": 29, "25": 36, "_": -69 }, { "15": 28, "20": 30, "22": 27, "_": 0 }, { "_": -2 }, { "4": 91, "_": 0 }, { "6": 93, "12": 92, "_": 0 }, { "1": 37, "3": 33, "6": 95, "7": 38, "11": 35, "13": 32, "15": 28, "17": 34, "18": 31, "20": 30, "22": 27, "23": 29, "25": 36, "_": 0 }, { "_": -32 }, { "_": -38 }, { "9": 97, "_": 0 }, { "_": -16 }, { "6": 98, "38": 99, "_": 0 }, { "_": -42 }, { "_": -15 }, { "_": -40 }, { "_": -53 }, { "_": -54 }, { "15": 28, "20": 30, "22": 27, "23": 67, "_": -69 }, { "_": -11 }, { "3": 46, "8": 48, "10": 104, "11": 47, "_": 0 }, { "39": 105, "_": 0 }, { "_": -12 }, { "_": -20 }, { "4": 106, "6": 107, "_": 0 }, { "_": -50 }, { "4": 108, "_": 0 }, { "12": 109, "_": 0 }, { "_": -46 }, { "_": -56 }, { "16": 49, "_": -59 }, { "16": 49, "_": -58 }, { "5": 51, "7": 50, "_": -61 }, { "21": 52, "_": -63 }, { "14": 53, "_": -65 }, { "2": 54, "_": -67 }, { "24": 11, "26": 9, "27": 7, "28": 8, "29": 6, "30": 12, "33": 110, "35": 111, "36": 10, "_": 0 }, { "_": -28 }, { "_": -33 }, { "6": 62, "_": -69 }, { "_": -34 }, { "_": -39 }, { "_": -35 }, { "_": -41 }, { "39": 116, "_": 0 }, { "39": 117, "_": 0 }, { "39": 118, "_": 0 }, { "39": 119, "_": 0 }, { "_": -14 }, { "_": -48 }, { "_": -49 }, { "_": -47 }, { "_": -4 }, { "_": -2 }, { "_": -44 }, { "_": -43 }, { "_": -2 }, { "_": -2 }, { "39": 129, "_": 0 }, { "_": -51 }, { "24": 11, "26": 9, "27": 7, "28": 8, "29": 6, "30": 12, "33": 130, "36": 10, "_": 0 }, { "_": -36 }, { "_": -37 }, { "24": 11, "26": 9, "27": 7, "28": 8, "29": 6, "30": 12, "31": 131, "36": 10, "_": 0 }, { "24": 11, "26": 9, "27": 7, "28": 8, "29": 6, "30": 12, "31": 132, "36": 10, "_": 0 }, { "24": 11, "26": 9, "27": 7, "28": 8, "29": 6, "30": 12, "32": 133, "36": 10, "_": 0 }, { "24": 11, "26": 9, "27": 7, "28": 8, "29": 6, "30": 12, "32": 134, "36": 10, "_": 0 }, { "_": -10 }, { "_": -5 }, { "_": -6 }, { "_": -7 }, { "_": -8 }, { "_": -9 }],
		actionIndex: [0, 1, 2, 3, 4, 5, 6, 6, 6, 7, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 6, 30, 31, 32, 6, 6, 33, 33, 34, 35, 36, 37, 38, 39, 6, 40, 6, 6, 6, 6, 6, 6, 6, 41, 42, 43, 44, 6, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 6, 33, 80, 81, 82, 83, 84, 6, 85, 86, 6, 87, 88, 89, 90, 44, 6, 91, 92, 93, 93, 94, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109],
		"tGoto": /*135*/[{ "62": 1, "64": 2 }, {}, { "63": 3, "65": 4, "56": 5 }, {}, { "56": 13 }, {}, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 19, "49": 20, "41": 21, "54": 22, "45": 23, "46": 24, "47": 25, "59": 26 }, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 19, "49": 20, "41": 21, "54": 22, "45": 23, "46": 24, "47": 25, "59": 39 }, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 19, "49": 20, "41": 21, "54": 22, "45": 23, "46": 24, "47": 25, "59": 40 }, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 19, "49": 20, "41": 21, "54": 22, "45": 23, "46": 24, "47": 25, "59": 41 }, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 19, "49": 20, "41": 21, "54": 22, "45": 23, "46": 24, "47": 25, "59": 44 }, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 19, "49": 20, "41": 21, "54": 22, "45": 23, "46": 24, "47": 25, "59": 57 }, {}, { "43": 58, "44": 59, "58": 60 }, { "61": 63, "60": 64, "53": 65, "52": 66 }, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 69 }, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 70 }, { "61": 71, "60": 64 }, { "61": 72, "60": 64 }, {}, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 74 }, {}, {}, {}, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "57": 78, "55": 19, "49": 20, "41": 21, "54": 22, "45": 23, "46": 24, "47": 25, "59": 79, "58": 80 }, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 19, "49": 20, "41": 21, "54": 22, "45": 23, "46": 24, "47": 25, "59": 81 }, { "60": 82 }, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 83 }, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 19, "49": 84 }, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 19, "49": 85 }, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 19, "49": 20, "41": 86 }, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 19, "49": 20, "41": 21, "54": 87 }, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 19, "49": 20, "41": 21, "54": 22, "45": 88 }, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 19, "49": 20, "41": 21, "54": 22, "45": 23, "46": 89 }, { "64": 90 }, {}, {}, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 19, "49": 20, "41": 21, "54": 22, "45": 23, "46": 24, "47": 25, "59": 94 }, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 19, "49": 20, "41": 21, "54": 22, "45": 23, "46": 24, "47": 25, "59": 96 }, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, { "61": 100, "60": 64, "58": 101 }, { "61": 102, "60": 64, "58": 103 }, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, { "63": 3, "65": 4, "56": 5 }, {}, {}, { "44": 112, "58": 113 }, {}, {}, {}, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 19, "49": 20, "41": 21, "54": 22, "45": 23, "46": 24, "47": 25, "59": 114 }, { "61": 63, "60": 64, "52": 115 }, {}, {}, {}, {}, {}, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 19, "49": 20, "41": 21, "54": 22, "45": 23, "46": 24, "47": 25, "59": 120 }, {}, {}, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 19, "49": 20, "41": 21, "54": 22, "45": 23, "46": 24, "47": 25, "59": 121 }, {}, {}, {}, { "64": 122 }, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 19, "49": 20, "41": 21, "54": 22, "45": 23, "46": 24, "47": 25, "59": 123 }, { "60": 14, "51": 15, "42": 16, "50": 17, "48": 18, "55": 19, "49": 20, "41": 21, "54": 22, "45": 23, "46": 24, "47": 25, "59": 124 }, {}, {}, { "64": 125 }, { "64": 126 }, { "64": 127 }, { "64": 128 }, {}, {}, { "63": 3, "65": 4, "56": 5 }, {}, {}, { "63": 3, "65": 4, "56": 5 }, { "63": 3, "65": 4, "56": 5 }, { "63": 3, "65": 4, "56": 5 }, { "63": 3, "65": 4, "56": 5 }, {}, {}, {}, {}, {}, {}],
		"tRules": /*70*/[[66, 62], [62, 64], [64], [64, 64, 63], [63, 29, 59, 39, 64, 33], [63, 29, 59, 39, 64, 35, 64, 33], [63, 27, 59, 61, 61, 39, 64, 31], [63, 27, 59, 61, 58, 39, 64, 31], [63, 28, 59, 61, 61, 39, 64, 32], [63, 28, 59, 61, 58, 39, 64, 32], [63, 26, 22, 48, 10, 59, 39], [63, 26, 59, 39], [63, 36, 59, 40], [63, 65], [63, 26, 15, 23, 39], [61, 23], [61, 60], [65, 56], [65, 65, 56], [56, 24], [56, 30, 19, 34], [60, 20], [60, 22], [60, 15], [51, 23], [51, 18], [51, 13], [51, 60], [51, 3, 59, 4], [51, 42], [51, 50], [51, 17], [42, 11, 12], [42, 11, 43, 12], [43, 44, 59], [43, 58, 59], [43, 43, 6, 44, 59], [43, 43, 6, 58, 59], [44, 6], [44, 44, 6], [50, 25, 38], [50, 25, 53, 38], [53, 52], [53, 53, 6, 52], [52, 61, 9, 59], [48, 51], [48, 48, 8, 60], [48, 48, 11, 59, 12], [48, 48, 3, 57, 4], [48, 48, 3, 58, 4], [57, 59], [57, 57, 6, 59], [55, 48], [55, 1, 55], [55, 7, 55], [49, 55], [49, 49, 16, 55], [41, 49], [41, 41, 5, 49], [41, 41, 7, 49], [54, 41], [54, 54, 21, 41], [45, 54], [45, 45, 14, 54], [46, 45], [46, 46, 2, 45], [47, 46], [47, 47, 37, 46], [59, 47], [58]],
		"objCharset": null
	}
	;
	function parse(lexer, others) {
		var nStart = table.nStart;
		var tSymbols = table.tSymbols;
		var tSymbolIndex = {};
		for (var i = 0; i < tSymbols.length; ++i)
			tSymbolIndex[tSymbols[i]] = i;
		var tAction = table.tAction || table.actionList;
		var tGoto = table.tGoto;
		var tRules = table.tRules;
		var tCodes = table.tCodes;
		var actionIndex = table.actionIndex;
		function $f0($1, $2, $3, $4, $5, $6, $7) { var $$; { $$ = ['each', $2, $6, $4, $3, true]; } return $$; }
		function $f1($1, $2, $3, $4, $5, $6, $7) { var $$; { $$ = ['each', $2, $6, $4, $3, false]; } return $$; }
		function $f2($1) { var $$; { $$ = $1.text; } return $$; }
		function $f3($1, $2) { var $$; { $$ = Array($1 || 0); $$.push($2); } return $$; }
		function $f4($1, $2, $3, $4) { var $$; { if ($3) $1.length += $3; ($$ = $1).push($4); } return $$; }
		function $f5($1) { var $$; { $$ = [$1]; } return $$; }
		function $f6($1, $2, $3, $4) { var $$; { $$ = ['()', $1, $3]; } return $$; }
		function $f7($1, $2, $3) { var $$; { $$ = [$2.text, $1, $3]; } return $$; } var tFuncs = [, function($1) { var $$; { $$ = ['prog', $1]; } return $$; }, function() { var $$; { $$ = []; } return $$; }, function($1, $2) { var $$; { $1.push($2); $$ = $1; } return $$; }, function($1, $2, $3, $4, $5) { var $$; { $$ = ['if', $2, $4]; } return $$; }, function($1, $2, $3, $4, $5, $6, $7) { var $$; { $$ = ['if', $2, $4, $6]; } return $$; }, $f0, $f0, $f1, $f1, function($1, $2, $3, $4, $5, $6) { var $$; { $$ = ['set', $3[0] == 'id' ? $3[1] : $3, $5]; } return $$; }, function($1, $2, $3) { var $$; { $$ = ['eval', $2, false]; } return $$; }, function($1, $2, $3) { var $$; { $$ = ['eval', $2, true]; } return $$; }, function($1) { var $$; { $$ = ['text', $1]; } return $$; }, function($1, $2, $3, $4) { var $$; { $$ = ['inc', evalStr($3.text)]; } return $$; }, function($1) { var $$; { $$ = evalStr($1.text); } return $$; }, $f2, function($1) { var $$; { $$ = $1; } return $$; }, function($1, $2) { var $$; { $$ = $1 + $2; } return $$; }, $f2, function($1, $2, $3) { var $$; { $$ = $2.text; } return $$; }, , , , function($1) { var $$; { $$ = ['lit', evalStr($1.text)]; } return $$; }, function($1) { var $$; { $$ = ['lit', evalNum($1.text)]; } return $$; }, function($1) { var $$; { $$ = ['lit', $1.text == 'true']; } return $$; }, function($1) { var $$; { $$ = ['id', $1.text]; } return $$; }, function($1, $2, $3) { var $$; { $$ = $2; } return $$; }, , , function($1) { var $$; { $$ = ['null']; } return $$; }, function($1, $2) { var $$; { $$ = ['array', []]; } return $$; }, function($1, $2, $3) { var $$; { $$ = ['array', $2]; } return $$; }, $f3, $f3, $f4, $f4, function($1) { var $$; { $$ = 1; } return $$; }, function($1, $2) { var $$; { $$ = $1 + 1; } return $$; }, function($1, $2) { var $$; { $$ = ['object', []]; } return $$; }, function($1, $2, $3) { var $$; { $$ = ['object', $2]; } return $$; }, $f5, function($1, $2, $3) { var $$; { $1.push($3); $$ = $1; } return $$; }, function($1, $2, $3) { var $$; { $$ = ['init', $1, $3]; } return $$; }, , function($1, $2, $3) { var $$; { $$ = ['.', $1, $3.text]; } return $$; }, function($1, $2, $3, $4) { var $$; { $$ = ['[]', $1, $3]; } return $$; }, $f6, $f6, $f5, function($1, $2, $3) { var $$; { ($$ = $1).push($3); } return $$; }, , function($1, $2) { var $$; { $$ = ['!', $2]; } return $$; }, function($1, $2) { var $$; { $$ = ['u-', $2]; } return $$; }, , $f7, , $f7, $f7, , $f7, , $f7, , $f7, , $f7];
		function getAction(x, y) {
			return tAction[x][y];
		}
		var stateNum = tAction.length;

		if (actionIndex) {
			getAction = function(x, y) {
				var list = tAction[actionIndex[x]];
				return list[y] || list._;
			};
			stateNum = actionIndex.length;
		}

		function getToken() {
			var t = lexer.scan();
			return t;
		}

		var s = 0;
		var stateStack = [0];
		var a = getToken();
		var valueStack = [];
		var obj = {
			get: function(i) {
				return valueStack[valueStack.length + i];
			},
			set: function(i, v) {
				valueStack[valueStack.length + i] = v;
			}
		};
		if (others) for (var i in others)
			obj[i] = others[i];
		var $smb = valueStack;

		while (1) {
			var $top = $smb.length - 1;
			var t = getAction(s, tSymbolIndex[a.tag]);
			if (!t) {
				var okTokens = [];
				for (var j = 0; j < nStart; ++j) {
					if (getAction(s, j))
						okTokens.push(tSymbols[j]);
				}
				err('find ' + a.tag + '\nexpect ' + okTokens.join(' '));
			}
			else if (t > 0) {
				stateStack.push(s = t);
				valueStack.push(a);
				a = getToken();
			}
			else if (t < 0 && t > -32768) {
				var idx = -t;
				var p = tRules[idx];
				var num = p.length - 1;
				stateStack.length -= num;
				s = tGoto[stateStack[stateStack.length - 1]][p[0]];
				stateStack.push(s);

				if (tFuncs[idx]) {
					var val = tFuncs[idx].apply(obj, valueStack.splice(valueStack.length - num, num));
					valueStack.push(val);
				}
				else if (num != 1) {
					valueStack.splice(valueStack.length - num, num, null);
				}
			}
			else {
				if (a.tag != tSymbols[0]) err();
				return valueStack[0];
			}
		}
		function err(msg) {
			throw Error('Syntax error: ' + lexer.getPos(a.index) + (msg ? '\n' + msg : ''));
		}
	}
	return parse;
}();

function isAtom(op) {
	switch (op) {
		case 'id':
		case 'lit':
			return true;
	}
	return false;
}
function isMember(op) {
	return isAtom(op) || op == '.' || op == '[]';
}

function isUnary(op) {
	return isMember(op) || op == '!' || op == 'u-';
}
function isMul(op) {
	if (isUnary(op)) return true;
	switch (op) {
		case '*': case '/': case '%':
			return true;
	}
	return false;
}
function isAdd(op) {
	if (isMul(op)) return true;
	switch (op) {
		case '+': case '-':
			return true;
	}
	return false;
}
function isRel(op) {
	if (isAdd(op)) return true;
	switch (op) {
		case '<': case '>': case '<=': case '>=':
			return true;
	}
	return false;
}
function isEquality(op) {
	if (isRel(op)) return true;
	switch (op) {
		case 'eq': case 'ne':
			return true;
	}
	return false;
}
function isLogicalAnd(op) {
	return isEquality(op) || op == '&&';
}
function isLogicalOr(op) {
	return isLogicalAnd(op) || op == '||';
}
function changeExt(s, ext) {
	return s.replace(/\.\w+$/, '.' + ext);
}

/// <reference path="common.js"/>
/// <reference path="codegen_common.js"/>
function codegen_js_tran(prog, encodeName, defaultEncode) {
	/// <param name="prog" type="Array">AST</param>
	/// <param name="encodeName" type="String"></param>
	/// <param name="defaultEncode" type="Boolean"></param>
	/// <returns type="String" />

	var i_tmake = 0;
	function TMake() {
		return '_' + (i_tmake++);
	}

	function emit(s) {
		body.push(s);
	}
	function nodeWithPos(node, pos) {
		node.pos = pos;
		return node;
	}

	function stmtGen(a) {
		switch (a[0]) {
			case 'if':
				emit('if(');
				emit(exprGen(a[1]));
				emit('){');
				stmtsGen(a[2]);
				emit('}');
				if (a[3]) {
					emit('else{');
					stmtsGen(a[3]);
					emit('}');
				}
				break;
			case 'each':
				var keyName = a[3] ? encodeCommonName(a[3]) : TMake();
				var tmpExpr = exprGen(a[1]);
				var tmpStr = joinCode(tmpExpr);
				if (/^\w+$/.test(tmpStr)) {
					var listName = tmpStr;
				}
				else {
					listName = TMake();
					emit('var ' + listName + ' = ');
					emit(tmpExpr);
					emit(';');
				}
				if (a[5]) {
					emit('for(var ' + keyName + '=0;' + keyName + '<');
					//listName + '.length'
					emit(exprGen(['.', nodeWithPos(['t', listName], a[1].pos), 'length']));
					emit(';' + keyName + '++){');
				}
				else emit('for(var ' + keyName + ' in ' + listName + ') {');
				emit('var ' + a[4] + ' = ');
				//listName + '[' + keyName + ']'
				emit(exprGen(['[]', nodeWithPos(['t', listName], a[1].pos), ['t', keyName]]));
				emit(';');
				stmtsGen(a[2]);
				emit('}');
				break;
			case 'set':
				if (typeof a[1] == 'string')
					emit('var ' + encodeCommonName(a[1]) + '=');
				else {
					emit(exprGen(a[1]));
					emit('=');
				}
				emit(exprGen(a[2]));
				emit(';');
				break;
			case 'eval':
				var tmpExpr = exprGen(a[1]);
				var tmpStr = joinCode(tmpExpr);
				if (/^\w+$/.test(tmpStr))
					var tName = tmpStr;
				else {
					tName = '_t';
					emit('_t = ');
					emit(tmpExpr);
					emit(';');
				}
				emit('if(' + tName + ' !=null)_s += ' + ((defaultEncode ? !a[2] : a[2]) ? encodeName + '(' + tName + ')' : tName) + ';');
				break;
			case 'text':
				emit('_s += ' + quote(a[1]) + ';');
				break;
			case 'inc':
				//stmtsGen(a[2][1]);
				break;
			default:
				throw Error('unknown stmt: ' + a[0]);
		}
	}
	function stmtsGen(a) {
		for (var i = 0; i < a.length; ++i)
			stmtGen(a[i]);
	}

	function joinCode(a) {
		if (typeof a == 'string')
			return a;
		if (a instanceof Array) {
			var r = [];
			for (var i = 0; i < a.length; ++i) {
				r.push(joinCode(a[i]));
			}
			return r.join('');
		}
		throw new Error("unknown type");
	}
	function exprToStr(x, check) {
		var t = exprGen(x);
		if (check && !check(x[0])) t = ['(', t, ')'];
		return t;
	}
	function exprGen(x) {
		return nodeWithPos(exprGen_original(x), x.pos);
	}
	function exprGen_original(x) {
		switch (x[0]) {
			case 't':
				return x[1]; //临时变量直接返回
			case 'id':
				return encodeCommonName(x[1]);
			case 'lit':
				return (typeof x[1] == 'string')
					? quote(x[1])
				: String(x[1]);
			case 'array':
				var tmp = ['['];
				for (var i = 0; i < x[1].length; ++i) {
					if (i > 0) tmp.push(",");
					tmp.push(exprGen(x[1][i]));
				}
				tmp.push(']');
				return tmp;
			case 'object':
				var tmp = ['{'];
				for (var i = 0; i < x[1].length; ++i) {
					if (i > 0) tmp.push(",");
					tmp.push(quote(x[1][i][1]));
					tmp.push(':');
					tmp.push(exprGen(x[1][i][2]));
				}
				tmp.push('}');
				return tmp;
			case 'null':
				return ['null'];
			case '.':
				return [exprToStr(x[1], isMember), '.', x[2]];
			case '[]':
				return [exprToStr(x[1], isMember), '[', exprGen(x[2]), ']'];
			case '()':
				var a = [exprToStr(x[1], isMember), '('];
				if (x[2]) {
					for (var i = 0; i < x[2].length; ++i) {
						if (i > 0) a.push(',');
						a.push(exprGen(x[2][i]));
					}
				}
				a.push(')');
				return a;
			case '!':
				return ['!', exprToStr(x[1], isUnary)];
			case 'u-':
				return ['- ', exprToStr(x[1], isUnary)];
			case '*': case '/': case '%':
				return [exprToStr(x[1], isMul), x[0], exprToStr(x[2], isUnary)];
			case '+': case '-':
				return [exprToStr(x[1], isAdd), x[0], ' ', exprToStr(x[2], isMul)];
			case '<': case '>': case '<=': case '>=':
				return [exprToStr(x[1], isRel), x[0], exprToStr(x[2], isAdd)];
			case '==':
			case '!=':
			case '===':
			case '!==':
				return [exprToStr(x[1], isEquality), x[0], exprToStr(x[2], isRel)];
			case '&&':
				return [exprToStr(x[1], isLogicalAnd), '&&', exprToStr(x[2], isEquality)];
			case '||':
				return [exprToStr(x[1], isLogicalOr), '||', exprToStr(x[2], isLogicalAnd)];
			default:
				throw Error("unknown expr: " + x[0]);
		}
	}

	var body = [];
	stmtsGen(prog[1]);

	var posLog = [];

	var jsStr = '';
	function joinJsStr(a) {
		if (typeof a == 'string')
			jsStr += a;
		if (a instanceof Array) {
			if (a.pos) {
				posLog.push([jsStr.length, a.pos]);
			}
			for (var i = 0; i < a.length; ++i) {
				joinJsStr(a[i]);
			}
		}
	}
	joinJsStr(body);

	//alert(posLog.join('\n'));
	var strObj = new String(jsStr);
	strObj.posLog = posLog;
	return strObj;
}

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

/// <reference path="common.js"/>
/// <reference path="codegen_common.js"/>
function codegen_php_tran(prog, defaultEncode) {
	/// <param name="prog" type="Array">AST</param>
	/// <param name="defaultEncode" type="Boolean"></param>
	/// <returns type="String" />

	//用户变量名 都奇数个下划线开头
	function encodeId(s) {
		return '$crox_' + encodeCommonName(s);
	}
	function emit(t) {
		s += t;
	}
	function compileEval(stmt) {
		var t = walkExpr(stmt[1]);
		emit('crox_echo(' + t + ', ' + (defaultEncode ? !stmt[2] : stmt[2]) + ');');
	}
	function compileContent(stmt) {
		var t = stmt[1];
		if (/<\?(?:php)?|\?>/.test(t))
			emit('echo ' + phpQuote(stmt[1]) + ';');
		else {
			emit('?>' + t + '<?php ');
		}
	}
	function compileIf(stmt) {
		emit('if(' + walkExpr(stmt[1]) + '){');
		compileStmts(stmt[2]);
		emit('}');
		if (stmt[3]) {
			emit('else{');
			compileStmts(stmt[3]);
			emit('}');
		}
	}
	function compileEach(stmt) {
		emit('foreach(' + walkExpr(stmt[1]) + ' as ' + (stmt[3] ? encodeId(stmt[3]) + '=>' : '') + encodeId(stmt[4]) + ')');
		emit('{');
		compileStmts(stmt[2]);
		emit('}');
	}
	function compileSet(stmt) {
		emit(encodeId(stmt[1]) + ' = ' + walkExpr(stmt[2]) + ';');
	}
	function compileStmt(a) {
		switch (a[0]) {
			case 'if': compileIf(a); break;
			case 'each': compileEach(a); break;
			case 'set': compileSet(a); break;
			case 'eval': compileEval(a); break;
			case 'text': compileContent(a); break;
			case 'inc':
				emit("include '" + changeExt(a[1], 'php') + "';");
				break;
			default: throw Error('unknown stmt: ' + a[0]);
		}
	}
	function compileStmts(a) {
		for (var i = 0; i < a.length; ++i)
			compileStmt(a[i]);
	}

	function exprToStr(x, check) {
		var t = walkExpr(x);
		if (check && !check(x[0])) t = '(' + t + ')';
		return t;
	}
	function walkExpr(x) {
		switch (x[0]) {
			case 'id':
				return encodeId(x[1]);
			case 'lit':
				if (typeof x[1] == 'string')
					return phpQuote(x[1]);
				return String(x[1]);
			case '.':
				return exprToStr(x[1], isMember) + "->" + x[2];
			case '[]':
				return exprToStr(x[1], isMember) + '[' + walkExpr(x[2]) + ']';
			case '!':
				return '!crox_ToBoolean(' + exprToStr(x[1], isUnary) + ')';
			case 'u-':
				return '- ' + exprToStr(x[1], isUnary);
			case '*': case '/': case '%':
				return exprToStr(x[1], isMul) + x[0] + exprToStr(x[2], isUnary);
			case '+':
				return 'crox_plus(' + exprToStr(x[1], null) + ', ' + exprToStr(x[2], null) + ')';
			case '-':
				return exprToStr(x[1], isAdd) + '- ' + exprToStr(x[2], isMul);
			case '<': case '>': case '<=': case '>=':
				return exprToStr(x[1], isRel) + x[0] + exprToStr(x[2], isAdd);
			case '==':
			case '!=':
			case '===':
			case '!==':
				return exprToStr(x[1], isEquality) + x[0] + exprToStr(x[2], isRel);
			case '&&':
				return 'crox_logical_and(' + exprToStr(x[1], null) + ', ' + exprToStr(x[2], null) + ')';
			case '||':
				return 'crox_logical_or(' + exprToStr(x[1], null) + ', ' + exprToStr(x[2], null) + ')';
			default:
				throw Error("unknown expr: " + x[0]);
		}
	}

	var s = "";
	compileStmts(prog[1]);
	if (s.slice(0, 2) == '?>')
		s = s.slice(2);
	else s = '<?php ' + s;
	if (s.slice(-6) == '<?php ')
		s = s.slice(0, -6);
	else s += '?>';
	return s;
}

/// <reference path="common.js"/>
/// <reference path="codegen_common.js"/>
function codegen_vm_tran(prog) {
	/// <param name="prog" type="Array">AST</param>
	/// <returns type="String" />

	//用户变量名 都奇数个下划线开头，临时变量都不下划线开头
	function encodeId(s) {
		return '$crox_' + encodeCommonName(s);
	}
	function isName(s) {
		return /^$\w+$/.test(s);
	}
	function emit(s) {
		body += s;
	}
	var i_each = 0;
	function stmtGen(a) {
		switch (a[0]) {
			case 'if':
				emit('#if(' + exprGen(a[1]) + ')');
				stmtsGen(a[2]);
				if (a[3]) {
					emit('#{else}');
					stmtsGen(a[3]);
				}
				emit('#{end}');
				break;
			case 'each':
				++i_each;
				var sExpr = exprGen(a[1]);
				if (isName(sExpr))
					var listName = sExpr;
				else {
					listName = '$list' + (i_each == 1 ? '' : i_each);
					emit('#set (' + listName + ' = ' + sExpr + ')');
				}
				if (a[5]) { //array
					emit('#foreach(' + encodeId(a[4]) + ' in ' + listName + ')');
					if (a[3]) {
						emit('#set(' + encodeId(a[3]) + ' = $velocityCount - 1)');
					}
				}
				else { //object
					if (a[3]) {
						emit('#foreach(' + encodeId(a[3]) + ' in ' + listName + '.keySet())');
						emit('#set(' + encodeId(a[4]) + ' =' + listName + '.get(' + encodeId(a[3]) + '))');
					}
					else {
						emit('#foreach(' + encodeId(a[4]) + ' in ' + listName + ')');
					}
				}
				stmtsGen(a[2]);
				emit('#{end}');
				--i_each;
				break;
			case 'set':
				emit('#set (' + encodeId(a[1]) + '=' + exprGen(a[2]) + ')');
				break;
			case 'eval':
				var s = exprGen(a[1]);
				if (isName(s))
					emit('$!{' + s.slice(1) + '}');
				else {
					emit('#set($t = ' + s + ')$!{t}');
				}
				break;
			case 'text':
				emit(a[1].replace(/\$/g, '$${dollar}').replace(/#/g, '$${sharp}'));
				break;
			case 'inc':
				emit("#parse('" + changeExt(a[1], 'vm') + "')");
				break;
			default:
				throw Error('unknown stmt: ' + a[0]);
		}
	}
	function stmtsGen(a) {
		for (var i = 0; i < a.length; ++i)
			stmtGen(a[i]);
	}

	function exprToStr(x, check) {
		var t = exprGen(x);
		if (check && !check(x[0])) t = '(' + t + ')';
		return t;
	}
	function exprGen(x) {
		switch (x[0]) {
			case 'id':
				return encodeId(x[1]);
			case 'lit':
				if (typeof x[1] == 'string')
					return vmQuote(x[1]);
				return String(x[1]);
			case '.':
				return exprToStr(x[1], isMember) + '.' + x[2];
			case '[]':
				return exprToStr(x[1], isMember) + '[' + exprGen(x[2]) + ']';
			case '!':
				return '!' + exprToStr(x[1], isUnary);
			case 'u-':
				if (x[1][0] == 'u-') throw Error("禁止两个负号连用");
				return '-' + exprToStr(x[1], isUnary);
			case '*': case '/': case '%':
				return exprToStr(x[1], isMul) + x[0] + exprToStr(x[2], isUnary);
			case '+': case '-':
				return exprToStr(x[1], isAdd) + x[0] + ' ' + exprToStr(x[2], isMul);
			case '<': case '>': case '<=': case '>=':
				return exprToStr(x[1], isRel) + x[0] + exprToStr(x[2], isAdd);
			case '==':
			case '!=':
			case '===':
			case '!==':
				return exprToStr(x[1], isEquality) + x[0].slice(0, 2) + exprToStr(x[2], isRel);
			case '&&':
				return exprToStr(x[1], isLogicalAnd) + '&&' + exprToStr(x[2], isEquality);
			case '||':
				return exprToStr(x[1], isLogicalOr) + '||' + exprToStr(x[2], isLogicalAnd);
			default:
				throw Error("unknown expr: " + x[0]);
		}
	}
	function vmQuote(s) {
		/// <param name="s" type="String"></param>
		if (s.indexOf("'") == -1) return "'" + s + "'";
		var a = s.split("'");
		return "('" + a.join("'+\"'\"+'") + "')";
	}
	var body = "#set($dollar='$')#set($sharp='#')";
	stmtsGen(prog[1]);

	return body;
}

/// <reference path="crox_js.js"/>
/// <reference path="codegen_php.js"/>
/// <reference path="codegen_vm.js"/>
Crox.compileToPhp = function(s) {
	/// <summary>返回编译后的 php</summary>
	/// <param name="s" type="String"></param>
	/// <returns type="String" />
	return codegen_php_tran(parsetmpl(s), true);
};
Crox.compileToVM = function(s, currentPath) {
	/// <summary>返回编译后的 VM 模板</summary>
	/// <param name="s" type="String"></param>
	/// <returns type="String" />
	return codegen_vm_tran(parsetmpl(s));
};

Crox.version = "1.4.2";return Crox;})();if ( typeof module == "object" && module && typeof module.exports == "object" ) module.exports = Crox;else if (typeof define == "function" && (define.amd || define.cmd) ) define(function () { return Crox; } );else if (typeof KISSY != "undefined") KISSY.add(function(){ return Crox; });if (root) root.Crox = Crox; })(this);