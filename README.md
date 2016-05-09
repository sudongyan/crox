# 高性能跨语言模板引擎 Crox

## 综述

Crox是一个由JavaScript语言实现的 `高性能` `跨语言` 模板引擎。

Crox模板可以直接在JavaScript环境中使用，也可以翻译成PHP、JSP等其他编程语言的可执行方法，或翻译成Velocity、Smarty等其他模板引擎的源模板。

Crox将保证翻译后的结果具备最佳执行效率。

一、首先
----

Crox ，是一种可以翻译成多种语言的模板



二、简介
----

一个典型的 Crox 模板：

```
你好 {{root.name}}

你刚赢了 ￥{{ root.value}}

{{#if root.in_ca}}

嗯，税后 ￥{{ root.taxed_value}}

{{/if}}
```


提供以下数据：

```
{

  "name": "Chris",

  "value": 10000,

  "taxed_value": 10000 - (10000 * 0.4),

  "in_ca": true

}
```


将产生以下结果：

```
你好 Chris

你刚赢了 ￥10000

嗯，税后 ￥6000
```


完整写出如下（用法）：

```
var f = crox_js(strTmpl);

var strResult = f(data);
```


三、说明
----

该模板可用于前后端，可以翻译成多种语言。该模板选用了一种中间语法，可以生成一个高效的函数。该函数接受一个参数 root（以前叫 data，任意 JSON 类型的数据）。

模板，支持以下语法：

 - 表达式输出

```
{{root}}  输出 data

{{root.name}} 输出 data.name

{{root.value * 2}} 输出 2 倍的 data.value

还支持多种运算符：. [] ! * / % + - < > <= >= === !==
```


 - 选择语句

```
{{#if root.ok}} 好，又赢了 {{/if}}

{{#if root.length > 0}} 有 {{else}} 没了 {{/if}}

```

 - 循环语句,用于循环数组或对象

```
{{#each root 'val'}}{{val}}{{/each}}

{{#each root 'key' 'val'}}{{key}}=>{{val}}{{/each}}
```


 - 赋值语句,重复使用的较长的表达式，可以赋值给一个变量，例如：

```
{{set a = data.lilei.mother.phone.brand}}
```




四、其他
----

1. 文件介绍

    1.  总体演示：test.htm （一个图书列表的例子）

    2. 详细的每个语法的例子汇总：examples.htm

    3. build.wsf：打包工具，从 src 读取文件，经合并压缩，产生到 build 目录下

    4. config.js：包含一些配置项，例如：google closure compiler 路径 和 php 路径

    5. test.hta：js和php的集成测试（win）

    6. crox_spec.pdf： 语法文档

2. 如何运行 test.hta？

    1. 首先需要在 windows 下

    2. 需要 php，可以从 http://php.net/downloads.php 下载，安装到 E:\php\ 下（因为程序需要 E:\php\php.exe。可更改）

    3. 双击 test.hta，点击相应的按钮，就可以开始了（会产生一个临时文件 temp.php 在当前目录，可以自己删掉）



3. 如何运行 build.wsf？

    1. 首先，需要在 windows 系统下

    2. 从 http://code.google.com/p/closure-compiler/ 下载，解压到 D:\gcc\ 下（因为程序需要 D:\gcc\compiler.jar，可更改）

    3. 双击 build.wsf 就可以产生 crox.js、crox_min.js 到 build 目录


* 作者：三冰，李牧，思竹，陆辉，思霏

## Crox官网导航

- [Crox官网首页](http://thx.github.io/crox/)
- [快速上手](http://thx.github.io/crox/tutorials)
- [Demos](http://thx.github.io/crox/demos)
- [API介绍](http://thx.github.io/crox/apis)
- [Crox Nodejs命令行工具](http://thx.github.io/crox/apis/nodejs-api/)
- [利用Crox命令行工具，将Crox模板翻译成多种文件或模块](http://thx.github.io/crox/demos/generate/)
- [Crox相关文章](http://thx.github.io/crox/articles)
- [Crox相关其他资源](http://thx.github.io/crox/resources)
- [常见问题与回答](http://thx.github.io/crox/faq)
- [发布历史](http://thx.github.io/crox/releases)

## update

* 注释

  ```
  {* 这里是注释 *}
  ```

* 自定义helper方法的能力

  在dep/crox/crox-extra.js及dep/crox/crox-extra.php进行方法的定义，在全站模板中均可使用。

  名为`foo`的方法，在crox-extra.js中添加`crox.helpers.foo = function () {...}`定义，在crox-extra.php中添加`function crox_foo () {...}`定义，在模板中使用示例：

  ```
  {{foo(root.name)}}
  ```

* `include`支持作用域及传参

  每个模板中的变量作用域都是独立的，在`include`其他模板时可以选择传入参数，子模板可以通过`root`获取到传入的变量，语法如下：

  ```
  {{include "../../widget/entry/entry.tpl"
    page = page,
    webSpeedId = webSpeedId
  }}
  {* entry.tpl中可以通过root.page及root.webSpeedId获取到对应的值 *}
  ```

* 修复了一些crox在实现PHP代码生成时的bug（包括获取属性的方式及PHP `include` 相对路径的问题）

## LALR1 生成器
- https://jser.net/
