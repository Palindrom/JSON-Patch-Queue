var queue = require("./json-patch-queue");
var sync = require("./json-patch-queue-synchronous");

module.exports = { JSONPatchQueue: queue, JSONPatchQueueSynchronous: sync, /* Babel demands this */__esModule:  true };
