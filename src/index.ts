/**
 * Index data structure.
 *
 * @typeparam T Document key.
 */
export interface DocumentIndex<T> {
  /** Additional information about documents. */
  readonly docs: Map<T, DocumentDetails<T>>;
  /** Inverted index root node. */
  readonly root: InvertedIndexNode<T>;
  /** Sum of field lengths in all documents. */
  readonly fSum: Float64Array;
  /** Average of field lengths in all documents. */
  readonly fAvg: Float64Array;
  /** Number of removed documents. */
  removed: number;
  /**
   * Tokenizer is a function that breaks text into words, phrases, symbols, or
   * other meaningful elements called tokens.
   */
  tokenizer(s: string): string[];
  /**
   * Filter is a function that processes tokens and returns terms, terms are
   * used in Inverted Index to index documents.
   */
  filter(s: string): string,
}

/**
 * Inverted Index Node.
 *
 * Inverted index is implemented with a
 * [trie](https://en.wikipedia.org/wiki/Trie) data structure.
 *
 * @typeparam T Document key.
 */
export interface InvertedIndexNode<T> {
  /** Char code key. */
  k: number;
  /** Children nodes. */
  c: InvertedIndexNode<T>[] | null;
  /** Documents associated with this node. */
  d: DocumentPointer<T>[] | null;
}

/**
 * Document Details object stores additional information about documents.
 *
 * @typeparam T Document key.
 */
export interface DocumentDetails<T> {
  /**
   * Document key. It can be a simple unique ID or a direct reference to an
   * original document.
   */
  readonly key: T;
  /**
   * Field count is an array that contains number of terms in each indexed
   * text field.
   */
  readonly fCount: Int32Array;
  /**
   * Removed flag.
   */
  removed: boolean;
}

/**
 * Document pointer contains information about term frequency for a document.
 *
 * @typeparam T Document key.
 */
export interface DocumentPointer<T> {
  /**
   * Reference to a {@link DocumentDetails} object that is used for this
   * document.
   */
  readonly details: DocumentDetails<T>;
  /**
   * Term frequency in each field.
   */
  readonly tf: Int32Array;
}

const _Int32Array = Int32Array;
const _Float64Array = Float64Array;
const _Map = Map;

const SEARCH_CONTEXT = Object.seal({
  found: false,
  i: 0,
});

const findByCharCode = (array: InvertedIndexNode<any>[], charCode: number) => {
  const ctx = SEARCH_CONTEXT;
  let low = 0;
  let high = array.length;

  while (low < high) {
    const mid = (low + high) >> 1;
    const c = array[mid].k - charCode;
    if (c < 0) {
      low = mid + 1;
    } else if (c > 0) {
      high = mid;
    } else {
      ctx.found = true;
      ctx.i = mid;
      return;
    }
  }
  ctx.found = false;
  ctx.i = low;
};

/**
 * Creates an Index.
 *
 * @typeparam T Document key.
 * @param fieldsNum Number of fields.
 * @returns {@link Index}
 */
export const createIndex = <T>(
  fieldsNum: number,
  tokenizer: (s: string) => string[],
  filter: (s: string) => string,
): DocumentIndex<T> => ({
  docs: new _Map(),
  root: createInvertedIndexNode(0),
  fSum: new _Float64Array(fieldsNum),
  fAvg: new _Float64Array(fieldsNum),
  removed: 0,
  tokenizer,
  filter,
});


/**
 * Creates inverted index node.
 *
 * @typeparam T Document key.
 * @param k Char code.
 * @returnd {@link InvertedIndexNode} instance.
 */
const createInvertedIndexNode = <T>(k: number): InvertedIndexNode<T> => ({
  k,
  c: null,
  d: null,
});

/**
 * Finds inverted index node that matches the `term`.
 *
 * @typeparam T Document key.
 * @param node Root node.
 * @param term Term.
 * @returns Inverted index node that contains `term` or an `undefined` value.
 */
export const findInvertedIndexNode = <T>(
  node: InvertedIndexNode<T> | undefined,
  term: string,
): InvertedIndexNode<T> | undefined => {
  const ctx = SEARCH_CONTEXT;
  let i = 0;
  while (node !== void 0 && i < term.length) {
    const c = node.c;
    if (c === null) {
      return void 0;
    }
    findByCharCode(c, term.charCodeAt(i++));
    if (ctx.found === false) {
      return void 0;
    }
    node = c[ctx.i];
  }
  return node;
};

