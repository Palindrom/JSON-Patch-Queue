module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };

/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};

/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};

/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

/**
 * JSON Patch Queue for synchronous operations, and asynchronous networking.
 * @param {JSON-Pointer} versionPath JSON-Pointers to version numbers
 * @param {function} apply    apply(JSONobj, JSONPatchSequence) function to apply JSONPatch to object.
 * @param {Boolean} [purist]       If set to true adds test operation before replace.
 * @version: 1.0.0
 */
var JSONPatchQueueSynchronous = function(versionPath, apply, purist){
	/**
	 * Queue of consecutive JSON Patch sequences. May contain gaps.
	 * Item with index 0 has 1 sequence version gap to `this.version`.
	 * @type {Array}
	 */
	this.waiting = [];
	/**
	 * JSON-Pointer to local version in shared JSON document
	 * @type {JSONPointer}
	 */
	this.versionPath = versionPath;
	/**
	 * Function to apply JSONPatchSequence to JSON object
	 * @type {Function}
	 */
	this.apply = apply;
	/**
	 * If set to true adds test operation before replace.
	 * @type {Bool}
	 */
	this.purist = purist;
};
/** JSON version */
JSONPatchQueueSynchronous.prototype.version = 0;
//JSONPatchQueueSynchronous.prototype.purist = false;
// instance property
//  JSONPatchQueueSynchronous.prototype.waiting = [];
/**
 * Process received versioned JSON Patch.
 * Applies or adds to queue.
 * @param  {Object} obj                   object to apply patches to
 * @param  {JSONPatch} versionedJsonPatch patch to be applied
 * @param  {Function} [applyCallback]     optional `function(object, consecutivePatch)` to be called when applied, if not given #apply will be called
 */
JSONPatchQueueSynchronous.prototype.receive = function(obj, versionedJsonPatch, applyCallback){
	var apply = applyCallback || this.apply,
		consecutivePatch = versionedJsonPatch.slice(0);
	// strip Versioned JSON Patch specyfiv operation objects from given sequence
		if(this.purist){
			var testRemote = consecutivePatch.shift();
		}
		var replaceVersion = consecutivePatch.shift(),
			newVersion = replaceVersion.value;

	// TODO: perform versionedPath validation if needed (tomalec)

	if( newVersion <= this.version){
	// someone is trying to change something that was already updated
    	throw new Error("Given version was already applied.");
	} else if ( newVersion == this.version + 1 ){
	// consecutive new version
		while( consecutivePatch ){// process consecutive patch(-es)
			this.version++;
			apply(obj, consecutivePatch);
			consecutivePatch = this.waiting.shift();
		}
	} else {
	// add sequence to queue in correct position.
		this.waiting[newVersion - this.version -2] = consecutivePatch;
	}
};
/**
 * Wraps JSON Patch sequence with version related operation objects
 * @param  {JSONPatch} sequence JSON Patch sequence to wrap
 * @return {VersionedJSONPatch}
 */
JSONPatchQueueSynchronous.prototype.send = function(sequence){
	this.version++;
	var newSequence = sequence.slice(0);
	newSequence.unshift({
		op: "replace",
		path: this.versionPath,
		value: this.version
	});
	if(this.purist){
		newSequence.unshift({ // test for purist
			op: "test",
			path: this.versionPath,
			value: this.version-1
		});
	}
	return newSequence;
};

JSONPatchQueueSynchronous.getPropertyByJsonPointer = function(obj, pointer) {
	var parts = pointer.split('/');
	if(parts[0] === "") {
		parts.shift();
	}
	var target = obj;
	while(parts.length) {
		var path = parts.shift().replace('~1', '/').replace('~0', '~');
		if(parts.length) {
			target = target[path];
		}
	}
	return target[path];
};

/**
 * Reset queue internals and object to new, given state
 * @param obj object to apply new state to
 * @param newState versioned object representing desired state along with versions
 */
JSONPatchQueueSynchronous.prototype.reset = function(obj, newState){
	this.version = JSONPatchQueueSynchronous.getPropertyByJsonPointer(newState, this.versionPath);
	this.waiting = [];
	var patch = [{ op: "replace", path: "", value: newState }];
	this.apply(obj, patch);
};

module.exports = JSONPatchQueueSynchronous;
module.exports.default = JSONPatchQueueSynchronous;


