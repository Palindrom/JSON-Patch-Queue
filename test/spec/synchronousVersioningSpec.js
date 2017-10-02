if(typeof JSONPatchQueueSynchronous === 'undefined') {
  JSONPatchQueueSynchronous = require('../../src/index').JSONPatchQueueSynchronous;
}

describe("JSONPatchQueueSynchronous instance", function () {
  it('should be created with version 0 by default', function() {
    var queue = new JSONPatchQueueSynchronous({}, "/version",function(){});
    expect(queue.version).toEqual(0);
  });

  describe('when reset', function () {
    it('should set remote version to value given', function () {
      var obj = {};
      var queue = new JSONPatchQueueSynchronous(obj, "/version",function(){});
      queue.reset({version: 1});
      expect(queue.version).toEqual(1);
    });
    it('should set remote version to value given even with complex version path', function () {

      var obj = {};
      var queue = new JSONPatchQueueSynchronous(obj, "/v/version",function(){});
      queue.reset({v: {version: 1}});
      expect(queue.version).toEqual(1);
    });
    it('should apply big replace patch to obj', function () {
      var appliedPatch;
      var obj = {};
      var queue = new JSONPatchQueueSynchronous(obj, "/version",function apply(obj, patches){
        appliedPatch = patches;
        return obj;
      });
      var newState = {version: 1, name: 'newname'};

      queue.reset(newState);

      expect(appliedPatch).toEqual([{op: 'replace', path: '', value: newState}]);
    });
  });

  describe("when receives a Versioned JSON Patch", function () {
    var queue, applyPatch;
    var obj = {foo: 1, baz: [{qux: 'hello'}]}
    beforeEach(function () {
      applyPatch = jasmine.createSpy("applyPatch");
      queue = new JSONPatchQueueSynchronous(obj, "/version",function(){
        applyPatch.apply(this, arguments);
        return arguments[0];
      });
    });

    describe("with version higher than current `version + 1`", function () {
      var versionedJSONPatch3 = [
        {op: 'replace', path: '/version', value: 3},

        {op: 'add', path: '/bar', value: [1, 2, 3]},
        {op: 'replace', path: '/baz', value: 'smth'}
      ];

      beforeEach(function () {
        queue.receive(versionedJSONPatch3);
      });

      it('should not apply given JSON Patch sequence', function() {
        expect(applyPatch).not.toHaveBeenCalled()
        expect(obj).toEqual({foo: 1, baz: [{qux: 'hello'}]})
      });
      it('should place JSON Patch sequence in `.waiting` array, according to versions distance', function() {
        expect(queue.waiting).toContain([
          {op: 'add', path: '/bar', value: [1, 2, 3]},
          {op: 'replace', path: '/baz', value: 'smth'}
        ]);
        expect(queue.waiting[1]).toEqual([
          {op: 'add', path: '/bar', value: [1, 2, 3]},
          {op: 'replace', path: '/baz', value: 'smth'}
        ]);
      });
      it('should not change `version`', function() {
        expect(queue.version).toEqual(0);
      });
    });

    describe("with consecutive remote's version", function () {
      var versionedJSONPatch1 = [
        {op: 'replace', path: '/version', value: 1},

        {op: 'replace', path: '/baz', value: 'smth'}
      ];
      var versionedJSONPatch2 = [
        {op: 'replace', path: '/version', value: 2},

        {op: 'add', path: '/bar', value: [1, 2, 3]}
      ];
      var versionedJSONPatch3 = [
        {op: 'replace', path: '/version', value: 3},

        {op: 'replace', path: '/bool', value: false}
      ];
      var versionedJSONPatch5 = [
        {op: 'replace', path: '/version', value: 5},

        {op: 'replace', path: '/bool', value: true}
      ];

      beforeEach(function () {
        //add something to the queue
        queue.receive(versionedJSONPatch2);
        queue.receive(versionedJSONPatch3);
        // receive consecutive patch
        queue.receive(versionedJSONPatch1);

      });

      it('should apply given JSON Patch sequence', function() {
        expect(applyPatch).toHaveBeenCalledWith(obj, [{op: 'replace', path: '/baz', value: 'smth'}]);
        expect(applyPatch.calls.argsFor(0)).toEqual([obj, [{op: 'replace', path: '/baz', value: 'smth'}]]);
      });
      it('should apply queued, consecutive Patch sequences', function() {
        expect(applyPatch.calls.count()).toEqual(3);
        expect(applyPatch.calls.allArgs()).toEqual([
          [obj, [{op: 'replace', path: '/baz', value: 'smth'}]],// JSONPatch1
          [obj, [{op: 'add', path: '/bar', value: [1, 2, 3]}]],// JSONPatch2
          [obj, [{op: 'replace', path: '/bool', value: false}]]// JSONPatch3
        ]);
      });
      it('should update `version` accordingly', function() {
        expect(queue.version).toEqual(3);
      });
    });


    describe("with remote's version lower or equal to current `version`", function () {

      it('should throw an error', function() {


        var versionedJSONPatch1 = [
          {op: 'replace', path: '/version', value: 1},

          {op: 'replace', path: '/baz', value: 'smth'}
        ];
        var versionedJSONPatch0 = [
          {op: 'replace', path: '/version', value: 0},

          {op: 'add', path: '/bar', value: [1, 2, 3]}
        ];
        // apply some change
        queue.receive(versionedJSONPatch1);
        // try to apply same
        expect(function(){queue.receive(versionedJSONPatch1);}).toThrow();
        // try to apply lower
        expect(function(){queue.receive(versionedJSONPatch0);}).toThrow();
      });
    });
  });

  describe("when sends a JSON Patch", function () {
    var queue;
    beforeEach(function () {
      queue = new JSONPatchQueueSynchronous({}, "/version", function(){});
    });
    it("should increment `.localVersion`",function(){
      var versionedJSONPatch1 = queue.send([{op: 'replace', path: '/baz', value: 'smth'}]);
      expect(queue.version).toEqual(1);
    });
    it("should return Versioned JSON Patch - JSON Patch with Version operation objects",function(){
      var versionedJSONPatch1 = queue.send([{op: 'replace', path: '/baz', value: 'smth'}]);
      expect(versionedJSONPatch1[0].op).toEqual("replace");
    });

    it("should use versionPaths as specified in constructor",function(){
      var versionedJSONPatch1 = queue.send([{op: 'replace', path: '/baz', value: 'smth'}]);
      expect(versionedJSONPatch1[0].path).toEqual("/version");
      queue = new JSONPatchQueueSynchronous({}, "/meta/ver");
      var versionedJSONPatch2 = queue.send([{op: 'replace', path: '/baz', value: 'smth'}]);
      expect(versionedJSONPatch2[0].path).toEqual("/meta/ver");
    });

    it("each time should send `replace` operation for consecutive version versions (as second operation object)",function(){
      var versionedJSONPatch1 = queue.send([{op: 'replace', path: '/foo', value: 'smth'}]);
      expect(versionedJSONPatch1[0].value).toEqual(1);
      var versionedJSONPatch2 = queue.send([{op: 'replace', path: '/baz', value: 'smthelse'}]);
      expect(versionedJSONPatch2[0].value).toEqual(2);
    });
  });

  describe("in purist mode", function () {
    var queue;
    beforeEach(function () {
      queue = new JSONPatchQueueSynchronous({}, "/version",function(){}, true);
    });
    it("should send consecutiveness test",function(){
      var versionedJSONPatch1 = queue.send([{op: 'replace', path: '/foo', value: 'smth'}]);
      expect(versionedJSONPatch1[0]).toEqual({op: 'test', path: '/version', value: 0});
      expect(versionedJSONPatch1[1]).toEqual({op: 'replace', path: '/version', value: 1});
    });

    it("should receive consecutiveness test",function(){
      expect(function(){
        queue.receive([
          {op: 'test', path: '/version', value: 0},
          {op: 'replace', path: '/version', value: 1},
          {op: 'replace', path: '/bar', value: 'smth'}]);
      }).not.toThrow();
      expect(queue.version).toEqual(1);
    });

  });

});

