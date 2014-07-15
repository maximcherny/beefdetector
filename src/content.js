
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

// Inject window script(s)
injectScript('reflector.js');
injectScript('window.js');

// Global comms port and event listener
var port = chrome.runtime.connect({ name: 'content' });
document.addEventListener('{event_name}', function(e) {
	if (typeof e.detail == 'undefined' || typeof e.detail.action == 'undefined') {
		return;
	}
	port.postMessage(e.detail);
});

// Inform that the content script has been injected
port.postMessage({ action: 'contentInit' });
