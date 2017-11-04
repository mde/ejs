EJS 语法参考
====================

EJS 设计得灵活、简单易写，并且不存在太多的抽象东西来覆盖 HTML 基础。

目录
-----------------

-   基本格式
-   界限符
-   起始标签
    -   `<%=`: 转义输出
    -   `<%-`: 非转义输出
    -   `<%#`: 注释
    -   `<%`: 脚本段
    -   `<%_`: 脚本段，移除所有原始空白符
-   闭合标签
    -   `%>`: 标准结束标签
    -   `-%>`: 移除后边的换行符 (trailing newline)
    -   `_%>`: 移除后边所有的空白符 (trailing whitespace)
-   字面量标签
-   包含其他文件
    -   “Preprocessor” 指令
    -   JavaScript `include()` 函数
-   版权


基本格式
---

一个 EJS “标签” 是 EJS 模板中最基本的功能单元。除了字面量标签外，其他的所有标签都为一下格式：

<pre>&lt;<em>起始</em> <em>内容</em> <em>结束</em>&gt;</pre>

*起始标签* 和 *内容* 以及 *内容* 和 *闭合标签* 并非必要，但为了可读性，推荐在它们之间添加空格

界限符
---

 *起始标签* 和 *闭合标签* 包含一个叫做界限符的特殊字符，本文档中，所有标签都通过默认的 `%` 界限符来演示，你也可以起修改该界限符。查看 [自定义界限符](https://github.com/mde/ejs#custom-delimiters ) 来获取关于如何修改它的信息。

起始标签
---

### `<%=`: 转义输出

对于模板语言来说，给模板传递变量的能力至关重要。在 EJS 中，这一功能通过 `<%=` 和 `<%-` 标签来完成。

`<%=` 起始标签主要用于转义那些需要转义的变量。如果指定的字符串中包含有一些禁用的字符，如 `<` 和 `&`，它们将会自动转义为 HTML 实体

标签中的内容可以是 JavaScript 中任意的合法操作符，所以像 `<%= name ? name : (lastName || 'John Doe') %>` 这样的标签能够按照希望的方式执行。

#### 示例

##### EJS 模板

```html
<p>Hello, <%= name %>.</p>
<p>Hello, <%= 'the Most Honorable ' + name %>.</p>
```

##### 局部变量

```json
{
  "name": "Timoth<y>"
}
```

##### HTML

```html
<p>Hello, Timoth&lt;y&gt;.</p>
<p>Hello, the Most Honorable Timoth&lt;y&gt;.</p>
```

### `<%-`: 非转义输出

如果你的局部变量中保航有一些预先格式的 HTML，你可能不希望转义它们。这种情况，你就需要用到 `<%-` 了。

然而，你必须 **100% 确保** 这些需要渲染的局部变量是无害的，以便避免跨站攻击 (XSS)。

#### 示例

##### EJS 模板

```html
<p>Hello, <%- myHtml %>.</p>
<p>Hello, <%= myHtml %>.</p>

<p>Hello, <%- myMaliciousHtml %>.</p>
<p>Hello, <%= myMaliciousHtml %>.</p>
```

##### 局部变量

```json
{
  "myHtml": "<strong>Timothy</strong>"
, "myMaliciousHtml": "</p><script>document.write()</script><p>"
}
```

##### HTML 结构

```html
<p>Hello, <strong>Timothy</strong>.</p>
<p>Hello, &lt;strong&gt;Timothy&lt;/strong&gt;.</p>

<p>Hello, </p><script>document.write()</script><p>.</p>
<p>Hello, &lt;/p&gt;&lt;script&gt;document.write()&lt;/script&gt;&lt;p&gt;.</p>
```

### `<%#`: 注释

`<%#` 起始标签表示该声明属于注释，不会被执行或者选择成 HTML。

#### 空白符

使用 `<%#` 标签可能会造成一些无用的空白符，例如以下示例。你可以使用 `-%>` 闭合标签来删除这些空白符。

#### 示例

##### EJS 模板

```html
<div>
<%# comment %>
</div>

<div>
<%# comment -%>
</div>
```

##### HTML 结构

```html
<div>

</div>

<div>
</div>
```

### `<%`: 脚本片段

在 `<%` 之间的脚本片段能将逻辑控制嵌入到 EJS 模板中。你可以在该标签中随意的将 **任意的** JavaScript 语法和 EJS 混合使用。你也可以在一个标签中放置多条声明。

#### 注释

尽管使用 `<%#` 标签来写注释更合 EJS 语法，但你已可以在 `<%` 标签中书写 JavaScript 支持的所有注释。比如，以下三种方式都合法，但显然使用 `<%#` 标签的方式更为简短。

```js
<%# comment %>
<%/* comment */%>
<%// comment %>
```

#### 花括号 (Curly brackets)

在混合了 JES 模板和 JavaScript 脚本片段的循环和条件控制是需要使用花括号。尽管某些声明可以忽略掉花括号，但会让行为变得不可控，导致意外结果。

对于单行语句，花括号是不必要的。

```html
<%# Bad practice %>
<% if (true) %>
  <p>Yay it's true!</p>

<%# Good practice %>
<% if (true) { %>
  <p>Yay it's true!</p>
<% } %>
```

```js
<%# These are all valid statements %>
<% var output
     , exclamation = ''
     , shouldOutput = false

   if (true)
     output = 'true!'

   if (true) {
     exclamation = 'Yay! ';
   }

   if (true) shouldOutput = true; %>

<% if (shouldOutput) { %>
  <%= exclamation + 'It\'s ' + output %>
<% } %>
```

#### 标签内换行

`<%` 标签内允许换行。

除非声明中混合了 EJS 和 JavaScript 代码片段，否则将永远将完整的声明放在一个标签中。比如下方的示例：

```js
<% var stringToShow = thisIsABooleanVariableWithAVeryLongName
                    ? 'OK'
                    : 'not OK' %>
```

如下示例非法：

```js
<% var stringToShow = thisIsABooleanVariableWithAVeryLongName %>
<%                  ? 'OK'                                    %>
<%                  : 'not OK'                                %>
```

#### 分号 (Semicolons)

正如 JavaScript，如果已经是正确的断行，则可以省略掉分号。

#### 空白符

代码片段的使用可能会导致一些无用的空白符，比如以下的示例，你可以通过下面的两个方式来删除它们：

1.  使用 `-%>` 结束标签
2.  使用 `<%_` 起始标签或者在新的一行中书写标签

#### 示例

在下边的例子中，同时使用了多种编码风格来展示 EJS 的灵活，而不用管个人的代码习惯。但是这 *并不* 意味着我们推荐在你自己的项目中使用混合的编码风格。

##### EJS 模板

```html
<dl>
<%for (var i = 0; i < users.length; i++) {    %><%
  var user = users[i]
      , name = user.name // the name of the user
    %><%# comment %>
  <%var age  = user.age; /* the age of the user */%>
  <dt><%= name %></dt>
  <dd><%= age %></dd>
<%}-%>
</dl>
```

##### 局部变量

```json
{
  "users": [
    {
      "name": "Timothy"
    , "age":  15
    }
  , {
      "name": "Juan"
    , "age":  51
    }
  ]
}
```

##### HTML

```html
<dl>



  <dt>Timothy</dt>
  <dd>15</dd>



  <dt>Juan</dt>
  <dd>51</dd>

</dl>
```

### `<%_` "空白符移除" 代码片段

该标签也表示一个代码片段，但是它会移除代码片段之前的所有空白符。

#### 示例

##### EJS 模板

```html
<ul>
  <% users.forEach(function(user, i, arr){ -%>
    <li><%= user %></li>
  <% }); -%>
</ul>

<ul>
  <%_ users.forEach(function(user, i, arr){ -%>
    <li><%= user %></li>
  <%_ }); -%>
</ul>
```

##### HTML 结构

```html
<ul>
      <li>Anne</li>
      <li>Bob</li>
  </ul>

<ul>
    <li>Anne</li>
    <li>Bob</li>
</ul>
```

闭合标签
-----------

结束标签有三种风格：标准、移除换行符和移除后边所有空白符。

### `%>`: 标准闭合标签

如前面所有的示例中的 `%>`，它是 EJS 表达式中的标准结束标签。

### `-%>`: 移除换行符的结束标签

`-%>` 会移除那些由脚本段或者注释引起的换行，不会对输出标签产生影响。

#### 示例

##### EJS 模板

```html
Beginning of template
<%  'this is a statement'
 + ' that is long'
 + ' and long'
 + ' and long' %>
End of template
---
Beginning of template
<%  'this is a statement'
 + ' that is long'
 + ' and long'
 + ' and long' -%>
End of template
```

##### 输出

```html
Beginning of template

End of template
---
Beginning of template
End of template
```

### `_%>`: 移除空白符的结束标签

`_%>` 会删除紧随其后的空白符。

字面量标签
------------

要输出字面量 `<%` 或 `%>`，可以对应的使用 `<%%` 或 `%%>`。如果使用了自定义的界限符，则使用修改后的语法。例如将界限符修改为 `$`，则使用 `<$$` 来输出 `<$`。

相比于其他的标签，字面量标签的特殊之处在于，它们不需要有结束标签就能起作用。

然而，在使用这些标签之前，你还需要三思，因为 `<` 和 `>` 字符可能会被转义为对应的 `&lt;` 和 `&gt;`。

#### 示例

以下示例将 `<%` 和 `%>` 包裹在 HTML 的预格式化标签 `<pre>` 之中，这样 `<` 或 `>` 就不会被转义。

##### EJS 模板

```html
<pre>This is literal: <%%</pre>
<pre>This is literal too: <%% %></pre>
<pre>This is literal as well: %%></pre>
```

##### HTML 结果

```html
<pre>This is literal: <%</pre>
<pre>This is literal too: <% %></pre>
<pre>This is literal as well: %></pre>
```

包含其他文件
---

EJS 提供两方式来包含其他文件。你甚至还可包含哪些非 EJS 模板文件，比如 CSS 样式。

在两种方式中，如果指定的文件没有后缀名，EJS 将会自动添加 `.ejs`。如果是绝对路径则会直接包含指定文件，否则 EJS 认为该文件与父模板同在一个目录。

解析包含文件的行为可以使用 `ejs.resolveInclude` 函数来覆写。

### “Preprocessor” 指令

作为 EJS 1.x 版本的兼容层，它可能会在一个非转义输出标签内使用 `include` 直接重另一个文件中能 “复制 (yank)” 文本，就像包含 C 语言头文件那样。由于它简单的包含操作，你无法向包含的模板传递参数。但你仍然可以让父模板的变量可用，同时在子模板中可见。

这种风格的 `include` 是 **静态的 (static)**，这意味着结果函数包含了被包含文件编译后的一个副本，所以如果在编译之后修改了文件，你的修改是不会重新映射的。

#### 空白符控制

在 `include` 最好不要用 `-%>` 闭合标签，因为它会移除紧随被包含文件之后的空白符。

#### 示例

##### included.ejs

```html
<li><%= pet.name %></li>
```

##### main.ejs

```html
<ul>
<% pets.forEach(function (pet) { -%>
  <% include included %>
<% }) -%>
</ul>
```

##### 局部变量

```json
{
  "pets": [
    {
      "name": "Hazel"
    }
  , {
      "name": "Crystal"
    }
  , {
      "name": "Catcher"
    }
  ]
}
```

##### “Preprocessor" 输出

```js
<ul>
<% pets.forEach(function (pet) { -%>
  <li><%= pet.name %></li>
<% }) -%>
</ul>
```

##### HTML 结构

```html
<ul>
  <li>Hazel</li>
  <li>Crystal</li>
  <li>Catcher</li>
</ul>
```

### JavaScript `include()` 函数

随着 EJS 2.x 版本的发布，我也添加一个更加直观的新方法来包含文件。现在你可以在模板是使用 `include()` 函数了，语法如下：

```js
include(filename, [局部变量])
```

与之前讲述的方法的主要不同点是，父函数中变量在子模板中是不可见，除非明确地 `局部变量 (locals)` 中进行声明，或者作为局部变量传给父模板。

同时，在脚本执行的同时，被包含文件也会一起编译，这意味着包含文件的方式相比于“preprocessor”的方式在理论上性能要差一点。但在实际实用上，缓存可以将这样差异忽略掉。

如果被包含的文件名实在渲染的时候才从用户输入获取的，则需要一些 **必须** 注意警告，例如某人可以容易地通过类似于 `/etc/passwd` 或 `../api-keys` 的文件名来使用私钥。

#### 示例

以下示例与 `include` 指令的示例效果一致。

##### included.ejs

```html
<li><%= pet.name %></li>
```

##### main.ejs

```html
<ul>
<%  pets.forEach(function (pet) { -%>
  <%- include('included', {
        pet: pet
      }) %>
<%  }) -%>
</ul>
```

##### 局部变量

```json
{
  "pets": [
    {
      "name": "Hazel"
    }
  , {
      "name": "Crystal"
    }
  , {
      "name": "Catcher"
    }
  ]
}
```

##### HTML 结构

```html
<ul>
  <li>Hazel</li>
  <li>Crystal</li>
  <li>Catcher</li>
</ul>
```

版权
---

本文档由 [GHLandy](https://github.com/GHLandy) 翻译。

This document is under the following license:

Copyright © 2015 Tiancheng “Timothy” Gu

Licensed under the Apache License, Version 2.0 (the “License”); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an “AS IS” BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
