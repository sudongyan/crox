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
