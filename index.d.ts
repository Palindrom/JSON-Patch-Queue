export class JSONPatchQueueSynchronous {
    /**
     * JSON Patch Queue for synchronous operations, and asynchronous networking.
     * version: 3.0.0-rc.0
     * @param {Object} Obj The target object where patches are applied
     * @param {JSON-Pointer} versionPath JSON-Pointers to version numbers
     * @param {function} apply    apply(JSONobj, JSONPatchSequence) function to apply JSONPatch to object.
     * @param {Boolean} [purist]       If set to true adds test operation before replace.
     */
    constructor(versionPath: String, apply: Function, purist: Boolean);
    public version: Number;

    /**
    * Process received versioned JSON Patch.
    * Applies or adds to queue.
    * @param  {JSONPatch} versionedJsonPatch patch to be applied
    * @param  {Function} [applyCallback]     optional `function(object, consecutivePatch)` to be called when applied, if not given #apply will be called
    */
    public receive(versionedJsonPatch: Object, applyCallback: Function);

    /**
    * Wraps JSON Patch sequence with version related operation objects
    * @param  {JSONPatch} sequence JSON Patch sequence to wrap
    * @return {VersionedJSONPatch}
    */
    public send(sequence: Array<Object>): Array<Object>;

    public static getPropertyByJsonPointer(obj: Object, pointer: String): any;

    /**
     * Reset queue internals and object to new, given state
     * @param obj object to apply new state to
     * @param newState versioned object representing desired state along with versions
     */
    public reset(obj: Object, newState: Object);
}

export class JSONPatchQueue {
    /**
     * JSON Patch Queue for asynchronous operations, and asynchronous networking.
     * @param {Object} Obj The target object where patches are applied
     * @param {Array<JSON-Pointer>} versionPaths JSON-Pointers to version numbers [local, remote]
     * @param {function} apply    apply(JSONobj, JSONPatchSequence) function to apply JSONPatch to object.
     * @param {Boolean} [purist]       If set to true adds test operation before replace.
     * @version: 1.0.0
     */
    constructor(obj: Object, versionPaths: String, apply: Function, purist: Boolean);

    /** local version */
    public localVersion: Number;

    /** Latest acknowledged remote version */
    public remoteVersion: Number;

    /**
     * Process received versioned JSON Patch
     * Applies or adds to queue.
     * @param  {JSONPatch} versionedJsonPatch patch to be applied
     * @param  {Function} [applyCallback]     optional `function(object, consecutivePatch)` to be called when applied, if not given #apply will be called
     */
    public receive(versionedJsonPatch: Object, applyCallback: Function);

    /**
     * Wraps JSON Patch sequence with version related operation objects
     * @param  {JSONPatch} sequence JSON Patch sequence to wrap
     * @return {VersionedJSONPatch}
     */
    public send(sequence: Array<Object>): Array<Object>;

    public static getPropertyByJsonPointer(obj: Object, pointer: String): any;
    /**
     * Reset queue internals and object to new, given state
     * @param obj object to apply new state to
     * @param newState versioned object representing desired state along with versions
     */
    public reset(obj: Object, newState: Object) : Object
}