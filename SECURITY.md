# Security Policy
This document outlines security procedures and general policies for the EJS template engine project

## Supported Versions

The current supported version.

| Version | Supported          |
| ------- | ------------------ |
| 3.x.x   | :white_check_mark: |

## Reporting a Vulnerability
The EJS team and community take all security bugs in EJS seriously. 
We appreciate your efforts and responsible disclosure and will make every effort to acknowledge your contributions.

Report security bugs by emailing the lead maintainer in the Readme.md file.
To ensure the timely response to your report, please ensure that the entirety of the report is contained within the email body and not solely behind a web link or an attachment.

The EJS team will then evaluate your report and will reply with the next steps in handling your report and may ask for additional information or guidance.

## Out-of-Scope Vulnerabilities
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