/***/ }),
/* 1 */
/***/ (function(module, exports) {

/**
 * JSON Patch Queue for asynchronous operations, and asynchronous networking.
 * @param {Array<JSON-Pointer>} versionPaths JSON-Pointers to version numbers [local, remote]
 * @param {function} apply    apply(JSONobj, JSONPatchSequence) function to apply JSONPatch to object.
 * @param {Boolean} [purist]       If set to true adds test operation before replace.
 * @version: 1.0.0
 */
var JSONPatchQueue = function(versionPaths, apply, purist){
	/**
	 * Queue of consecutive JSON Patch sequences. May contain gaps.
	 * Item with index 0 has 1 version gap to this.remoteVersion.
	 * @type {Array}
	 */
	this.waiting = [];
	/**
	 * JSON-Pointer to local version in shared JSON document
	 * @type {JSONPointer}
	 */
	this.localPath = versionPaths[0];
	/**
	 * JSON-Pointer to remote version in shared JSON document
	 * @type {JSONPointer}
	 */
	this.remotePath = versionPaths[1];
	/**
	 * Function to apply JSONPatchSequence to JSON object
	 * @type {Function}
	 */
	this.apply = apply;
	/**
	 * If set to true adds test operation before replace.
	 * @type {Bool}
	 */
	this.purist = purist;

};
/** local version */
JSONPatchQueue.prototype.localVersion = 0;
/** Latest localVersion that we know that was acknowledged by remote */
// JSONPatchQueue.prototype.ackVersion = 0;
/** Latest acknowledged remote version */
JSONPatchQueue.prototype.remoteVersion = 0;

// instance property
//  JSONPatchQueue.prototype.waiting = [];
/** needed? OT only? */
// JSONPatchQueue.prototype.pending = [];
/**
 * Process received versioned JSON Patch
 * Applies or adds to queue.
 * @param  {Object} obj                   object to apply patches to
 * @param  {JSONPatch} versionedJsonPatch patch to be applied
 * @param  {Function} [applyCallback]     optional `function(object, consecutivePatch)` to be called when applied, if not given #apply will be called
 */
JSONPatchQueue.prototype.receive = function(obj, versionedJsonPatch, applyCallback){
	var apply = applyCallback || this.apply,
		consecutivePatch = versionedJsonPatch.slice(0);
	// strip Versioned JSON Patch specyfiv operation objects from given sequence
		if(this.purist){
			var testRemote = consecutivePatch.shift();
		}
		var replaceRemote = consecutivePatch.shift(),
			newRemoteVersion = replaceRemote.value;

	// TODO: perform versionedPath validation if needed (tomalec)

	if( newRemoteVersion <= this.remoteVersion){
	// someone is trying to change something that was already updated
    	throw new Error("Given version was already applied.");
	} else if ( newRemoteVersion == this.remoteVersion + 1 ){
	// consecutive new version
		while( consecutivePatch ){// process consecutive patch(-es)
			this.remoteVersion++;
			apply(obj, consecutivePatch);
			consecutivePatch = this.waiting.shift();
		}
	} else {
	// add sequence to queue in correct position.
		this.waiting[newRemoteVersion - this.remoteVersion -2] = consecutivePatch;
	}
};
/**
 * Wraps JSON Patch sequence with version related operation objects
 * @param  {JSONPatch} sequence JSON Patch sequence to wrap
 * @return {VersionedJSONPatch}
 */
JSONPatchQueue.prototype.send = function(sequence){
	this.localVersion++;
	var newSequence = sequence.slice(0);
	if(this.purist){
		newSequence.unshift({ // test for consecutiveness
			op: "test",
			path: this.localPath,
			value: this.localVersion - 1
		},{ // replace for queue
			op: "replace",
			path: this.localPath,
			value: this.localVersion
		});
	} else {
		newSequence.unshift({ // replace for queue (+assumed test for consecutiveness_)
			op: "replace",
			path: this.localPath,
			value: this.localVersion
		});
	}
	return newSequence;
};

JSONPatchQueue.getPropertyByJsonPointer = function(obj, pointer) {
	var parts = pointer.split('/');
	if(parts[0] === "") {
		parts.shift();
	}
	var target = obj;
	while(parts.length) {
		var path = parts.shift().replace('~1', '/').replace('~0', '~');
		if(parts.length) {
			target = target[path];
		}
	}
	return target[path];
};

/**
 * Reset queue internals and object to new, given state
 * @param obj object to apply new state to
 * @param newState versioned object representing desired state along with versions
 */
JSONPatchQueue.prototype.reset = function(obj, newState){
	this.remoteVersion = JSONPatchQueue.getPropertyByJsonPointer(newState, this.remotePath);
	this.waiting = [];
	var patch = [{ op: "replace", path: "", value: newState }];
	this.apply(obj, patch);
};

module.exports = JSONPatchQueue;
module.exports.default = JSONPatchQueue;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

var queue = __webpack_require__(1);
var sync = __webpack_require__(0);

module.exports = { JSONPatchQueue: queue, JSONPatchQueueSynchronous: sync };


/***/ })
/******/ ]);