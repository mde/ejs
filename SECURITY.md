# Security Policy
This document outlines security procedures and general policies for the EJS template engine project

## Supported Versions

Security fixes are released for the current major version. Older major
versions do not receive backported fixes.

## Reporting a Vulnerability
The EJS team and community take all security bugs in EJS seriously. 
We appreciate your efforts and responsible disclosure and will make every effort to acknowledge your contributions.

Report security bugs by emailing the lead maintainer in the Readme.md file.
To ensure the timely response to your report, please ensure that the entirety of the report is contained within the email body and not solely behind a web link or an attachment.

The EJS team will then evaluate your report and will reply with the next steps in handling your report and may ask for additional information or guidance.

## Out-of-Scope Vulnerabilities

### Templates you do not control
If you give end-users unfettered access to the EJS render method, you are using EJS in an inherently un-secure way. Please do not report security issues that stem from doing that.

EJS is effectively a JavaScript runtime. Its entire job is to execute JavaScript. If you run the EJS render method without checking the inputs yourself, you are responsible for the results.

In short, DO NOT send reports including this snippet of code:

```javascript
const express = require('express');
const app = express();
const PORT = 3000;
app.set('views', __dirname);
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index', req.query);
});

app.listen(PORT, ()=> {
    console.log(`Server is running on ${PORT}`);
});
```

### Escaping that does not match the output context
`<%= %>` escapes for HTML content and quoted attribute values. It is not a
general-purpose escaper, and EJS does not know where its output will be used.

If a value escaped with `<%= %>` breaks out of some other context (a `<script>`
block, a JavaScript template literal, CSS, SQL, a shell command), the template
chose the wrong escaper. That is not a defect in EJS.

We will not be adding characters to the default escape set to cover these cases.
It would corrupt output for everyone using EJS to generate anything other than
HTML, and it would not fix the underlying mistake. No escaper makes
`var n = <%= n %>` safe.

Use the `escape` option to supply escaping that fits your output. See [Escaping
and output
context](https://github.com/mde/ejs/blob/main/README.md#escaping-and-output-context)
in the README.
