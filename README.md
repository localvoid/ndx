[ndx](http://github.com/localvoid/ndx) is a lightweight javascript (TypeScript) full-text indexing and searching
library.

## Features

- Multiple fields full-text indexing and searching.
- Per-Field score boosting.
- [BM25](https://en.wikipedia.org/wiki/Okapi_BM25) ranking function to rank matching documents. The same ranking
  function that is used by default in [Lucene](http://lucene.apache.org/core/) >= 6.0.0.
- [Trie](https://en.wikipedia.org/wiki/Trie) based dynamic Inverted Index that supports updates and removes.
- Configurable tokenizer and term filter.
- Free text queries with query expansion.
- Small memory footprint.
- ~1.7kb minified and gzipped.

## NPM Package

Npm package `ndx` provides umd module, es6 module and TypeScript typings.

## Example

```js
import { DocumentIndex } from "ndx";

const index = new DocumentIndex();
index.addField("title");
index.addField("content");

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

## Documentation

### Creating a new Document Index

`DocumentIndex<I, D>(options?: DocumentIndexOptions)`

#### Parametric Types

- `I` is a type of document IDs.
- `D` is a type of documents.

#### Options

```ts
/**
 * BM25 Ranking function constants.
 */
interface BM25Options {
  /**
   * Controls non-linear term frequency normalization (saturation).
   *
   * Default value: 1.2
   */
  k1?: number;

  /**
   * Controls to what degree document length normalizes tf values.
   *
   * Default value: 0.75
   */
  b?: number;
}

interface DocumentIndexOptions {
  /**
   * BM25 Ranking function constants.
   */
  bm25?: BM25Options;
}
```

#### Example

```js
/**
 * Creating a simple index with default options.
 */
const default = new DocumentIndex();

/**
 * Creating an index with changed BM25 constants.
 */
const index = new DocumentIndex({
  bm25: {
    k1: 1.3,
    b: 0.8,
  },
});
```

### Adding a text field to an index

`addField(fieldName: string, options?: FieldOptions) => void`

#### Options

```ts
interface FieldOptions<D> {
  /**
   * Getter is a function that will be used to get value for this field. If getter function isn't specified, field name
   * will be used to get value.
   */
  getter: (doc: D) => string;

  /**
   * Score boosting factor.
   */
  boost: number;
}
```

#### Example

```js
const index = new DocumentIndex();

/**
 * Add a "title" field with a score boosting factor "1.4".
 */
index.addField("title", { boost: 1.4 });

/**
 * Add a "descriptionr" field.
 */
index.addField("description");

/**
 * Add a "body" field with a custom getter.
 */
index.addField("body", { getter: (doc) => doc.body });
```

### Adding a document to an index

`add(docId: I, document: D) => void`

#### Example

```js
const index = new DocumentIndex();

/**
 * Add a "content" field.
 */
index.addField("content");

const doc = {
  "id": "12345",
  "content": "Lorem ipsum",
};

/**
 * Add a document with `doc.id` to an index.
 */
index.add(doc.id, doc);
```

### Removing document from an index

`remove(docId: I) => void`

#### Example

```js
const index = new DocumentIndex();

/**
 * Add a "content" field.
 */
index.addField("content");

const doc = {
  "id": "12345",
  "content": "Lorem ipsum",
};

/**
 * Add a document with `doc.id` to an index.
 */
index.add(doc.id, doc);

/**
 * Remove a document from an index.
 */
index.remove(doc.id);
```

### Search a document with a free text query

`search(query: string) => SearchResult[]`

```ts
interface SearchResult<I> {
  docId: I;
  score: number;
}
```

#### Example

```js
const index = new DocumentIndex();

/**
 * Add a "content" field.
 */
index.addField("content");

const doc1 = {
  "id": "1",
  "content": "Lorem ipsum dolor",
};
const doc2 = {
  "id": "2",
  "content": "Lorem ipsum",
};

/**
 * Add two documents to an index.
 */
index.add(doc1.id, doc1);
index.add(doc2.id, doc2);

/**
 * Perform a search query.
 */
index.search("Lorem");
// => [{ docId: "2" , score: ... }, { docId: "1", score: ... } ]
//
// document with an id `"2"` is ranked higher because it has a `"content"` field with a less number of terms than
// document with an id `"1"`.

index.search("dolor");
// => [{ docId: "1" }]
```

### Changing a default tokenizer

`setTokenizer(tokenizer: (text: string) => token) => void`

#### Example

```js
const index = new DocumentIndex();

/**
 * Set a tokenizer that will break on whitespaces and "-" symbols.
 */
index.setTokenizer((text) => text.trim().split(/[\s-]+/));
```

### Changing a default term filter

#### Example

```js
/**
 * Import a snowball(english) stemmer from `stemr` package.
 */
import { stem } from "stemr";

const index = new DocumentIndex();

/**
 * Set a filter that will preprocess terms by lower casing all characters, removing all non-word characters at the edges
 * and stem with a snowball stemmer.
 */
index.setFilter((term) => stem(term.toLowerCase().replace(/^\W+/, "").replace(/\W+$/, "")));
```

### Extending a term

`extendTerm(term: string) => string[]`

#### Example

```js
const index = new DocumentIndex();

index.addField("content");

const doc1 = {
  "id": "1",
  "content": "abc abcde",
};
const doc2 = {
  "id": "2",
  "content": "ab de",
};

index.add(doc1.id, doc1);
index.add(doc2.id, doc2);

/**
 * Extend a term with all possible combinations starting from `"a"`.
 */
index.extendTerm("a");
// => ["ab", "abc", "abcde"]

index.extendTerm("abc");
// => ["abc", "abcde"]

index.extendTerm("de");
// => ["de"]
```

### Vacuuming

`vacuum() => void`

#### Example

```js
const index = new DocumentIndex();

index.addField("content");

const doc = {
  "id": "12345",
  "content": "Lorem ipsum",
};

index.add(doc.id, doc);
index.remove(doc.id);

/**
 * Perform a vacuuming, it will remove all removed documents from an Inverted Index.
 */
index.vacuum();
```

## Useful packages

### Text Procesing

- [stemr](https://github.com/localvoid/stemr) is an optimized implementation of the Snowball English (porter2) stemmer
  algorithm.
- [Natural](https://github.com/NaturalNode/natural/) is a general natural language facility for nodejs. Tokenizing,
  stemming, classification, phonetics, tf-idf, WordNet, string similarity, and some inflections are currently supported.
- [stopword](https://github.com/fergiemcdowall/stopword) is a node module that allows you to strip stopwords from an
  input text.

### Alternative Javascript Full-Text Search Engines

- [lunr](https://github.com/olivernn/lunr.js)
- [search-index](https://github.com/fergiemcdowall/search-index)
- [elasticlunr](https://github.com/weixsong/elasticlunr.js)
