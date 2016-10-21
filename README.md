[ndx](http://github.com/localvoid/ndx) is a javascript (TypeScript) document indexing and searching library.

More and more web-applications are starting to work in an offline mode and store data locally, this library solves the
problem with efficient searching on a local data without any servers.

## NPM Package

Npm package `ndx` provides umd module, es6 module and TypeScript typings.

## Example

```js
import { DocumentIndex } from "ndx";

const index = new DocumentIndex();
index.createFieldIndex("title");
index.createFieldIndex("content");

const documents = [
  {
    id: "doc1",
    title: "First Document",
    content: "Lorem ipsum",
  },
  {
    id: "doc2",
    title: "Second Document",
    content: "Lorem ipsum",
  }
];

documents.forEach((doc) => {
  index.add(doc.id, doc);
});

index.search("First");
// => [{ documentId: "doc1", score: ... }]

index.search("Lorem");
// => [{ documentId: "doc1", score: ... }, { documentId: "doc2", score: ... }]

```

## Additional packages

### Filters

#### stemr

[stemr](https://github.com/localvoid/stemr) is an implementation of the Snowball English (porter2) stemmer algorithm.
