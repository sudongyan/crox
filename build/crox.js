/**
 * @preserve Crox v1.4.3
 * https://github.com/thx/crox
 *
 * Released under the MIT license
 * md5: c605cc0256fc0e8589c44fd263575d58
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
		}(["!", "%", "&&", "(", ")", "*", "+", "-", ".", "/", "<", "<=", "=", ">", ">=", "[", "]", "||", "===", "!==", "==", "!=", ",", ":", "?"]), function(a) {
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
			[/{{<script>[\s\S]*?<\/script>}}/, function(a) {
				return 'script';
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
		"nStart": 43,
		"tSymbols": /*70*/["$", "!", "\u0026\u0026", "(", ")", "+", ",", "-", ".", ":", "=", "?", "[", "]", "boolean", "eq", "include", "mul", "null", "number", "rawtext", "realId", "rel", "script", "set", "string", "text", "{", "{{", "{{#each", "{{#forin", "{{#if", "{{#raw}}", "{{/each}}", "{{/forin}}", "{{/if}}", "{{/raw}}", "{{else}}", "{{{", "||", "}", "}}", "}}}", "AdditiveExpression", "ArrayLiteral", "ConditionalExpression", "ElementList", "Elision", "EqualityExpression", "LogicalAndExpression", "LogicalOrExpression", "MemberExpression", "MultiplicativeExpression", "ObjectLiteral", "PrimaryExpression", "PropertyAssignment", "PropertyNameAndValueList", "RelationalExpression", "UnaryExpression", "_text", "args", "empty", "expr", "id", "name", "program", "statement", "statements", "texts", "program\u0027"],
		actionList: [{ "_": -1 }, { "23": 5, "26": 11, "28": 9, "29": 7, "30": 8, "31": 6, "32": 12, "38": 10, "_": -32768 }, { "_": -2 }, { "26": 11, "32": 12, "_": -15 }, { "_": -19 }, { "_": -3 }, { "1": 38, "3": 34, "7": 39, "12": 36, "14": 33, "16": 29, "18": 35, "19": 32, "21": 31, "24": 28, "25": 30, "27": 37, "_": 0 }, { "1": 38, "3": 34, "7": 39, "12": 36, "14": 33, "16": 44, "18": 35, "19": 32, "21": 31, "24": 43, "25": 30, "27": 37, "_": 0 }, { "_": -21 }, { "20": 46, "_": 0 }, { "_": -20 }, { "_": -29 }, { "_": -47 }, { "_": -31 }, { "_": -32 }, { "3": 47, "8": 49, "12": 48, "_": -54 }, { "_": -57 }, { "17": 50, "_": -59 }, { "5": 52, "7": 51, "_": -62 }, { "22": 53, "_": -64 }, { "15": 54, "_": -66 }, { "2": 55, "_": -68 }, { "11": 57, "39": 56, "_": -70 }, { "_": -72 }, { "41": 58, "_": 0 }, { "_": -24 }, { "_": -25 }, { "_": -26 }, { "_": -23 }, { "_": -27 }, { "_": -28 }, { "_": -33 }, { "6": 64, "13": 63, "_": -73 }, { "16": 29, "21": 31, "24": 28, "25": 69, "40": 70, "_": 0 }, { "16": 29, "21": 31, "24": 28, "25": 69, "_": 0 }, { "41": 75, "_": 0 }, { "3": 34, "12": 36, "14": 33, "16": 29, "18": 35, "19": 32, "21": 31, "24": 28, "25": 30, "27": 37, "_": -24 }, { "25": 77, "_": -25 }, { "42": 78, "_": 0 }, { "36": 79, "_": 0 }, { "1": 38, "3": 34, "7": 39, "12": 36, "14": 33, "16": 29, "18": 35, "19": 32, "21": 31, "24": 28, "25": 30, "27": 37, "_": -73 }, { "16": 29, "21": 31, "24": 28, "_": 0 }, { "_": -4 }, { "4": 94, "_": 0 }, { "6": 96, "13": 95, "_": 0 }, { "1": 38, "3": 34, "6": 98, "7": 39, "12": 36, "14": 33, "16": 29, "18": 35, "19": 32, "21": 31, "24": 28, "25": 30, "27": 37, "_": 0 }, { "_": -34 }, { "_": -40 }, { "9": 100, "_": 0 }, { "_": -18 }, { "6": 101, "40": 102, "_": 0 }, { "_": -44 }, { "_": -17 }, { "_": -42 }, { "_": -55 }, { "_": -56 }, { "16": 29, "21": 31, "24": 28, "25": 69, "_": -73 }, { "_": -13 }, { "3": 47, "8": 49, "10": 107, "12": 48, "_": 0 }, { "41": 108, "_": 0 }, { "_": -14 }, { "_": -22 }, { "4": 109, "6": 110, "_": 0 }, { "_": -52 }, { "4": 111, "_": 0 }, { "13": 112, "_": 0 }, { "_": -48 }, { "_": -58 }, { "17": 50, "_": -61 }, { "17": 50, "_": -60 }, { "5": 52, "7": 51, "_": -63 }, { "22": 53, "_": -65 }, { "15": 54, "_": -67 }, { "2": 55, "_": -69 }, { "9": 113, "_": 0 }, { "26": 11, "28": 9, "29": 7, "30": 8, "31": 6, "32": 12, "35": 115, "37": 116, "38": 10, "_": 0 }, { "_": -30 }, { "_": -35 }, { "6": 64, "_": -73 }, { "_": -36 }, { "_": -41 }, { "_": -37 }, { "_": -43 }, { "41": 121, "_": 0 }, { "41": 122, "_": 0 }, { "41": 123, "_": 0 }, { "41": 124, "_": 0 }, { "_": -16 }, { "_": -50 }, { "_": -51 }, { "_": -49 }, { "_": -5 }, { "_": -6 }, { "_": -4 }, { "_": -46 }, { "_": -45 }, { "_": -4 }, { "_": -4 }, { "41": 135, "_": 0 }, { "_": -53 }, { "_": -71 }, { "26": 11, "28": 9, "29": 7, "30": 8, "31": 6, "32": 12, "35": 136, "38": 10, "_": 0 }, { "_": -38 }, { "_": -39 }, { "26": 11, "28": 9, "29": 7, "30": 8, "31": 6, "32": 12, "33": 137, "38": 10, "_": 0 }, { "26": 11, "28": 9, "29": 7, "30": 8, "31": 6, "32": 12, "33": 138, "38": 10, "_": 0 }, { "26": 11, "28": 9, "29": 7, "30": 8, "31": 6, "32": 12, "34": 139, "38": 10, "_": 0 }, { "26": 11, "28": 9, "29": 7, "30": 8, "31": 6, "32": 12, "34": 140, "38": 10, "_": 0 }, { "_": -12 }, { "_": -7 }, { "_": -8 }, { "_": -9 }, { "_": -10 }, { "_": -11 }],
		actionIndex: [0, 1, 2, 3, 4, 5, 6, 6, 6, 7, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 6, 31, 32, 33, 6, 6, 34, 34, 35, 36, 37, 38, 39, 40, 6, 41, 6, 6, 6, 6, 6, 6, 6, 6, 42, 43, 44, 45, 6, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 6, 34, 82, 83, 84, 85, 86, 6, 87, 88, 6, 89, 90, 6, 91, 92, 93, 45, 6, 94, 95, 96, 96, 97, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113],
		"tGoto": /*141*/[{ "65": 1 }, { "66": 2, "68": 3, "59": 4 }, {}, { "59": 13 }, {}, {}, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 19, "52": 20, "43": 21, "57": 22, "48": 23, "49": 24, "50": 25, "45": 26, "62": 27 }, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 19, "52": 20, "43": 21, "57": 22, "48": 23, "49": 24, "50": 25, "45": 26, "62": 40 }, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 19, "52": 20, "43": 21, "57": 22, "48": 23, "49": 24, "50": 25, "45": 26, "62": 41 }, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 19, "52": 20, "43": 21, "57": 22, "48": 23, "49": 24, "50": 25, "45": 26, "62": 42 }, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 19, "52": 20, "43": 21, "57": 22, "48": 23, "49": 24, "50": 25, "45": 26, "62": 45 }, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 19, "52": 20, "43": 21, "57": 22, "48": 23, "49": 24, "50": 25, "45": 26, "62": 59 }, {}, { "46": 60, "47": 61, "61": 62 }, { "64": 65, "63": 66, "56": 67, "55": 68 }, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 71 }, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 72 }, { "64": 73, "63": 66 }, { "64": 74, "63": 66 }, {}, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 76 }, {}, {}, {}, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "60": 80, "58": 19, "52": 20, "43": 21, "57": 22, "48": 23, "49": 24, "50": 25, "45": 26, "62": 81, "61": 82 }, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 19, "52": 20, "43": 21, "57": 22, "48": 23, "49": 24, "50": 25, "45": 26, "62": 83 }, { "63": 84 }, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 85 }, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 19, "52": 86 }, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 19, "52": 87 }, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 19, "52": 20, "43": 88 }, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 19, "52": 20, "43": 21, "57": 89 }, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 19, "52": 20, "43": 21, "57": 22, "48": 90 }, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 19, "52": 20, "43": 21, "57": 22, "48": 23, "49": 91 }, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 19, "52": 20, "43": 21, "57": 22, "48": 23, "49": 24, "50": 25, "45": 92 }, { "67": 93 }, {}, {}, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 19, "52": 20, "43": 21, "57": 22, "48": 23, "49": 24, "50": 25, "45": 26, "62": 97 }, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 19, "52": 20, "43": 21, "57": 22, "48": 23, "49": 24, "50": 25, "45": 26, "62": 99 }, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, { "64": 103, "63": 66, "61": 104 }, { "64": 105, "63": 66, "61": 106 }, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, { "66": 114, "68": 3, "59": 4 }, {}, {}, { "47": 117, "61": 118 }, {}, {}, {}, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 19, "52": 20, "43": 21, "57": 22, "48": 23, "49": 24, "50": 25, "45": 26, "62": 119 }, { "64": 65, "63": 66, "55": 120 }, {}, {}, {}, {}, {}, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 19, "52": 20, "43": 21, "57": 22, "48": 23, "49": 24, "50": 25, "45": 26, "62": 125 }, {}, {}, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 19, "52": 20, "43": 21, "57": 22, "48": 23, "49": 24, "50": 25, "45": 26, "62": 126 }, {}, {}, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 19, "52": 20, "43": 21, "57": 22, "48": 23, "49": 24, "50": 25, "45": 127 }, {}, {}, { "67": 128 }, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 19, "52": 20, "43": 21, "57": 22, "48": 23, "49": 24, "50": 25, "45": 26, "62": 129 }, { "63": 14, "54": 15, "44": 16, "53": 17, "51": 18, "58": 19, "52": 20, "43": 21, "57": 22, "48": 23, "49": 24, "50": 25, "45": 26, "62": 130 }, {}, {}, { "67": 131 }, { "67": 132 }, { "67": 133 }, { "67": 134 }, {}, {}, {}, { "66": 114, "68": 3, "59": 4 }, {}, {}, { "66": 114, "68": 3, "59": 4 }, { "66": 114, "68": 3, "59": 4 }, { "66": 114, "68": 3, "59": 4 }, { "66": 114, "68": 3, "59": 4 }, {}, {}, {}, {}, {}, {}],
		"tRules": /*74*/[[69, 65], [65], [65, 65, 66], [65, 65, 23], [67], [67, 67, 66], [66, 31, 62, 41, 67, 35], [66, 31, 62, 41, 67, 37, 67, 35], [66, 29, 62, 64, 64, 41, 67, 33], [66, 29, 62, 64, 61, 41, 67, 33], [66, 30, 62, 64, 64, 41, 67, 34], [66, 30, 62, 64, 61, 41, 67, 34], [66, 28, 24, 51, 10, 62, 41], [66, 28, 62, 41], [66, 38, 62, 42], [66, 68], [66, 28, 16, 25, 41], [64, 25], [64, 63], [68, 59], [68, 68, 59], [59, 26], [59, 32, 20, 36], [63, 21], [63, 24], [63, 16], [54, 25], [54, 19], [54, 14], [54, 63], [54, 3, 62, 4], [54, 44], [54, 53], [54, 18], [44, 12, 13], [44, 12, 46, 13], [46, 47, 62], [46, 61, 62], [46, 46, 6, 47, 62], [46, 46, 6, 61, 62], [47, 6], [47, 47, 6], [53, 27, 40], [53, 27, 56, 40], [56, 55], [56, 56, 6, 55], [55, 64, 9, 62], [51, 54], [51, 51, 8, 63], [51, 51, 12, 62, 13], [51, 51, 3, 60, 4], [51, 51, 3, 61, 4], [60, 62], [60, 60, 6, 62], [58, 51], [58, 1, 58], [58, 7, 58], [52, 58], [52, 52, 17, 58], [43, 52], [43, 43, 5, 52], [43, 43, 7, 52], [57, 43], [57, 57, 22, 43], [48, 57], [48, 48, 15, 57], [49, 48], [49, 49, 2, 48], [50, 49], [50, 50, 39, 49], [45, 50], [45, 50, 11, 45, 9, 45], [62, 45], [61]],
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
		function $f7($1, $2, $3) { var $$; { $$ = [$2.text, $1, $3]; } return $$; } var tFuncs = [, function() { var $$; { $$ = ['prog', [], []]; } return $$; }, function($1, $2) { var $$; { $1[1].push($2); $$ = $1; } return $$; }, function($1, $2) { var $$; { $1[2].push($2.text.slice(10, -11)); $$ = $1; } return $$; }, function() { var $$; { $$ = []; } return $$; }, function($1, $2) { var $$; { $1.push($2); $$ = $1; } return $$; }, function($1, $2, $3, $4, $5) { var $$; { $$ = ['if', $2, $4]; } return $$; }, function($1, $2, $3, $4, $5, $6, $7) { var $$; { $$ = ['if', $2, $4, $6]; } return $$; }, $f0, $f0, $f1, $f1, function($1, $2, $3, $4, $5, $6) { var $$; { $$ = ['set', $3[0] == 'id' ? $3[1] : $3, $5]; } return $$; }, function($1, $2, $3) { var $$; { $$ = ['eval', $2, false]; } return $$; }, function($1, $2, $3) { var $$; { $$ = ['eval', $2, true]; } return $$; }, function($1) { var $$; { $$ = ['text', $1]; } return $$; }, function($1, $2, $3, $4) { var $$; { $$ = ['inc', evalStr($3.text)]; } return $$; }, function($1) { var $$; { $$ = evalStr($1.text); } return $$; }, $f2, function($1) { var $$; { $$ = $1; } return $$; }, function($1, $2) { var $$; { $$ = $1 + $2; } return $$; }, $f2, function($1, $2, $3) { var $$; { $$ = $2.text; } return $$; }, , , , function($1) { var $$; { $$ = ['lit', evalStr($1.text)]; } return $$; }, function($1) { var $$; { $$ = ['lit', evalNum($1.text)]; } return $$; }, function($1) { var $$; { $$ = ['lit', $1.text == 'true']; } return $$; }, function($1) { var $$; { $$ = ['id', $1.text]; } return $$; }, function($1, $2, $3) { var $$; { $$ = $2; } return $$; }, , , function($1) { var $$; { $$ = ['null']; } return $$; }, function($1, $2) { var $$; { $$ = ['array', []]; } return $$; }, function($1, $2, $3) { var $$; { $$ = ['array', $2]; } return $$; }, $f3, $f3, $f4, $f4, function($1) { var $$; { $$ = 1; } return $$; }, function($1, $2) { var $$; { $$ = $1 + 1; } return $$; }, function($1, $2) { var $$; { $$ = ['object', []]; } return $$; }, function($1, $2, $3) { var $$; { $$ = ['object', $2]; } return $$; }, $f5, function($1, $2, $3) { var $$; { $1.push($3); $$ = $1; } return $$; }, function($1, $2, $3) { var $$; { $$ = ['init', $1, $3]; } return $$; }, , function($1, $2, $3) { var $$; { $$ = ['.', $1, $3.text]; } return $$; }, function($1, $2, $3, $4) { var $$; { $$ = ['[]', $1, $3]; } return $$; }, $f6, $f6, $f5, function($1, $2, $3) { var $$; { ($$ = $1).push($3); } return $$; }, , function($1, $2) { var $$; { $$ = ['!', $2]; } return $$; }, function($1, $2) { var $$; { $$ = ['u-', $2]; } return $$; }, , $f7, , $f7, $f7, , $f7, , $f7, , $f7, , $f7, , function($1, $2, $3, $4, $5) { var $$; { $$ = ['cond', $1, $3, $5]; } return $$; }];
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
		case 't':
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
function isCond(op) {
	return isLogicalOr(op) || op == 'cond';
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
			case 'cond':
				return [exprToStr(x[1], isLogicalOr), '?', exprToStr(x[2], isCond), ':', exprToStr(x[3], isCond)];
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

	if (prog[2]) {
		jsStr += prog[2].join(';');
	}
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

Crox.version = "1.4.3";return Crox;})();if ( typeof module == "object" && module && typeof module.exports == "object" ) module.exports = Crox;else if (typeof define == "function" && (define.amd || define.cmd) ) define(function () { return Crox; } );else if (typeof KISSY != "undefined") KISSY.add(function(){ return Crox; });if (root) root.Crox = Crox; })(this);