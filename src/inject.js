(function () {
	window.setTimeout(function () {
		var injectSrcAttr = 'data-inject-src';
		
		/* Build the url for each injection element to get the source's html. */
		var getApiUrl = (function (protocol, baseUrl, yql) {
			return function (queryUrl) {
				return protocol + baseUrl + yql + '%27' + encodeURIComponent(queryUrl) + '%27'; /* The single quote isn't encoded correctly, so the safe encoded value is hard coded. */
			};
		})(window.location.protocol === 'https:' ? 'https:' : 'http:', '//query.yahooapis.com/v1/public/yql?q=', encodeURIComponent('select * from html where url = '));
		
		/* Get the browser's xml parser. */
		function xmlParser(xml) {
			var parse;
			
			if (typeof window.DOMParser !== 'undefined') {
				parse = function (xml) {
					return (new window.DOMParser()).parseFromString(xml, 'text/xml');
				};
			}
			else if (typeof window.ActiveXObject !== 'undefined' && new window.ActiveXObject('Microsoft.XMLDOM')) {
				parseXml = function (xml) {
					var xmlDoc = new window.ActiveXObject('Microsoft.XMLDOM');
					xmlDoc.async = 'false';
					xmlDoc.loadXML(xml);
					return xmlDoc;
				};
			}
			else {
				console.log('inject - no xml parser found.');
				parse = function (xml) {
					return null;
				};
			}
			
			return parse(xml);
		}
		
		/* Use the browser's xml request object to get the source's html. */
		function getXml(url, callback) {
			function getXhr() {
				var xmlRequest = null;
				
				if (typeof window.XMLHttpRequest !== 'undefined') {
					xmlRequest = new XMLHttpRequest();
				}
				else if (typeof window.ActiveXObject !== 'undefined' && new ActiveXObject('Microsoft.XMLHTTP')) {
					xmlRequest = new ActiveXObject('Microsoft.XMLHTTP');
				}
				else {
					console.log('inject - no xml request object found.');
				}
				
				return xmlRequest;
			}
			
			function xhrStateChange(xhr, callback) {
				if (xhr.readyState == 4) {
					if (xhr.status == 200) {
						callback(xhr.responseText);
					}
					else {
						console.log('inject - expected status 200 but received status: ' + xhr.status);
					}
				}
			}
			
			var xhr = getXhr();
			if (xhr !== null) {
				xhr.open('GET', url, true);
				xhr.onreadystatechange = function () { xhrStateChange(xhr, callback); };
				
				try {
					xhr.send(null);
				} catch (ex) {
					console.log('inject - error sending the request for the page\'s content.');
					console.log(ex)
				}
			}
		}
		
		/* The browser's way of selecting elements by their attributes. */
		function elementSelector(query) {
			var selector;
			
			if (typeof document.querySelectorAll !== 'undefined') {
				selector = function (query) {
					return document.querySelectorAll('[' + query + ']');
				};
			}
			else {
				selector = function (query) {
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
			
			return selector(query);
		}
		
		/* Get all elements marked with the inject attribute, and inject them with the requested source. */
		var injectors = elementSelector(injectSrcAttr);
		for (var i = 0, n = injectors.length; i < n; i++) {
			(function (injector) {
				var queryUrl = injector.getAttribute(injectSrcAttr);
				
				/* Get the source's html, and inject it into the element that requested it. */
				getXml(getApiUrl(queryUrl), function (response) {
					var parser = xmlParser(response);
					
					if (parser !== null) {
					
						function removeNodes(garbage, name) {
							var foundGarbage = body.getElementsByTagName(name);
							
							for (var i = 0, n = foundGarbage.length; i < n; i++) {
								garbage.push(foundGarbage[i]);
							}
							
							return garbage;
						}
						
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
							injector.innerHTML = body.innerHTML;
						}
						else {
							console.log('inject - no body tag found for the url: ' + queryUrl);
						}
					}
				});
			})(injectors[i]);
		}
		
	}, 0);
})();