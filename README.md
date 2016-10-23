[ndx](http://github.com/localvoid/ndx) is a lightweight javascript (TypeScript) full-text indexing and searching
library.

- Multiple fields full-text indexing and searching.
- Per-Field score boosting.
- [BM25](https://en.wikipedia.org/wiki/Okapi_BM25) ranking function to rank matching documents. The same ranking
function that is used by default in [Lucene](http://lucene.apache.org/core/) >= 6.0.0.
- [Trie](https://en.wikipedia.org/wiki/Trie) based dynamic Inverted Index that supports updates and removes.
- Free text queries with query expansion.
- Small memory footprint. Inverted Index stores just term frequency in documents. Doesn't require storing documents in
memory.
- Configurable tokenizer and term filter.
- ~1.5kb minified and gzipped.

## NPM Package

Npm package `ndx` provides umd module, es6 module and TypeScript typings.

## Example

```js
import { DocumentIndex } from "ndx";

const index = new DocumentIndex();
index.createIndex("title");
index.createIndex("content");

const documents = [
  {
    id: "doc1",
    title: "First Document",
    content: "Lorem ipsum dolor",
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
// => [{ docId: "doc1", score: ... }]

index.search("Lorem");
// => [{ docId: "doc2", score: ... }, { docId: "doc1", score: ... }]

```

## Additional packages

### Filters

#### stemr

[stemr](https://github.com/localvoid/stemr) is an implementation of the Snowball English (porter2) stemmer algorithm.
