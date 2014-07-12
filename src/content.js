// Copyright (c) 2014 Maxim Chernyshev. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Inject window script(s)
function injectScript(src, inline) {
	inline = typeof a !== 'undefined' ? inline : false;
	var js = document.createElement('script');
	js.type = 'text/javascript';
	if (inline) {
		js.textContent = src;
	} else {
		js.src = chrome.extension.getURL(src);
	}
	document.documentElement.appendChild(js);
}

injectScript('reflector.js');
injectScript('window.js');

//var response = "importScripts('" + chrome.extension.getURL('reflector.js') + "'); self.onmessage=function(e){postMessage('Worker: '+e.data);}";
//var blob = new Blob([response], {type: 'application/javascript'});
//var worker = new Worker(URL.createObjectURL(blob));

// Global comms port and event listener
var port = chrome.runtime.connect({ name: 'content' });
document.addEventListener('{event_name}', function(e) {
	if (typeof e.detail == 'undefined' || typeof e.detail.action == 'undefined') {
		return;
	}
	port.postMessage(e.detail);
});
