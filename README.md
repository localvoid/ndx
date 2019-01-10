# [ndx](https://github.com/ndx-search/ndx) &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/ndx-search/ndx/blob/master/LICENSE) [![npm version](https://img.shields.io/npm/v/ndx.svg)](https://www.npmjs.com/package/ndx) [![codecov](https://codecov.io/gh/ndx-search/ndx/branch/master/graph/badge.svg)](https://codecov.io/gh/ndx-search/ndx) [![CircleCI Status](https://circleci.com/gh/ndx-search/ndx.svg?style=shield&circle-token=:circle-token)](https://circleci.com/gh/ndx-search/ndx) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/ndx-search/ndx)

ndx is a collection of javascript (TypeScript) libraries for lightweight full-text indexing and searching.

## Live Demo

[Reddit Comments Search Engine](https://localvoid.github.io/ndx-demo/) - is a simple demo application that indexes
10,000 reddit comments. Demo application requires modern browser features:
[WebWorkers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) and
[IndexedDB](https://developer.mozilla.org/en/docs/Web/API/IndexedDB_API). Comments are stored in the IndexedDB,
and search engine is working in a WebWorker.

## Features

- Multiple fields full-text indexing and searching.
- Per-field score boosting.
- [BM25](https://en.wikipedia.org/wiki/Okapi_BM25) ranking function to rank matching documents. The same ranking
  function that is used by default in [Lucene](http://lucene.apache.org/core/) >= 6.0.0.
- [Trie](https://en.wikipedia.org/wiki/Trie) based dynamic
  [Inverted Index](https://en.wikipedia.org/wiki/Inverted_index).
- Configurable tokenizer and term filter.
- Free text queries with query expansion.
- Small memory footprint, optimized for mobile devices.
- Serializable/deserializable index.

## Documentation

To check out docs, visit [https://github.com/ndx-search/docs](https://github.com/ndx-search/docs).

## License

[MIT](http://opensource.org/licenses/MIT)
