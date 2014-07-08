
// Change to current working folder
var fs = require('fs');
var currentFile = require('system').args[3];
var curFilePath = fs.absolute(currentFile).split('/');
if (curFilePath.length > 1) {
	curFilePath.pop();
	fs.changeWorkingDirectory(curFilePath.join('/'));
}

// Set up variables
var beef = null;
var casper = require('casper').create({
	clientScripts: ['sha1.js', 'uglify.js', 'reflector.js', 'ast.js'],
	verbose: true,
	logLevel: 'debug'
});
var utils = require('utils');

// Visit the hook demo page and collect default object fingerprint
casper.start('http://127.0.0.1:3000/demos/basic.html', function() {
	this.wait(2000, function() {
		beef = this.evaluate(function() {
			var data = [];
			var beefKey = 'beef';
			var r = new Reflector(window[beefKey]);
			r.getOwnMethodsRecursively(window[beefKey], data);
			var ast = new ASTFingerprint(data);
			return { 'version': window[beefKey].version, 'fp': ast.getMethodFingerprints() };
		});
		utils.dump(beef);
		fs.write('fingerprints/' + beef.version + '.json', JSON.stringify(beef.fp), 'w');
	});
});

casper.run();
