if(typeof JSONPatchQueue === 'undefined') {
  JSONPatchQueue = require('../../src/index').JSONPatchQueue;
}

describe("JSONPatchQueue instance", function () {
  it('should be created with versions 0,0 by default', function() {
    var queue = new JSONPatchQueue({}, ["/local","/remote"],function(){});
    expect(queue.localVersion).toEqual(0);
    expect(queue.remoteVersion).toEqual(0);
  });

  describe('when reset', function () {
    it('should set remote version to value given', function () {
      var obj = {};
      var queue = new JSONPatchQueue(obj, ["/local","/remote"],function(){});
      queue.reset({local: 1, remote: 2});
      expect(queue.remoteVersion).toEqual(2);
    });
    it('should set remote version to value given even with complex version path', function () {
      var obj = {};
      var queue = new JSONPatchQueue(obj, ["/v/local","/v/remote"],function(){});
      queue.reset({v: {local: 1, remote: 2}});
      expect(queue.remoteVersion).toEqual(2);
    });
    it('should apply big replace patch to obj', function () {
      var appliedPatch;
      var obj = {};
      var queue = new JSONPatchQueue(obj, ["/local","/remote"], function apply(obj, patches){
        appliedPatch = patches;
      });
      var newState = {local: 1, remote: 2, name: 'newname'};

      queue.reset(newState);

      expect(appliedPatch).toEqual([{op: 'replace', path: '', value: newState}]);
    });
  });

  describe("when receives a Versioned JSON Patch", function () {
    var queue, applyPatch;
    var obj = {foo: 1, baz: [{qux: 'hello'}]};
    beforeEach(function () {
      applyPatch = jasmine.createSpy("applyPatch");
      queue = new JSONPatchQueue(obj, ["/local","/remote"], function(){
        applyPatch.apply(this, arguments);
        return arguments[0]
      });
    });

    describe("with remote's version higher than current `remoteVersion + 1`", function () {
      var versionedJSONPatch3 = [
        {op: 'replace', path: '/remote', value: 3},
        //{op: 'test', path: '/local', value: 0}, // OT

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
          // {op: 'test', path: '/local', value: 0}, // OT
          {op: 'add', path: '/bar', value: [1, 2, 3]},
          {op: 'replace', path: '/baz', value: 'smth'}
        ]);
        expect(queue.waiting[1]).toEqual([
          // {op: 'test', path: '/local', value: 0}, // OT
          {op: 'add', path: '/bar', value: [1, 2, 3]},
          {op: 'replace', path: '/baz', value: 'smth'}
        ]);
      });
      it('should not change `remoteVersion`', function() {
        expect(queue.remoteVersion).toEqual(0);
      });
    });

    describe("with consecutive remote's version", function () {
      var versionedJSONPatch1 = [
        {op: 'replace', path: '/remote', value: 1},
        //{op: 'test', path: '/local', value: 0}, // OT

        {op: 'replace', path: '/baz', value: 'smth'}
      ];
      var versionedJSONPatch2 = [
        {op: 'replace', path: '/remote', value: 2},
        //{op: 'test', path: '/local', value: 0}, // OT

        {op: 'add', path: '/bar', value: [1, 2, 3]}
      ];
      var versionedJSONPatch3 = [
        {op: 'replace', path: '/remote', value: 3},
        //{op: 'test', path: '/local', value: 0}, // OT

        {op: 'replace', path: '/bool', value: false}
      ];
      var versionedJSONPatch5 = [
        {op: 'replace', path: '/remote', value: 5},
        //{op: 'test', path: '/local', value: 0}, // OT

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
      it('should update `remoteVersion` accordingly', function() {
        expect(queue.remoteVersion).toEqual(3);
      });
    });


    describe("with remote's version lower or equal to current `remoteVersion`", function () {

      it('should throw an error', function() {
        var versionedJSONPatch1 = [
          {op: 'replace', path: '/remote', value: 1},
          //{op: 'test', path: '/local', value: 0}, // OT

          {op: 'replace', path: '/baz', value: 'smth'}
        ];
        var versionedJSONPatch0 = [
          {op: 'replace', path: '/remote', value: 0},
          //{op: 'test', path: '/local', value: 0}, // OT

          {op: 'add', path: '/bar', value: [1, 2, 3]}
        ];
        // apply some change
        queue.receive(versionedJSONPatch1);
        // try to apply same
        expect(function(){queue.receive(obj, versionedJSONPatch1);}).toThrow();
        // try to apply lower
        expect(function(){queue.receive(obj, versionedJSONPatch0);}).toThrow();
      });
    });
  });

  describe("when sends a JSON Patch", function () {
    var queue;
    beforeEach(function () {
      queue = new JSONPatchQueue({}, ["/local","/remote"],function(){});
    });
    it("should increment `.localVersion`",function(){
      var versionedJSONPatch1 = queue.send([{op: 'replace', path: '/baz', value: 'smth'}]);
      expect(queue.localVersion).toEqual(1);
    });
    it("should return Versioned JSON Patch - JSON Patch with Version operation objects",function(){
      var versionedJSONPatch1 = queue.send([{op: 'replace', path: '/baz', value: 'smth'}]);
      expect(versionedJSONPatch1[0].op).toEqual("replace");
      //expect(versionedJSONPatch1[1].op).toEqual("test"); // OT
    });

    it("should use versionPaths as specified in constructor",function(){
      var versionedJSONPatch1 = queue.send([{op: 'replace', path: '/baz', value: 'smth'}]);
      expect(versionedJSONPatch1[0].path).toEqual("/local");
      // expect(versionedJSONPatch1[1].path).toEqual("/remote"); // OT
      queue = new JSONPatchQueue({}, ["/meta/client","/meta/server"]);
      var versionedJSONPatch2 = queue.send([{op: 'replace', path: '/baz', value: 'smth'}]);
      expect(versionedJSONPatch2[0].path).toEqual("/meta/client");
      // expect(versionedJSONPatch2[1].path).toEqual("/meta/server"); // OT
    });

    it("each time should send `replace` operation for consecutive local versions (as second operation object)",function(){
      var versionedJSONPatch1 = queue.send([{op: 'replace', path: '/foo', value: 'smth'}]);
      expect(versionedJSONPatch1[0].value).toEqual(1);
      var versionedJSONPatch2 = queue.send([{op: 'replace', path: '/baz', value: 'smthelse'}]);
      expect(versionedJSONPatch2[0].value).toEqual(2);
    });
    // OT
    // it("should send `test` operation for last acknowledged remote version (as first operation object)",function(){
    //   var versionedJSONPatch1 = queue.send([{op: 'replace', path: '/foo', value: 'smth'}]);
    //   expect(versionedJSONPatch1[1].value).toEqual(0);
    //   queue.receive(obj, [
    //     {op: 'replace', path: '/remote', value: 1},
    //     //{op: 'test', path: '/local', value: 0}, // OT
    //     {op: 'replace', path: '/bar', value: 'smth'}]);
    //   var versionedJSONPatch2 = queue.send([{op: 'replace', path: '/baz', value: 'smthelse'}]);
    //   expect(versionedJSONPatch2[1].value).toEqual(1);
    // });
  });


  describe("in purist mode", function () {
    var queue;
    beforeEach(function () {
      queue = new JSONPatchQueue({}, ["/local","/remote"],function(){}, true);
    });
    it("should send consecutiveness test for local version",function(){
      var versionedJSONPatch1 = queue.send([{op: 'replace', path: '/foo', value: 'smth'}]);
      expect(versionedJSONPatch1[0]).toEqual({op: 'test', path: '/local', value: 0});
      expect(versionedJSONPatch1[1]).toEqual({op: 'replace', path: '/local', value: 1});
    });

    it("should receive consecutiveness test from remote",function(){
      expect(function(){
        queue.receive([
          {op: 'test', path: '/remote', value: 0},
          {op: 'replace', path: '/remote', value: 1},
          //{op: 'test', path: '/local', value: 0}, // OT
          {op: 'replace', path: '/bar', value: 'smth'}]);
      }).not.toThrow();
      expect(queue.remoteVersion).toEqual(1);
    });

  });

});