// Benchmark performance test
if (typeof Benchmark !== 'undefined') {
(function(){
  var banchQueue, remoteCounter, localCounter, obj;
  var suite = new Benchmark.Suite("JSONPatchQueueSynchronous",{
    onError: function(error){
      console.error(error);
    }
  });
  suite.add(suite.name + ' receive operation sequence (replace)', function () {
    banchqueue.receive([
      {op: 'replace', path: '/version', value: remoteCounter},
      {op: 'replace', path: '/foo', value: [1, 2, 3, 4]}
    ]);

    remoteCounter++;

  },{
    onStart: function(){
      obj = {foo: 1, baz: [
        {qux: 'hello'}
      ]};
      banchQueue = new JSONPatchQueueSynchronous(obj, "/version",function(){});      
      remoteCounter = 1;
      localCounter = 0;
    }
  });
  suite.add(suite.name + ' queue received operation sequence', function () {
    banchqueue.receive([
      {op: 'replace', path: '/version', value: remoteCounter},
      {op: 'replace', path: '/foo', value: [1, 2, 3, 4]}
    ]);

    remoteCounter++;

  },{
    onStart: function(){
      obj = {foo: 1, baz: [
        {qux: 'hello'}
      ]};
      banchQueue = new JSONPatchQueueSynchronous(obj, "/version",function(){});
      
      remoteCounter = 2;
      localCounter = 0;
    }
  });
  suite.add(suite.name + ' send operation sequence (replace)', function () {
    banchQueue.send([
      {op: 'replace', path: '/foo', value: [1, 2, 3, 4]}
    ]);
  },{
    onStart: function(){
      banchQueue = new JSONPatchQueueSynchronous({}, "/version",function(){});
      remoteCounter = 0;
      localCounter = 0;
    }
  });

  suite.add(suite.name + ' purist receive operation sequence (replace)', function () {
    banchQueue.receive([
      {op: 'test', path: '/version', value: remoteCounter-1}, //purist
      {op: 'replace', path: '/version', value: remoteCounter},
      {op: 'replace', path: '/foo', value: [1, 2, 3, 4]}
    ]);

    remoteCounter++;

  },{
    onStart: function(){
      obj = {foo: 1, baz: [
        {qux: 'hello'}
      ]};
      banchQueue = new JSONPatchQueueSynchronous(obj, "/version",function(){}, true);      
      remoteCounter = 1;
      localCounter = 0;
    }
  });
  suite.add(suite.name + ' queue purist received operation sequence', function () {
    banchQueue.receive([
      {op: 'test', path: '/version', value: remoteCounter-1}, //purist
      {op: 'replace', path: '/version', value: remoteCounter},
      {op: 'replace', path: '/foo', value: [1, 2, 3, 4]}
    ]);

    remoteCounter++;

  },{
    onStart: function(){
      banchQueue = new JSONPatchQueueSynchronous("/version",function(){}, true);
      obj = {foo: 1, baz: [
        {qux: 'hello'}
      ]};
      remoteCounter = 2;
      localCounter = 0;
    }
  });
  suite.add(suite.name + ' purist send operation sequence (replace)', function () {
    banchQueue.send([
      {op: 'replace', path: '/foo', value: [1, 2, 3, 4]}
    ]);
  },{
    onStart: function(){
      banchQueue = new JSONPatchQueueSynchronous("/version",function(){}, true);
      remoteCounter = 0;
      localCounter = 0;
    }
  });

  benchmarkReporter(suite);
}());
}
