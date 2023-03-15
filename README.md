# [ndx](https://github.com/ndx-search/ndx) &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/ndx-search/ndx/blob/master/LICENSE)

Lightweight Full-Text Indexing and Searching Library.

This library were designed for a specific use case when all documents are
stored on a disk (IndexedDB) and can be dynamically added or removed to an
index.

Query function supports only disjunction operators. Queries like `one two` will
work as `"one" or "two"`.

Inverted Index doesn't store term locations and query function won't be able
to search for phrases like `"Super Mario"`.

There are many [alternative solutions](https://github.com/leeoniya/uFuzzy#benchmark) with different tradeoffs that may better suit for your
particular use cases. For a simple document search with a static dataset, I
would recommend to use something like [fst](https://github.com/BurntSushi/fst)
and deploy it as an edge function (wasm).

## Features

- Multiple fields full-text indexing and searching.
- Per-field score boosting.
- [BM25](https://en.wikipedia.org/wiki/Okapi_BM25) ranking function to rank
matching documents.
- [Trie](https://en.wikipedia.org/wiki/Trie) based dynamic
[Inverted Index](https://en.wikipedia.org/wiki/Inverted_index).
- Configurable tokenizer and term filter.
- Free text queries with query expansion.

## Example

```js
import { createIndex, indexAdd } from "ndx";
import { indexQuery } from "ndx/query";

const termFilter = (term) => term.toLowerCase();

function createDocumentIndex(fields) {
  // `createIndex()` creates an index data structure.
  // First argument specifies how many different fields we want to index.
  const index = createIndex(
    fields.length,
    // Tokenizer is a function that breaks text into words, phrases, symbols,
    // or other meaningful elements called tokens.
    (s) => s.split(" "),
    // Filter is a function that processes tokens and returns terms, terms are
    // used in Inverted Index to index documents.
    termFilter,
  );
  // `fieldGetters` is an array with functions that will be used to retrieve
  // data from different fields.
  const fieldGetters = fields.map((f) => (doc) => doc[f.name]);
  // `fieldBoostFactors` is an array of boost factors for each field, in this
  // example all fields will have identical weight.
  const fieldBoostFactors = fields.map(() => 1);

  return {
    index,
    // `add()` will add documents to the index.
    add(doc) {
      indexAdd(
        index,
        fieldGetters,
        // Docum  ent key, it can be an unique document id or a refernce to a
        // document if you want to store all documents in memory.
        doc.id,
        // Document.
        doc,
      );
    },
    // `remove()` will remove documents from the index.
    remove(id) {
      // When document is removed we are just marking document id as being
      // removed. Index data structure still contains references to the removed
      // document.
      indexRemove(index, removed, id);
      if (removed.size > 10) {
        // `indexVacuum()` removes all references to removed documents from the
        // index.
        indexVacuum(index, removed);
      }
    },

    // `search()` will be used to perform queries.
    search(q) {
      return indexQuery(
        index,
        fieldBoostFactors,
        // BM25 ranking function constants:
        // BM25 k1 constant, controls non-linear term frequency normalization
        // (saturation).
        1.2,
        // BM25 b constant, controls to what degree document length normalizes
        // tf values.
        0.75,
        q,
      );
    }
  };
}

// Create a document index that will index `content` field.
const index = createDocumentIndex([{ name: "content" }]);

const docs = [
  {
    "id": "1",
    "content": "Lorem ipsum dolor",
  },
  {
    "id": "2",
    "content": "Lorem ipsum",
  }
];

// Add documents to the index.
docs.forEach((d) => { index.add(d); });

// Perform a search query.
index.search("Lorem");
// => [{ key: "2" , score: ... }, { key: "1", score: ... } ]
//
// document with an id `"2"` is ranked higher because it has a `"content"`
// field with a less number of terms than document with an id `"1"`.

index.search("dolor");
// => [{ key: "1", score: ... }]
```

### Tokenizers and Filters

`ndx` library doesn't provide any tokenizers or filters. There are other
libraries that implement tokenizers, for example
[Natural](https://github.com/NaturalNode/natural/) has a good collection of
tokenizers and stemmers.

## License

[MIT](http://opensource.org/licenses/MIT)
