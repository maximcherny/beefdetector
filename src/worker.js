importScripts('sha1.js', 'ast.js' , 'uglify.js');

var fp;

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

getRequest('beef.json', function(xhr) {
	fp = JSON.parse(xhr.responseText);
});

self.addEventListener('message', function(e) {
	var ast = new ASTFingerprint(e.data.data);
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

	self.postMessage({
		tabId: e.data.tabId,
		prop: e.data.prop,
		match: matches / maxMatches,
		result: 'Fingerprinted!'
	});
}, false);