// Benchmark performance test
if (typeof Benchmark !== 'undefined') {
(function(){
  var banchQueue, remoteCounter, localCounter, obj;
  var suite = new Benchmark.Suite("JSONPatchQueue",{
    onError: function(error){
      console.error(error);
    }
  });
  suite.add(suite.name + ' receive operation sequence (replace)', function () {
    banchQueue.receive(obj, [
      {op: 'replace', path: '/remote', value: remoteCounter},
      //{op: 'test', path: '/local', value: localCounter}, // OT
      {op: 'replace', path: '/foo', value: [1, 2, 3, 4]}
    ]);

    remoteCounter++;

  },{
    onStart: function(){
      obj = {foo: 1, baz: [
        {qux: 'hello'}
      ]};
      banchQueue = new JSONPatchQueue(obj, ["/local","/remote"],function(){});      
      remoteCounter = 1;
      localCounter = 0;
    }
  });
  suite.add(suite.name + ' queue received operation sequence', function () {
    banchQueue.receive([
      {op: 'replace', path: '/remote', value: remoteCounter},
      // {op: 'test', path: '/local', value: localCounter}, // OT
      {op: 'replace', path: '/foo', value: [1, 2, 3, 4]}
    ]);

    remoteCounter++;

  },{
    onStart: function(){
      obj = {foo: 1, baz: [
        {qux: 'hello'}
      ]};
      banchQueue = new JSONPatchQueue(obj, ["/local","/remote"],function(){});      
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
      banchQueue = new JSONPatchQueue({}, ["/local","/remote"],function(){});
      remoteCounter = 0;
      localCounter = 0;
    }
  });

  suite.add(suite.name + ' purist receive operation sequence (replace)', function () {
    banchQueue.receive([
      {op: 'test', path: '/remote', value: remoteCounter-1}, //purist
      {op: 'replace', path: '/remote', value: remoteCounter},
      // {op: 'test', path: '/local', value: localCounter}, // OT
      {op: 'replace', path: '/foo', value: [1, 2, 3, 4]}
    ]);

    remoteCounter++;

  },{
    onStart: function(){
       obj = {foo: 1, baz: [
        {qux: 'hello'}
      ]};
      banchQueue = new JSONPatchQueue(obj, ["/local","/remote"],function(){}, true);     
      remoteCounter = 1;
      localCounter = 0;
    }
  });

  suite.add(suite.name + ' purist queue received operation sequence', function () {
    banchQueue.receive([
      {op: 'test', path: '/remote', value: remoteCounter-1}, //purist
      {op: 'replace', path: '/remote', value: remoteCounter},
      // {op: 'test', path: '/local', value: localCounter}, // OT
      {op: 'replace', path: '/foo', value: [1, 2, 3, 4]}
    ]);

    remoteCounter++;

  },{
    onStart: function(){
      obj = {foo: 1, baz: [
        {qux: 'hello'}
      ]};
      banchQueue = new JSONPatchQueue(obj, ["/local","/remote"],function(){}, true);      
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
      banchQueue = new JSONPatchQueue({}, ["/local","/remote"],function(){}, true);
      remoteCounter = 0;
      localCounter = 0;
    }
  });
  // suite.add('move operation', function () {
  //   obj = {foo: 1, baz: [
  //     {qux: 'hello'}
  //   ], bar: [1, 2, 3, 4]};
  //   jsonpatch.apply(obj, [
  //     {op: 'move', from: '/baz/0', path: '/bar/0'}
  //   ]);
  // });
  // suite.add('copy operation', function () {
  //   obj = {foo: 1, baz: [
  //     {qux: 'hello'}
  //   ], bar: [1, 2, 3, 4]};
  //   jsonpatch.apply(obj, [
  //     {op: 'copy', from: '/baz/0', path: '/bar/0'}
  //   ]);
  // });
  // suite.add('test operation', function () {
  //   obj = {foo: 1, baz: [
  //     {qux: 'hello'}
  //   ]};
  //   jsonpatch.apply(obj, [
  //     {op: 'test', path: '/baz', value: [
  //       {qux: 'hello'}
  //     ]}
  //   ]);
  // });

  benchmarkReporter(suite);
}());
}
