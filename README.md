# Inject.js

### What is it?
A javascript file that will pull html from other webpages, and inject into your document, similar to an iframe.

### When do I use this?
If you want control over the html being imported into your webpage, iframes don't play nicely with the parent's css and javascript.
For example you can use your own javascript or css to target the injected html which is otherwise hard if you don't have access to the request html's source.

### Remarks
Under the hood inject uses [YQL](https://developer.yahoo.com/yql/) to get the request page's html, and any style or script tags from the source are stripped out before being injected into your page.
This means it's the caller's responsibility to add css etc for the page's layout (if desired).
The same-origin policy is circumvented by using Yahoo! as a proxy, so you can do more then AJAX can, and by extension [jQuery's .load()](https://api.jquery.com/load/) which are limited by having extra security.

### Show me the code!
```html
<div data-inject-src="{example.com}" style="height: {expected height}px;"> </div>
```
[Example](https://rawgit.com/Matthew-Dove/Inject/master/src/example.html)

When the attribute **data-inject-src** is put on any element, inject will download the url specified in the value, and will dump the content between the opening, and closing body tags.
The inline height style can be omitted, but it's recommended so the layout of the page doesn't change once the external html is injected.
If the element doesn't take the full screen width, then adding a width to the element is also recommended. Of course the height and width could be defined in a css class.

### Warning
In general you should trust the source that your loading from. While script, and styles tags are removed, inline script (such as onlick events) and styles remain.
The scripts tags aren't removed to prevent [XSS](https://www.owasp.org/index.php/Cross-site_Scripting_%28XSS%29), rather they're removed because the framework doesn't support them.

### Alternative frameworks

* [html-imports-content](https://github.com/adjohnson916/html-imports-content) - Enables simple client-side page composition.

This software is released under the [MIT License](http://opensource.org/licenses/MIT).