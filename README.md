# JSON-Patch-Queue [![Build Status](https://travis-ci.org/PuppetJs/JSON-Patch-Queue.svg?branch=gh-pages)](https://travis-ci.org/PuppetJs/JSON-Patch-Queue)
> Makes your JSON Patch application sequential

Implements a queue of JSON Patches, based on [Versioned JSON Patch](https://github.com/tomalec/Versioned-JSON-Patch) convention, that will resolve a problem of sequential application of JSON Patches.

## Demo
[Full Versioned JSON Patch + OT visualization](http://tomalec.github.io/PuppetJs-operational-transformation/visualization.html)

Specific visualization will come soon.


## Install

Install the component using [Bower](http://bower.io/):

```sh
$ bower install json-patch-queue --save
```

Or [download as ZIP](https://github.com/PuppetJs/JSON-Patch-Queue/archive/gh-pages.zip).

## Usage

### Single Versioned
```javascript
// create queue
var myQueue = new JSONPatchQueueSynchronous("/path_to_version", jsonpatch);
// to compose versioned JSON Patch, to be send somewhere?
var versionedPatchToBeSent = myQueue.send(regularpatch);
// to apply/queue received versioned  JSON Patch
myQueue.receive(myObject, reveivedVersionedPatch);
```

### Multiple Versioned
```javascript
// create queue
var myQueue = new JSONPatchQueue(["/local_version", "/remote_version"], jsonpatch);
// to compose versioned JSON Patch, to be send somewhere?
var versionedPatchToBeSent = myQueue.send(regularpatch);
// to apply/queue received versioned  JSON Patch
myQueue.receive(myObject, reveivedVersionedPatch);
```

## Requirements

Agent requires a function to apply JSON Patch, we suggest [fast JSON Patch](https://github.com/Starcounter-Jack/JSON-Patch) (`bower install fast-json-patch`).

## Methods

Name      | Arguments                     | Default | Description
---       | ---                           | ---     | ---
`send`    | *JSONPatch* sequence          |         | Changes given JSON Patch to Versioned JSON Patch
`receive` |                               |         | Receives, and eventually applies given Versioned JSON Patch, to the object
          | *Object* obj                  |         | object to be changed
          | *VersionedJSONPatch* sequence |         | Versioned JSON Patch to be queued and applied

#### Multiple Versioned

Name                         | Arguments            | Default | Description
---                          | ---                  | ---     | ---
`JSONPatchQueue`  | *Array* *JSONPointer* [localVersionPath, remoteVersionPath] |         | Paths where to store the versions
                             | *Function* apply     |         | `function(object, patch)` function to apply JSON Patch
                             | *Boolean* purist     | `false` | set to `true` to enable pure/unoptimized Versioned JSON Patch convention

#### Single Versioned

Name                         | Arguments            | Default | Description
---                          | ---                  | ---     | ---
`JSONPatchQueueSynchronous`  | *JSONPointer* versionPath |         | Path where to store the version
                             | *Function* apply     |         | `function(object, patch)` function to apply JSON Patch
                             | *Boolean* purist     | `false` | set to `true` to enable pure/unoptimized Versioned JSON Patch convention

## Properties

Name      | Type                          | Description
---       | ---                           | ---
`waiting` | *Array* *JSONPatch*           | Array of JSON Patches waiting in queue

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

For detailed changelog, check [Releases](https://github.com/PuppetJs/JSON-Patch-Queue/releases).

## License

MIT

## See also
- [fast JSON Patch](https://github.com/Starcounter-Jack/JSON-Patch)
- [JSON Patch OT](https://github.com/PuppetJs/JSON-Patch-OT)
- [JSON Patch OT Agent](https://github.com/PuppetJs/JSON-Patch-OT-agent)
- ...putting it all together: [PuppetJs](https://github.com/PuppetJs/PuppetJs)
