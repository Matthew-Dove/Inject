# Inject.js

### What is it?
A javascript file that will pull html from other webpages, and inject into your document, similar to an iframe.

### When do I use this?
If you want control over the html being imported into your webpage, iframes don't play nicely with the parent's css and javascript.
For example you can use your own javascript or css to target the injected html which is otherwise hard if you don't have access to the request html's source.

### Remarks
Under the hood inject uses [YQL](https://developer.yahoo.com/yql/) to get the request page's html, and any style or script tags from the source are stripped out before being injected into your page.
This means it's the caller's responsibility to add css etc for the page's layout (if desired).

### Show me the code!
```html
<div data-inject-src="http://info.cern.ch/" style="height: 175px;"> </div>
```

When the attribute **data-inject-src** is put on any element, inject will download the url specified in the value, and will dump the content between the opening, and closing body tags.

This software is released under the [MIT License](http://opensource.org/licenses/MIT).