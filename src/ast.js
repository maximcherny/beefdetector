
// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};

var ASTFingerprint = function(methods) {
	this.getMethodFingerprint = function(method) {
		var nodeTypes = [];
		var compressor = UglifyJS.Compressor();
		try {
			var ast = UglifyJS.parse('var __code__ = ' + method.toString());
			ast.figure_out_scope();
			ast = ast.transform(compressor);
			ast.figure_out_scope();
			ast.compute_char_frequency();
			ast.mangle_names();
			ast.walk(new UglifyJS.TreeWalker(function(node, descend) {
				nodeTypes.push(node.__proto__.TYPE);
			}));
			nodeTypes.remove(0, 3);
			var shaObj = new jsSHA(nodeTypes.join(''), "TEXT");
			return shaObj.getHash("SHA-1", "HEX");
		} catch (err) {
			console.log(err);
			return null;
		}
	};

	this.getMethodFingerprints = function() {
		var fps = {};
		for (i = 0; i < methods.length; i++) {
			var fp = this.getMethodFingerprint(methods[i]);
			if (typeof fps[fp] == 'undefined') fps[fp] = 0;
			fps[fp]++;
		}
		return fps;
	};
}
