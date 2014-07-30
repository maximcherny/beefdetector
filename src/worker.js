importScripts('sha1.js', 'ast.js' , 'uglify.js');

function getRequest(url, callback, async) {
	async = typeof async !== 'undefined' ? async : false;

	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState < 4) {
			return;
		}
		if (xhr.status !== 200) {
			return;
		}
		if (xhr.readyState === 4) {
			callback(xhr);
		}
	}

	xhr.open('GET', url, async);
	xhr.send('');
}

function getObjectFingerprintMatch(data) {
	var fp;

	getRequest('beef.json', function(xhr) {
		fp = JSON.parse(xhr.responseText);
	});

	var ast = new ASTFingerprint(data.msg.data);
	var tmp = ast.getMethodFingerprints();
	var matches = 0;
	var maxMatches = Object.keys(fp.shared).length;

	for (hash in tmp) {
		if (hash === null) {
			continue;
		}
		if (typeof fp.shared[hash] != 'undefined') {
			matches++;
		}
	}

	return {
		tabId: data.tabId,
		action: data.msg.action,
		prop: data.msg.prop,
		match: matches / maxMatches
	}
}

function analyzeWebSocketTraffic(data) {
	if (typeof data.state.urls[data.msg.url] == 'undefined') {
		data.state.urls[data.msg.url] = {
			total: 0,
			send: 0,
			sendStats: null,
			timestamps: [],
			heartbeat: false,
			onmessage: 0,
			jsPayload: false
		};
	}

	data.state.urls[data.msg.url][data.msg.prop]++;
	data.state.urls[data.msg.url].total++;
	data.state.count++;

	if (data.msg.prop == 'onmessage') {
		try {
			var ast = UglifyJS.parse(data.msg.data);
			if (typeof ast == 'object') {
				data.state.urls[data.msg.url].jsPayload = true;
				data.state.jsPayload = true;
			}
		} catch (e) {
			//
		}
	} else {
		data.state.urls[data.msg.url].timestamps.push(data.msg.timestamp);
		if (data.state.urls[data.msg.url].timestamps.length >= 10) {
			data.state.urls[data.msg.url].timestamps = data.state.urls[data.msg.url].timestamps.slice(1, 10);
		}
		data.state.urls[data.msg.url].sendStats = getTimingStats(data.state.urls[data.msg.url].timestamps);
		if (data.state.urls[data.msg.url].sendStats != null && data.state.urls[data.msg.url].sendStats.stdDev < 50) {
			data.state.urls[data.msg.url].heartbeat = true;
			data.state.heartbeat = true;
		}
	}

	return {
		tabId: data.tabId,
		action: data.msg.action,
		state: data.state
	};
}

// Based on: https://www.inkling.com/read/javascript-definitive-guide-david-flanagan-6th/chapter-8/functional-programming
function getTimingStats(timestamps) {
	if (timestamps.length < 2) return;

	var sum = function(x, y) { return x + y; };
	var square = function(x) { return x * x; };
	var data = [];

	for (var i = 0; i < timestamps.length; i++) {
		if (typeof timestamps[i + 1] == 'undefined') {
			continue;
		}
		var next = timestamps[i + 1];
		data.push(next - timestamps[i]);
	}

	var mean = data.reduce(sum) / data.length;
	var deviations = data.map(function(x) { return x - mean; });
	var stdDev = Math.sqrt(deviations.map(square).reduce(sum) / (data.length-1));

	return {
		mean: mean,
		stdDev: stdDev
	}
}

self.addEventListener('message', function(e) {
	if (typeof e.data.msg == 'undefined'
		|| typeof e.data.tabId == 'undefined'
		|| typeof e.data.msg.action == 'undefined') {
		return;
	}

	switch (e.data.msg.action) {
		case 'newGlobalVar':
			self.postMessage(getObjectFingerprintMatch(e.data));
			break;
		case 'webSocket':
			self.postMessage(analyzeWebSocketTraffic(e.data));
			break;
	}
}, false);
