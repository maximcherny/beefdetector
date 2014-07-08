
// Change to current working folder
var fs = require('fs');

// Set up variables
var data = {};
var shared = {};
var processed = {};

// Iterate through fingerprints and combine
var files = fs.readdirSync(__dirname + '/fingerprints/');
for (var i in files) {
	var version = files[i].replace('.json', '').replace('-alpha', '');
	data[version] = require(__dirname + '/fingerprints/' + files[i]);
}

// Process the combined fingerprints object to extract shared items
function avg(data) {
	var sum = 0;
	for (var i = 0; i < data.length; i++) {
		sum += parseInt(data[i], 10);
	}
	return sum / data.length;
}

function isCommonHash(hash, data) {
	for (version in data) {
		if (typeof data[version][hash] == 'undefined') return false;
	}
	return true;
}

for (version in data) {
	console.log('Extracting common hashes from', version);
	console.log('    method count:', Object.keys(data[version]).length);
	for (hash in data[version]) {
		if (isCommonHash(hash, data)) {
			if (typeof shared[hash] == 'undefined') shared[hash] = [];
			shared[hash].push(data[version][hash]);
		}
	}
};

for (version in data) {
	for (hash in shared) {
		if (typeof data[version][hash] != 'undefined')
			delete data[version][hash];
	}
}

for (hash in shared) {
	shared[hash] = avg(shared[hash]);
}

console.log('Common hash count:', Object.keys(shared).length);
processed.shared = shared;
for (version in data) {
	processed[version] = data[version];
}

var outputFilename = __dirname + '/beef.json';
fs.writeFile(outputFilename, JSON.stringify(processed, null, 2), function(err) {
	if (err) {
		console.log(err);
	} else {
		console.log('Processed fingerprint saved to', outputFilename);
	}
});

