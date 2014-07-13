
var Reflector = function(obj) {
	this.maxDepth = 4;
	this.maxMethods = 500;

	this.typeOf = function(value) {
		var s = typeof value;
		if (s === 'object') {
			if (value) {
				if (Object.prototype.toString.call(value) == '[object Array]') {
					s = 'array';
				}
			} else {
				s = 'null';
			}
		}
		return s;
	};

	this.getProperties = function() {
		var properties = [];
		for (var prop in obj) {
			if (typeof obj[prop] != 'function') {
				properties.push(prop);
			}
		}
		return properties;
	};

	this.getObjectProperties = function() {
		var properties = [];
		for (var prop in obj) {
			if (typeof obj[prop] != 'function'
				&& this.typeOf(obj[prop]) == 'object')
			{
				properties.push(prop);
			}
		}
		return properties;
	};

	this.getAllMethods = function() {
		var methods = [];
		for (var method in obj) {
			if (typeof obj[method] == 'function') {
				methods.push(method);
			}
		}
		return methods;
	};

	this.getOwnMethods = function() {
		var methods = [];
		for (var method in obj) {
			if (typeof obj[method] == 'function' && obj.hasOwnProperty(method)) {
				methods.push(method);
			}
		}
		return methods;
	};

	this.getOwnMethodsRecursively = function(obj, data, level) {
		level = typeof level !== 'undefined' ? level : 1;
		if (level > this.maxDepth) return;
		for (var method in obj) {
			if (obj.hasOwnProperty(method)) {
				try {
					if (typeof obj[method] == 'function') {
						data.push(this.extractMethodSource(obj[method]));
					} else if (this.typeOf(obj[method]) == 'object') {
						this.getOwnMethodsRecursively(obj[method], data, level + 1)
					}
				} catch (err) {
					console.log(err);
				}
			}
		}
	};

	this.extractMethodSource = function(method) {
		if (method.toString === Function.prototype.toString) {
			return method.toString();
		} else {
			return 'function () { [non-native code] }';
		}
	}

	this.getReflection = function() {
		var r = {};
		var methods = this.getOwnMethods();

		r.numProps = this.getProperties().length;
		r.numObjProps = this.getObjectProperties().length;
		r.numMethods = methods.length;
		r.methods = {};
		for (i = 0; i < methods.length; i++) {
			r.methods[methods[i]] = obj[methods[i]].toString();
		}

		return r;
	};
}