/**
 * Adds a document to the index.
 *
 * @typeparam T Document key.
 * @typeparam D Document type.
 * @param index {@link DocumentIndex}.
 * @param fieldGetters Field getters.
 * @param key Document key.
 * @param doc Document.
 */
export const indexAdd = <T, D>(
  index: DocumentIndex<T>,
  fieldGetters: Array<(doc: D) => string>,
  key: T,
  doc: D,
): void => {
  const { root, fSum, fAvg, docs, tokenizer, filter } = index;
  const termCounts = new _Map<string, Int32Array>();
  const fCount = new _Int32Array(fieldGetters.length);

  for (let i = 0; i < fieldGetters.length; i++) {
    const field = fieldGetters[i](doc);
    if (field !== void 0) {
      // tokenize text
      const terms = tokenizer(field);

      // filter and count terms, ignore empty strings
      let filteredTermsCount = 0;
      for (let j = 0; j < terms.length; j++) {
        const term = filter(terms[j]);
        if (term !== "") {
          filteredTermsCount++;
          let fieldTermCounts = termCounts.get(term);
          if (fieldTermCounts === void 0) {
            fieldTermCounts = new _Int32Array(fSum.length);
            termCounts.set(term, fieldTermCounts);
          }
          fieldTermCounts[i] += 1;
        }
      }
      fSum[i] += filteredTermsCount;
      fAvg[i] = fSum[i] / (docs.size + 1);
      fCount[i] = filteredTermsCount;
    }
  }

  const details = { key, fCount, removed: false } satisfies DocumentDetails<T>;
  docs.set(key, details);
  termCounts.forEach((termFrequency, term) => {
    const ctx = SEARCH_CONTEXT;
    let node = root;

    for (let i = 0; i < term.length; i++) {
      const charCode = term.charCodeAt(i);
      let newNode;
      if (node.c === null) {
        newNode = createInvertedIndexNode<T>(charCode);
        node.c = [newNode];
        node = newNode;
        continue;
      }
      findByCharCode(node.c, charCode);
      if (ctx.found === false) {
        newNode = createInvertedIndexNode<T>(charCode);
        node.c.splice(ctx.i, 0, newNode);
        node = newNode;
      } else {
        node = node.c[ctx.i];
      }
    }

    const doc = { details, tf: termFrequency } satisfies DocumentPointer<T>;
    if (node.d === null) {
      node.d = [doc];
    } else {
      node.d.push(doc);
    }
  });
};

/**
 * Remove document from the index.
 *
 * @typeparam T Document key.
 * @param index {@link DocumentIndex}.
 * @param key Document key.
 */
export const indexRemove = <T>(
  index: DocumentIndex<T>,
  key: T,
): void => {
  const { docs, fSum, fAvg } = index;
  const docDetails = docs.get(key);

  if (docDetails !== void 0) {
    index.removed++;
    docDetails.removed = true;
    docs.delete(key);
    for (let i = 0; i < fSum.length; i++) {
      const fieldLength = docDetails.fCount[i];
      if (fieldLength > 0) {
        fSum[i] -= fieldLength;
        fAvg[i] = fSum[i] / docs.size;
      }
    }
  }
};

/**
 * Recursively cleans up removed documents from the index.
 *
 * @typeparam T Document key.
 * @param node {@link InvertedIndexNode}
 * @returns `1` when subtree contains any document.
 */
function _vacuumIndex<T>(node: InvertedIndexNode<T>): number {
  let i = 0;
  let ret = 0;
  const d = node.d;
  const c = node.c;

  if (d !== null) {
    while (i < d.length) {
      const doc = d[i];
      if (doc.details.removed === true) {
        if (d.length > 1) {
          d[i] = d[d.length - 1];
        }
        d.pop();
        continue;
      }
      i++;
    }
    if (d.length > 0) {
      ret = 1;
    }
  }

  if (c !== null) {
    i = 0;
    while (i < c.length) {
      const r = _vacuumIndex(c[i]);
      ret |= r;
      if (r === 0) {
        c.splice(i, 1);
      } else {
        i++;
      }
    }
  }

  return ret;
}

/**
 * Cleans up removed documents from the {@link DocumentIndex}.
 *
 * @typeparam T Document key.
 * @param index {@link DocumentIndex}.
 */
export function indexVacuum<T>(index: DocumentIndex<T>): void {
  _vacuumIndex(index.root);
  index.removed = 0;
}
