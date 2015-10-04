# Multiple Versioned JSON Patch
> by Tomek Wytrębowicz (Starcounter)

## Abstract

Multiple Versioned JSON Patch is a defined convention to use [JSON Patch [RFC6902]](https://tools.ietf.org/html/rfc6902) to help applying sequences in required correct order, and resolve conflicts especially in case of asynchronous, distributed collaboration.

//toc

## Introduction

[JSON Patch [RFC6902]](https://tools.ietf.org/html/rfc6902) is a format for expressing a sequence of operations to apply to
a target JSON document. It requires to apply sequences in correct, sequential order. However, the JSON Patch spec does not suggest any way to achieve it.

[Multiple Versioned JSON Patch](https://github.com/tomalec/MultipleVersionedJSONPatch) is proposed format to specify the sequential nature of JSON Patches, and to make it more suitable for use with the asynchronous, distributed collaboration like real-time document sharing over HTTP PATCH, or Web Sockets. It also helps to achieve eventual consistency with [Operational Transformations](http://en.wikipedia.org/wiki/Operational_transformation).
[Multiple Versioned JSON Patch](https://github.com/tomalec/MultipleVersionedJSONPatch) is conceptually similar to [Versioned JSON Patch](https://github.com/tomalec/VersionedJSONPatch), but serves more information to support real-time collaboration.
Versioned JSON Patch is in fact fully compatible JSON Patch, so it should not provide any compatibility issues, nor additional layers.

Note, that distributed collaboration on JSON document, may apply to many cases, like: client-serve, peer-peer, peer-to-many, etc.


## Conventions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this
document are to be interpreted as described in [[RFC2119]](https://tools.ietf.org/html/rfc2119).

## Double/Multiple Versioned JSON Patch

Similarly to Versioned JSON Patch, Multiple Versioned JSON Patch is also a format that guarantees sequential order, and supports resolution of asynchronous traffic conflicts (queuing). Additionally it adds support for asynchronous, distributed collaboration on single JSON document.

### Document Structure

Multiple Versioned JSON Patch is a JSON Patch, with given version number for each peer taking part in collaboration

```json
[
   { "op": "test", "path": "/aliceVersion", "value": 3 },
   { "op": "test", "path": "/bobVersion", "value": 1 },
   { "op": "replace", "path": "/bobVersion", "value": 2 },
   { "op": "test", "path": "/a/b/c", "value": "foo" },
   { "op": "remove", "path": "/a/b/c" },
   { "op": "add", "path": "/a/b/c", "value": [ "foo", "bar" ] },
   { "op": "replace", "path": "/a/b/c", "value": 42 },
   { "op": "move", "from": "/a/b/c", "path": "/a/b/d" },
   { "op": "copy", "from": "/a/b/d", "path": "/a/b/e" }
 ]
```
and all evaluation and application rules applies here as well.

The only difference is that peers that takes part in communication MUST agree on **version path** for each peer -  [JSON Pointer [RFC6901]](https://tools.ietf.org/html/rfc6901) (name and position in JSON document) to a node that will contain a **version number**, and each sequence MUST contain `test` operation objects, one for each peer and `replace` operation objects for sender's **version number**.

```json
{ "op": "test", "path": "/aliceVersion", "value": 3 },
{ "op": "test", "path": "/bobVersion", "value": 1 },
{ "op": "replace", "path": "/bobVersion", "value": 2 },
```

> :bulb: for optimization reasons (traffic, calculations etc.) `test` or `replace` operation for senders version  may be omitted, if both peers agree that one implies another.
> :question: consider SHOULD

### Version

Theoretically, _version numbers_ could be stored in any part of a JSON tree, but it's highly RECOMENDED to keep it at root level.
It is also RECOMENDED to keep `test` and `replace` operations objects as first in JSON Patch sequence, so Patches could get rejected fast.

When a new JSON Patch is created, it MUST contain `test` operation objects for currently acknowledged _version numbers_, and MUST contain `replace` operation for creator's _version number_ with increased value, _version number_ it SHALL NOT get change in any other way or reason.

> :bulb: :grey_question: does sequence with test operation objects only, needs to bump version?

With such processed value, sequential application is assured by JSON Patch application algorithm.
Additionally, received sender's _version number_ can be used to implement queuing layer, that will solve conflicts related to asynchronous traffic of patches, and received `test` operation for recipient's _version number_ (acknowledged by sender) gives a base to solve conflicts related to asynchronous changes.

## Persistence of _version numbers_ in JSON document

In specific implementations processing of the _version numbers_ MAY be incorporated in communication layer and separated from JSON document operated by peers, but it could as well be visible to entire application logic, as long, as changing constraints will be respected.

## References
###  Normative References

1. [[RFC2119]](https://tools.ietf.org/html/rfc2119)  Bradner, S., "Key words for use in RFCs to Indicate Requirement Levels", BCP 14, RFC 2119, March 1997.
2. [[RFC6902]](https://tools.ietf.org/html/rfc6902)  P. Bryan, M. Nottingham, "JavaScript Object Notation (JSON) Patch", RFC 6902,  April 2013.
3. [[RFC6901]](https://tools.ietf.org/html/rfc6901)  Bryan, P., Ed., Zyp, K., and M. Nottingham, Ed., "JavaScript Object Notation (JSON) Pointer", RFC 6901,April 2013.
4. [Versioned JSON Patch](https://github.com/tomalec/VersionedJSONPatch) T. Wytrębowicz, "Versioned JSON Patch", March 2015.


# Appendix
## Examples

### Sequential flow
An example target JSON document:

```json
{ 
  "foo": "bar"
}
```
with agreed `/aliceVersion` and `/bobVersion` as a version paths:

```json
{ 
  "aliceVersion": 0,
  "bobVersion": 0,
  "foo": "bar"
}
```
Regular JSON Patch from `Bob` to change original document would have look like:

```json
[
 { "op": "add", "path": "/baz", "value": "qux" }
]
```
A Versioned JSON Patch

```json
[
 { "op": "test", "path": "/aliceVersion", "value": 0 },
 { "op": "test", "path": "/bobVersion", "value": 0 },
 { "op": "replace", "path": "/bobVersion", "value": 1 },
 { "op": "add", "path": "/baz", "value": "qux" }
]
```

The resulting JSON document:

```json
{ 
  "aliceVersion": 0,
  "bobVersion": 1,
  "foo": "bar",
  "baz": "qux"
}
```


### Deep version path
An example target JSON document:

```json
{ 
  "foo": "bar"
}
```
peers agreed to keep versions at `/_meta/aliceVersion` and `/_meta/bobVersion`:

```json
{ 
  "_meta":{
    "aliceVersion": 0,
    "bobVersion": 0
  },
  "foo": "bar"
}
```
Regular JSON Patch from `Bob` to change original document would have look like:

```json
[
 { "op": "add", "path": "/baz", "value": "qux" }
]
```
A Versioned JSON Patch

```json
[
 { "op": "test", "path": "/_meta/aliceVersion", "value": 0 },
 { "op": "test", "path": "/_meta/bobVersion", "value": 0 },
 { "op": "replace", "path": "/_meta/bobVersion", "value": 1 },
 { "op": "add", "path": "/baz", "value": "qux" }
]
```

The resulting JSON document:

```json
{ 
  "_meta":{
    "aliceVersion": 0,
    "bobVersion": 1
  },
  "foo": "bar",
  "baz": "qux"
}
```


### Order conflict detection - gap
An example target JSON document with agreed `/aliceVersion` and `/bobVersion` as a version paths:

```json
{ 
  "aliceVersion": 0,
  "bobVersion": 0,
  "guestList": ["Celine", "Thomas"]
}
```
Alice sends two consecutive patches to the document,
A1:

```json
[
 { "op": "test", "path": "/bobVersion", "value": 0 },
 { "op": "test", "path": "/aliceVersion", "value": 0 },
 { "op": "replace", "path": "/aliceVersion", "value": 1 },
 { "op": "remove", "path": "/guestList/0"}
]
```
and A2:

```json
[
 { "op": "test", "path": "/bobVersion", "value": 0 },
 { "op": "test", "path": "/aliceVersion", "value": 1 },
 { "op": "replace", "path": "/aliceVersion", "value": 2 },
 { "op": "replace", "path": "/guestList/0", "value": "Tomek" }
]
```
Due to asynchronous communication, Patches comes to peer B with different order (A2, A1)

A2 will not be applied as `{ "op": "test", "path": "/aliceVersion", "value": 1 }` rejects it.
then A1 will change the document to

```json
{ 
  "aliceVersion": 0,
  "bobVersion": 1,
  "guestList": ["Thomas"]
}
```

Please note, that additional application logic may use senders version (`aliceVersion` in that case) to queue A2, and apply it later.

### Order conflict detection - collision
An example target JSON document with agreed `/version` as a version path:

```json
{ 
  "version": 0,
  "balance": 5,
  "basket": []
}
```
Peer A applies a patch to the document:

```json
[
 { "op": "test", "path": "/version", "value": 0 },
 { "op": "replace", "path": "/version", "value": 1 },
 { "op": "replace", "path": "/balance", "value": 0 },
 { "op": "add", "path": "/basket/-", "value": "apple" }
]
```

The resulting JSON document:

```json
{ 
  "version": 1,
  "balance": 0,
  "basket": ["apple"]
}
```

In the mean time peer B also changed the document, and sends another patch:

```json
[
 { "op": "test", "path": "/version", "value": 0 },
 { "op": "replace", "path": "/version", "value": 1 },
 { "op": "replace", "path": "/balance", "value": 0 },
 { "op": "add", "path": "/basket/-", "value": "orange" }
]
```

Which will not get applied due to failing `{ "op": "test", "path": "/version", "value": 0 }`. 
Then application logic may use this patch, and version numbers to resolve conflict.