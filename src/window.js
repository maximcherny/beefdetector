
// Ensure that function source is available
Object.freeze(Function.prototype);

// Hijack property access calls to detect fingerprinting activity
window.WebKitProps = [];

function emitEvent(detail) {
	var e = document.createEvent('CustomEvent');
	e.initCustomEvent('{event_name}', false, false, detail);
	document.dispatchEvent(e);
}

function emitPropertyAccessEvent(prop) {
	emitEvent({ action: 'propertyAccess', prop: prop });
}

window.WebKitNavigator = {};
for (var prop in window.navigator) {
	if (window.navigator.hasOwnProperty(prop))
		window.WebKitNavigator[prop] = window.navigator[prop];
}

window.WebKitScreen = {};
for (var prop in window.screen) {
	if (window.screen.hasOwnProperty(prop))
		window.WebKitScreen[prop] = window.screen[prop];
}

window.__defineGetter__('opera', function() {
	emitPropertyAccessEvent('opera');
	return;
});

window.__defineGetter__('XDomainRequest', function() {
	emitPropertyAccessEvent('XDomainRequest');
	return;
});

window.__defineGetter__('globalStorage', function() {
	emitPropertyAccessEvent('globalStorage');
	return;
});

window.__defineGetter__('multitouchData', function() {
	emitPropertyAccessEvent('multitouchData');
	return;
});

window.__defineGetter__('webkitPerformance', function() {
	emitPropertyAccessEvent('webkitPerformance');
	return;
});

window.navigator.__defineGetter__('userAgent', function() {
	emitPropertyAccessEvent('navigator.userAgent');
	return window.WebKitNavigator.userAgent;
});

window.navigator.__defineGetter__('appVersion', function() {
	emitPropertyAccessEvent('navigator.appVersion');
	return window.WebKitNavigator.appVersion;
});

window.navigator.__defineGetter__('appName', function() {
	emitPropertyAccessEvent('navigator.appName');
	return window.WebKitNavigator.appName;
});

window.navigator.__defineGetter__('platform', function() {
	emitPropertyAccessEvent('navigator.platform');
	return window.WebKitNavigator.platform;
});

window.navigator.__defineGetter__('cpuClass', function() {
	emitPropertyAccessEvent('navigator.cpuClass');
	return window.WebKitNavigator.cpuClass;
});

window.navigator.__defineGetter__('plugins', function() {
	emitPropertyAccessEvent('navigator.plugins');
	return window.WebKitNavigator.plugins;
});

window.navigator.__defineGetter__('mimeTypes', function() {
	emitPropertyAccessEvent('navigator.mimeTypes');
	return window.WebKitNavigator.mimeTypes;
});

window.navigator.__defineGetter__('language', function() {
	emitPropertyAccessEvent('navigator.language');
	return window.WebKitNavigator.language;
});

window.navigator.__defineGetter__('colorDepth', function() {
	emitPropertyAccessEvent('navigator.colorDepth');
	return window.WebKitNavigator.colorDepth;
});

window.navigator.__defineGetter__('msMaxTouchPoints', function() {
	emitPropertyAccessEvent('navigator.msMaxTouchPoints');
	return;
});

window.navigator.__defineGetter__('mozGetUserMedia', function() {
	emitPropertyAccessEvent('navigator.mozGetUserMedia');
	return;
});

window.screen.__defineGetter__('width', function() {
	emitPropertyAccessEvent('screen.width');
	return window.WebKitScreen.width;
});

window.screen.__defineGetter__('height', function() {
	emitPropertyAccessEvent('screen.height');
	return window.WebKitScreen.height;
});

window.screen.__defineGetter__('colorDepth', function() {
	emitPropertyAccessEvent('screen.colorDepth');
	return window.WebKitScreen.colorDepth;
});

// Hijack web sockets
window.WebSocket = function(oldWebSocket) {
	return function WebSocket(url) {
		this.prototype = new oldWebSocket(url);
		this.__proto__ = this.prototype;
		var wrapper = this;

		this.onmessage = function(data) {
			// TODO: emit event
			wrapper.customOnMessage(data);
		};

		this.__defineSetter__('onmessage', function(val) {
			wrapper.customOnMessage = val;
		});

		this.send = function(message) {
			// TODO: emit event
			try {
				this.prototype.send(message);
			} catch(err) {
				//
			}
		};
	};
}(window.WebSocket);

// Hijack XMLHttpRequest
(function(open) {
	XMLHttpRequest.prototype.open = function(method, url, async) {
		// TODO: emit event
		open.call(this, method, url, async);
	};
})(XMLHttpRequest.prototype.open);

(function(send) {
	XMLHttpRequest.prototype.send = function(data) {
		// TODO: emit event
		send.call(this, data);
	};
})(XMLHttpRequest.prototype.send);

// Cache existing keys and poll for new global vars
for (var prop in window) {
	window.WebKitProps.push(prop);
}

setInterval(function() {
	for (var prop in window) {
		if (window.WebKitProps.indexOf(prop) != -1) {
			continue;
		}
		var data = [];
		var r = new Reflector(window[prop]);
		r.getOwnMethodsRecursively(window[prop], data);
		window.WebKitProps.push(prop);
		if (data.length > 0) {
			console.log('New object with methods detected: ', prop, data.length);
			emitEvent({
				action: 'newGlobalVar',
				prop: prop,
				data: data
			});
		}
	}
}, 1000);
