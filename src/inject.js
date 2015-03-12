(function () {
    /* Build the url for each injection element to get the source's html. */
    var getApiUrl = (function () {
        var protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        var baseUrl = '//query.yahooapis.com/v1/public/yql?q=';
        var yql = encodeURIComponent('select * from html where url = ');
        return function (queryUrl) {
            /* The single quote isn't encoded correctly, so the safe encoded value is hard coded. */
            return protocol + baseUrl + yql + '%27' + encodeURIComponent(queryUrl) + '%27';
        };
    })();
    
    /* Get the browser's xml parser. */
    var getXmlParser = (function() {
        if (typeof window.DOMParser !== 'undefined') {
            return function (xml) {
                return (new window.DOMParser()).parseFromString(xml, 'text/xml');
            };
        } else if (typeof window.ActiveXObject !== 'undefined' && new window.ActiveXObject('Microsoft.XMLDOM')) {
            return function (xml) {
                var xmlDoc = new window.ActiveXObject('Microsoft.XMLDOM');
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
    
    var getXhr = (function () {
            var xmlRequest = null;
            
            if (typeof window.XMLHttpRequest !== 'undefined') {
                xmlRequest = function () {
                    return new XMLHttpRequest();
                };
            }
            else if (typeof window.ActiveXObject !== 'undefined' && new window.ActiveXObject('Microsoft.XMLHTTP')) {
                xmlRequest = function () {
                    return new window.ActiveXObject('Microsoft.XMLHTTP');
                };
            }
            else {
                console.log('inject - no xml request object found.');
            }

            return xmlRequest;
        })();
    
    var xhrStateChange = function (xhr, callback) {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                callback(xhr.responseText);
            }
            else {
                console.log('inject - expected status 200 but received status: ' + xhr.status);
            }
        }
    };
    
    /* Use the browser's xml request object to get the source's html. */
    var getXml = function (url, callback) {
        var xhr = getXhr();
        if (xhr !== null) {
            xhr.open('GET', url, true);
            xhr.onreadystatechange = function () { xhrStateChange(xhr, callback); };
            
            try {
                xhr.send(null);
            } catch (ex) {
                console.log('inject - error sending the request for the page\'s content.');
                console.log(ex);
            }
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
    
    var injectResponse = function (response, injectee, queryUrl) {
        var parser = getXmlParser(response);
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
                injectee.innerHTML = body.innerHTML;
            } else {
                console.log('inject - no body tag found for the url: ' + queryUrl);
            }
        }
    };
    
    var injectSrcAttr = 'data-inject-src';
    
    var injectXML = function (injectee) {
        var queryUrl = injectee.getAttribute(injectSrcAttr);
        /* Get the source's html, and inject it into the element that requested it. */
        getXml(getApiUrl(queryUrl), function (response) { injectResponse(response, injectee, queryUrl); });
    };
    
    window.setTimeout(function () {
        /* Get all elements marked with the inject attribute, and inject them with the requested source. */
        var injectees = elementSelector(injectSrcAttr);
        for (var i = 0, n = injectees.length; i < n; i++) {
            injectXML(injectees[i]);
        }
    }, 0);
})();