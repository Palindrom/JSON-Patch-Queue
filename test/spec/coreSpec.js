var obj;


describe("JSONPatchQueue instance", function () {
  it('should be created with version 0 by default', function() {
    var queue = new JSONPatchQueue("/version",function(){});
    expect(queue.version).toEqual(0);
  });

  describe("when receives a Versioned JSON Patch", function () {
    var queue, applyPatch;
    beforeEach(function () {
      applyPatch = jasmine.createSpy("applyPatch");
      queue = new JSONPatchQueue("/version",function(){
        applyPatch.apply(this, arguments);
      });
    });

    describe("with version higher than current `version + 1`", function () {
      var versionedJSONPatch3 = [
        {op: 'replace', path: '/version', value: 3},
        
        {op: 'add', path: '/bar', value: [1, 2, 3]},
        {op: 'replace', path: '/baz', value: 'smth'}
      ];

      beforeEach(function () {
        obj = {foo: 1, baz: [{qux: 'hello'}]};
        queue.receive(obj, versionedJSONPatch3);
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
        obj = {foo: 1, baz: [{qux: 'hello'}]};
        //add something to the queue
        queue.receive(obj, versionedJSONPatch2);
        queue.receive(obj, versionedJSONPatch3);
        // receive consecutive patch
        queue.receive(obj, versionedJSONPatch1);

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
        queue.receive(obj, versionedJSONPatch1);
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
      queue = new JSONPatchQueue("/version", function(){});
    });
    it("should return Versioned JSON Patch - JSON Patch with Version operation objects",function(){
      var versionedJSONPatch1 = queue.send([{op: 'replace', path: '/baz', value: 'smth'}]);
      expect(versionedJSONPatch1[0].op).toEqual("replace");
    });

    it("should use versionPaths as specified in constructor",function(){
      var versionedJSONPatch1 = queue.send([{op: 'replace', path: '/baz', value: 'smth'}]);
      expect(versionedJSONPatch1[0].path).toEqual("/version");
      queue = new JSONPatchQueue("/meta/ver");
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

});
