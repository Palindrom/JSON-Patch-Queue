# JSON-Patch-Queue [![Build Status](https://travis-ci.org/Palindrom/JSON-Patch-Queue.svg?branch=master)](https://travis-ci.org/Palindrom/JSON-Patch-Queue)

> Makes your JSON Patch application sequential

Implements a queue of JSON Patches, based on [Versioned JSON Patch](https://github.com/tomalec/Versioned-JSON-Patch) convention, that will resolve a problem of sequential application of JSON Patches.

## Demo
[Full Versioned JSON Patch + OT visualization](http://tomalec.github.io/PuppetJs-operational-transformation/visualization.html)

Specific visualization will come soon.

## Install

Install the component using NPM

```sh
$ npm install json-patch-queue --save
```

Or

Install the component using [Bower](http://bower.io/):

```sh
$ bower install json-patch-queue --save
```

Or [download as ZIP](https://github.com/Palindrom/JSON-Patch-Queue/archive/master.zip).

## Usage

### Single Versioned
```javascript

var targetObject = {};
// create queue
var myQueue = new JSONPatchQueueSynchronous(targetObject, "/path_to_version", jsonpatch);
// to compose versioned JSON Patch, to be send somewhere?
var versionedPatchToBeSent = myQueue.send(regularpatch);
// to apply/queue received versioned  JSON Patch
myQueue.receive(receivedVersionedPatch);
```

### Multiple Versioned
```javascript

var targetObject = {};

// create queue
var myQueue = new JSONPatchQueue(targetObject, ["/local_version", "/remote_version"], jsonpatch);
// to compose versioned JSON Patch, to be send somewhere?
var versionedPatchToBeSent = myQueue.send(regularpatch);
// to apply/queue received versioned  JSON Patch
myQueue.receive(receivedVersionedPatch);
```

## Requirements

Agent requires a function to apply JSON Patch, we suggest [fast JSON Patch](https://github.com/Starcounter-Jack/JSON-Patch) (`bower install fast-json-patch`).

## Methods

Name      | Arguments                     | Default | Description
---       | ---                           | ---     | ---
`send`    | *JSONPatch* sequence          |         | Changes given JSON Patch to Versioned JSON Patch
`receive` | *VersionedJSONPatch* sequence Versioned JSON Patch to be queued and applied |         | Receives, and eventually applies given Versioned JSON Patch, to the object passed in the constructor

#### Multiple Versioned

Name                         | Arguments            | Default | Description
---                          | ---                  | ---     | ---
`JSONPatchQueue`             | *`Object`* obj     | ---     | Target object where patches are applied
                             | *`Array<JSONPointer>`* `[localVersionPath, remoteVersionPath]` |         | Paths where to store the versions
                             | *`Function`* apply     |         | `function(object, patch)` function to apply JSON Patch, must return the object in its final state
                             | *`Boolean`* purist     | `false` | set to `true` to enable pure/unoptimized Versioned JSON Patch convention

#### Single Versioned

Name                         | Arguments            | Default | Description
---                          | ---                  | ---     | ---
`JSONPatchQueueSynchronous`  | *`Object`* *obj*       |         | Target object where patches are applied
                             | *`JSONPointer`* versionPath |         | Path where to store the version
                             | *`Function`* apply     |         | `function(object, patch)` function to apply JSON Patch, must return the object in its final
                             | *`Boolean`* purist     | `false` | set to `true` to enable pure/unoptimized Versioned JSON Patch convention

## Properties

Name      | Type                          | Description
---       | ---                           | ---
`obj    ` | *`Object`*                    | Target object where patches are applied
`waiting` | *`Array<JSONPatch>`*          | Array of JSON Patches waiting in queue

#### Multiple Versioned

Name      | Type                          | Description
---       | ---                           | ---
`localVersion` | *Number*           | local version
`remoteVersion` | *Number*           | acknowledged remote version

#### Single Versioned

Name      | Type      | Description
---       | ---       | ---
`version` | *Number*  | document version


## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## History

For detailed changelog, check [Releases](https://github.com/Palindrom/JSON-Patch-Queue/releases).

## License

MIT

## See also
- [fast JSON Patch](https://github.com/Starcounter-Jack/JSON-Patch)
- [JSON Patch OT](https://github.com/Palindrom/JSON-Patch-OT)
- [JSON Patch OT Agent](https://github.com/Palindrom/JSON-Patch-OT-agent)
- ...putting it all together: [Palindrom](https://github.com/Palindrom/Palindrom)