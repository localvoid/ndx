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

- [Creating a new Document Index](#create_index)
- [Adding a text field to an index](#add_field)
- [Changing a tokenizer](#set_tokenizer)
- [Changing a term filter](#set_filter)
- [Adding a document to an index](#add_doc)
- [Removing a document from an index](#remove_doc)
- [Search with a free text query](#search)
- [Vacuuming](#vacuum)

### <a name="create_index"></a>Creating a new Document Index

`DocumentIndex<I, D>(options?: DocumentIndexOptions)`

Document Index is a main object that stores all internal statistics and Inverted Index for documents.

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

### <a name="add_field"></a>Adding a text field to an index

`addField(fieldName: string, options?: FieldOptions) => void`

The first step after creating a document index should be registering all text fields. Document Index is indexing only
registered text fields in documents.

Each field can have its own score boosting factor, score boosting factor will be used to boost score when ranking
documents.

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

### <a name="set_tokenizer"></a>Changing a tokenizer

Tokenizer is a function that breaks a text into words, phrases, symbols, or other meaningful elements called tokens.

Default ndx tokenizer breaks words on spaces, tabs, line feeds and assumes that contiguous nonwhitespace characters
form a single token.

`setTokenizer(tokenizer: (text: string) => token) => void`

#### Example

```js
const index = new DocumentIndex();

/**
 * Set a tokenizer that will break on whitespaces and "-" symbols.
 */
index.setTokenizer((text) => text.trim().split(/[\s-]+/));
```

### <a name="set_filter"></a>Changing a term filter

Filter is a function that processes tokens and returns terms, terms are used in Inverted Index to index documents.

Default ndx filter transforms all characters to lower case and removes all non-word characters at the beginning and
the end of a term.

#### Example

```js
/**
 * Import a snowball(english) stemmer from `stemr` package.
 */
import { stem } from "stemr";

const index = new DocumentIndex();

/**
 * Set a filter that will process tokens by lower casing all characters, removing all non-word characters at the
 * beginning and the end of a term and stemming with a snowball stemmer.
 */
index.setFilter((term) => stem(term.toLowerCase().replace(/^\W+/, "").replace(/\W+$/, "")));
```

### <a name="add_doc"></a>Adding a document to an index

When all fields are registered, tokenizer and filter is set, Document Index is ready to index documents.

Document Index doesn't store documents internally to reduce memory footprint, all results will contain a `docId` that is
associated with an added document.

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

### <a name="remove_doc"></a>Removing a document from an index

Remove method requires to know just document id to remove it from an index. When document is removed from an index, it
is actually marked as removed, and when searching all removed documents will be ignored. `vacuum()` method is used to
completely remove all data from an index.

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

### <a name="search"></a>Search with a free text query

Perform a search query with a free text, query will be preprocessed in the same way as all text fields with a registered
tokenizer and filter. Each token separator will work as a disjunction operator. All terms will be expanded to find more
documents, documents with expanded terms will have a lower score than documents with exact terms.

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

### Extending a term

Extend a term with all possible combinations starting from a `term` that is registered in an index.

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

### <a name="vacuum"></a>Vacuuming

Vacuuming is a process that will remove all outdated documents from an inverted index.

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
