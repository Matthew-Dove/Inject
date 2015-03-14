(function () {
    /* Add text/html support for browsers that don't have it on the DOMParser object. */
    if (typeof DOMParser !== 'undefined') {
        (function (DOMParser) {
            var DOMParser_proto = DOMParser.prototype
            var real_parseFromString = DOMParser_proto.parseFromString;
            
            try {
                if ((new DOMParser).parseFromString('', 'text/html')) {
                    return;
                }
            } catch (e) { }
            
            DOMParser_proto.parseFromString = function (markup, type) {
                if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
                    var doc = document.implementation.createHTMLDocument('');
                    if (markup.toLowerCase().indexOf('<!doctype') > -1) {
                        doc.documentElement.innerHTML = markup;
                    }
                    else {
                        doc.body.innerHTML = markup;
                    }
                    return doc;
                } else {
                    return real_parseFromString.apply(this, arguments);
                }
            };
        }(DOMParser));
    }
    
    /* Build the url for each injection element to get the source's html. */
    var createApiUrl = (function () {
        var protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        var baseUrl = '//query.yahooapis.com/v1/public/yql?q=';
        var yql = encodeURIComponent('select * from html where url = ');

        return function (queryUrl) {
            /* The single quote isn't encoded correctly, so the safe encoded value is hard coded. */
            return protocol + baseUrl + yql + '%27' + encodeURIComponent(queryUrl) + '%27';
        };
    })();
    
    /* Get the browser's HTML parser. */
    var createHtmlParser = (function () {
        if (typeof window.DOMParser !== 'undefined') {
            return function (xml) {
                return (new DOMParser()).parseFromString(xml, 'text/html');
            };
        } else if (typeof ActiveXObject !== 'undefined' && new ActiveXObject('Microsoft.XMLDOM')) {
            return function (xml) {
                var xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
                xmlDoc.async = 'false';
                xmlDoc.loadXML(xml);
                return xmlDoc;
            };
        } else {
            console.log('inject - no xml parser found.');
            return function (xml) {
                return null;
            };
        }
    })();
    
    var createXhr = (function () {
        var xmlRequest = null;
        
        function isCorsEnabled() {
            var xhr = new XMLHttpRequest();
            return 'withCredentials' in xhr;
        }
        
        if (typeof XMLHttpRequest !== 'undefined' && isCorsEnabled()) {
            xmlRequest = function () {
                return new XMLHttpRequest();
            };
        }
        else if (typeof XDomainRequest !== 'undefined') {
            xmlRequest = function () {
                return new XDomainRequest();
            };
        }
        else {
            console.log('inject - cors isn\'t supported.');
        }
        
        return xmlRequest;
    })();
    
    var xhrStateChange = function (xhr, callback) {
        console.log(xhr.readyState);
        if (xhr.readyState === 4) {
            callback(xhr.responseText);
        }
    };
    
    /* Use the browser's xml request object to get the source's html. */
    var getHtml = function (url, callback) {
        var xhr = createXhr();
        if (xhr !== null) {
            xhr.open('GET', url, true);
            xhr.onerror = function () { console.log('inject - error making a request for a source\'s HTML.'); };
            xhr.onload = function () { callback(xhr.responseText); };
            xhr.send(null);
        }
    };
    
    /* The browser's way of selecting elements by their attributes. */
    var elementSelector = (function () {
        if (typeof document.querySelectorAll !== 'undefined') {
            return function (query) {
                return document.querySelectorAll('[' + query + ']');
            };
        } else {
            return function (query) {
                var matchingElements = [];
                var allElements = document.getElementsByTagName('*');
                for (var i = 0, n = allElements.length; i < n; i++) {
                    if (allElements[i].getAttribute(query) !== null) {
                        matchingElements.push(allElements[i]);
                    }
                }
                return matchingElements;
            };
        }
    }());
    
    var removeNodes = function (garbage, name) {
        var foundGarbage = document.body.getElementsByTagName(name);
        
        for (var i = 0, n = foundGarbage.length; i < n; i++) {
            garbage.push(foundGarbage[i]);
        }
        
        return garbage;
    };
    
    /* Remove unwanted nodes, and put the rest as HTML into the element that requested the HTML injection. */
    var injectResponse = function (response, injectee) {
        var parser = createHtmlParser(response);
        if (parser !== null) {
            var bodyMatch = parser.getElementsByTagName('body');
            if (bodyMatch.length === 1) {
                var body = bodyMatch[0];
                var garbage = [];
                
                garbage = removeNodes(garbage, 'script');
                garbage = removeNodes(garbage, 'style');
                
                /* Remove any nodes we won't want injected. */
                for (var i = 0, n = garbage.length; i < n; i++) {
                    garbage[i].parentNode.removeChild(garbage[i]);
                }
                
                /* Inject the html. */
                injectee.innerHTML = typeof body.innerHTML === 'undefined' ? body.xml : body.innerHTML;
            } else {
                console.log('inject - no body tag found.');
            }
        }
    };
    
    /* The attribue to look for when finding elements taht require injection. */
    var injectSrcAttr = 'data-inject-src';
    
    /* Get the source's html, and inject it into the element that requested it. */
    var injectHtml = function (injectee) {
        var queryUrl = injectee.getAttribute(injectSrcAttr);
        getHtml(createApiUrl(queryUrl), function (response) { injectResponse(response, injectee); });
    };
    
    setTimeout(function () {
        /* Get all elements marked with the inject attribute, and inject them with the requested source. */
        var injectees = elementSelector(injectSrcAttr);
        for (var i = 0, n = injectees.length; i < n; i++) {
            injectHtml(injectees[i]);
        }
    }, 0);
})();