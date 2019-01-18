/**
 * Index data structure.
 *
 * This data structure is optimized for memory consumption and performant mutations during indexing, so it contains only
 * basic information.
 *
 * @typeparam T Document key.
 */
export interface Index<T> {
  /**
   * Additional information about documents.
   */
  readonly docs: Map<T, DocumentDetails<T>>;
  /**
   * Inverted index root node.
   */
  readonly root: InvertedIndexNode<T>;
  /**
   * Additional information about indexed fields in all documents.
   */
  readonly fields: FieldDetails[];
}

/**
 * Creates an Index.
 *
 * @typeparam T Document key.
 * @param fieldsNum Number of fields.
 * @returns {@link Index}
 */
export function createIndex<T>(fieldsNum: number): Index<T> {
  const fields: FieldDetails[] = [];
  for (let i = 0; i < fieldsNum; i++) {
    fields.push({ sum: 0, avg: 0 });
  }
  return {
    docs: new Map<T, DocumentDetails<T>>(),
    root: createInvertedIndexNode(0),
    fields,
  };
}

/**
 * Document Details object stores additional information about documents.
 *
 * @typeparam T Document key.
 */
export interface DocumentDetails<T> {
  /**
   * Document key. It can be a simple unique ID or a direct reference to original document.
   */
  readonly key: T;
  /*
   * Field lengths is an array that contains number of terms in each indexed text field.
   */
  readonly fieldLengths: number[];
}

/**
 * Document pointer contains information about term frequency for a document.
 *
 * @typeparam T Document key.
 */
export interface DocumentPointer<T> {
  /**
   * Next {@link DocumentPointer} in the intrusive linked list.
   */
  next: DocumentPointer<T> | null;
  /**
   * Reference to a {@link DocumentDetails} object that is used for this document.
   */
  readonly details: DocumentDetails<T>;
  /**
   * Term frequency in each field.
   */
  readonly termFrequency: number[];
}

/**
 * Inverted Index Node.
 *
 * Inverted index is implemented with a [trie](https://en.wikipedia.org/wiki/Trie) data structure.
 *
 * @typeparam T Document key.
 */
export interface InvertedIndexNode<T> {
  /**
   * Char code is used to store keys in the trie data structure.
   */
  readonly charCode: number;
  /**
   * Next {@link InvertedIndexNode} in the intrusive linked list.
   */
  next: InvertedIndexNode<T> | null;
  /**
   * Linked list of children {@link InvertedIndexNode}.
   */
  firstChild: InvertedIndexNode<T> | null;
  /**
   * Linked list of documents associated with this node.
   */
  firstDoc: DocumentPointer<T> | null;
}

/**
 * Field Details contains additional information about fields.
 */
export interface FieldDetails {
  /**
   * Sum of field lengths in all documents.
   */
  sum: number;
  /**
   * Average of field lengths in all documents.
   */
  avg: number;
}

/**
 * Creates inverted index node.
 *
 * @typeparam T Document key.
 * @param charCode Char code.
 * @returnd {@link InvertedIndexNode} instance.
 */
export function createInvertedIndexNode<T>(charCode: number): InvertedIndexNode<T> {
  return {
    charCode,
    next: null,
    firstChild: null,
    firstDoc: null,
  };
}

/**
 * Finds inverted index node that matches the `term`.
 *
 * @typeparam T Document key.
 * @param node Root node.
 * @param term Term.
 * @returns Inverted index node that contains `term` or an `undefined` value.
 */
export function findInvertedIndexNode<T>(
  node: InvertedIndexNode<T> | undefined,
  term: string,
): InvertedIndexNode<T> | undefined {
  for (let i = 0; node !== void 0 && i < term.length; i++) {
    node = findInvertedIndexChildNodeByCharCode(node, term.charCodeAt(i));
  }
  return node;
}

/**
 * Finds inverted index child node with matching `charCode`.
 *
 * @typeparam T Document key.
 * @param node {@link InvertedIndexNode}
 * @param charCode Char code.
 * @returns Matching {@link InvertedIndexNode} or `undefined`.
 */
export function findInvertedIndexChildNodeByCharCode<T>(
  node: InvertedIndexNode<T>,
  charCode: number,
): InvertedIndexNode<T> | undefined {
  let child = node.firstChild;
  while (child !== null) {
    if (child.charCode === charCode) {
      return child;
    }
    child = child.next;
  }
  return void 0;
}

/**
 * Adds inverted index child node.
 *
 * @typeparam T Document key.
 * @param parent Parent node.
 * @param child Child node to add.
 */
export function addInvertedIndexChildNode<T>(parent: InvertedIndexNode<T>, child: InvertedIndexNode<T>): void {
  if (parent.firstChild !== null) {
    child.next = parent.firstChild;
  }
  parent.firstChild = child;
}

/**
 * Adds document to inverted index node.
 *
 * @typeparam T Document key.
 * @param node Inverted index node.
 * @param doc Posting.
 */
export function addInvertedIndexDoc<T>(node: InvertedIndexNode<T>, doc: DocumentPointer<T>): void {
  if (node.firstDoc !== null) {
    doc.next = node.firstDoc;
  }
  node.firstDoc = doc;
}

/**
 * Adds a document to the index.
 *
 * @typeparam T Document key.
 * @typeparam D Document type.
 * @param index {@link Index}.
 * @param fieldAccessors Field accessors.
 * @param tokenizer Tokenizer is a function that breaks a text into words, phrases, symbols, or other meaningful
 *  elements called tokens.
 * @param filter Filter is a function that processes tokens and returns terms, terms are used in Inverted Index to index
 *  documents.
 * @param key Document key.
 * @param doc Document.
 */
export function addDocumentToIndex<T, D>(
  index: Index<T>,
  fieldAccessors: Array<(doc: D) => string>,
  tokenizer: (s: string) => string[],
  filter: (s: string) => string,
  key: T,
  doc: D,
): void {
  const { docs, root, fields } = index;
  const fieldLengths = [];
  const termCounts = new Map<string, number[]>();

  for (let i = 0; i < fields.length; i++) {
    const fieldValue = fieldAccessors[i](doc);
    if (fieldValue === void 0) {
      fieldLengths.push(0);
    } else {
      const fieldDetails = fields[i];
      // tokenize text
      const terms = tokenizer(fieldValue);

      // filter and count terms, ignore empty strings
      let filteredTermsCount = 0;
      for (let j = 0; j < terms.length; j++) {
        const term = filter(terms[j]);
        if (term !== "") {
          filteredTermsCount++;
          let counts = termCounts.get(term);
          if (counts === void 0) {
            counts = new Array<number>(fields.length).fill(0);
            termCounts.set(term, counts);
          }
          counts[i] += 1;
        }
      }

      fieldDetails.sum += filteredTermsCount;
      fieldDetails.avg = fieldDetails.sum / (docs.size + 1);
      fieldLengths[i] = filteredTermsCount;
    }
  }

  const details: DocumentDetails<T> = { key, fieldLengths };
  docs.set(key, details);
  termCounts.forEach((termFrequency, term) => {
    let node = root;

    for (let i = 0; i < term.length; i++) {
      if (node.firstChild === null) {
        node = createInvertedIndexNodes(node, term, i);
        break;
      }
      const nextNode = findInvertedIndexChildNodeByCharCode(node, term.charCodeAt(i));
      if (nextNode === void 0) {
        node = createInvertedIndexNodes(node, term, i);
        break;
      }
      node = nextNode;
    }

    addInvertedIndexDoc(node, { next: null, details, termFrequency });
  });
}

/**
 * Creates inverted index nodes for the `term` starting from the `start` character.
 *
 * @typeparam T Document key.
 * @param parent Parent node.
 * @param term Term.
 * @param start First char code position in the `term`.
 * @returns Leaf {@link InvertedIndexNode}.
 */
function createInvertedIndexNodes<T>(
  parent: InvertedIndexNode<T>,
  term: string,
  start: number,
): InvertedIndexNode<T> {
  for (; start < term.length; start++) {
    const newNode = createInvertedIndexNode<T>(term.charCodeAt(start));
    addInvertedIndexChildNode(parent, newNode);
    parent = newNode;
  }
  return parent;
}

/**
 * Remove document from the index.
 *
 * @typeparam T Document key.
 * @param index {@link Index}.
 * @param removed Set of removed document ids.
 * @param key Document key.
 */
export function removeDocumentFromIndex<T>(index: Index<T>, removed: Set<T>, key: T): void {
  const { docs: documents, fields } = index;
  const docDetails = documents.get(key);
  if (docDetails !== void 0) {
    removed.add(key);
    documents.delete(key);
    for (let i = 0; i < fields.length; i++) {
      const fieldLength = docDetails.fieldLengths[i];
      if (fieldLength > 0) {
        const field = fields[i];
        field.sum -= fieldLength;
        field.avg = field.sum / documents.size;
      }
    }
  }
}

/**
 * Cleans up removed documents from the {@link Index}.
 *
 * @typeparam T Document key.
 * @param index {@link Index}.
 * @param removed Set of removed document ids.
 */
export function vacuumIndex<T>(index: Index<T>, removed: Set<T>): void {
  _vacuumIndex(index.root, removed);
  removed.clear();
}

/**
 * Recursively cleans up removed documents from the index.
 *
 * @typeparam T Document key.
 * @param node {@link InvertedIndexNode}
 * @param removed Set of removed document ids.
 * @returns `1` when subtree contains any document.
 */
function _vacuumIndex<T>(node: InvertedIndexNode<T>, removed: Set<T>): number {
  let prevPointer: DocumentPointer<T> | null = null;
  let pointer = node.firstDoc;
  while (pointer !== null) {
    const id = pointer.details.key;
    if (removed.has(id)) {
      if (prevPointer === null) {
        node.firstDoc = pointer.next;
      } else {
        prevPointer.next = pointer.next;
      }
    } else {
      prevPointer = pointer;
    }
    pointer = pointer.next;
  }

  let prevChild: InvertedIndexNode<T> | null = null;
  let child = node.firstChild;
  let ret = node.firstDoc === null ? 0 : 1;
  while (child !== null) {
    const r = _vacuumIndex(child, removed);
    ret |= r;
    if (r === 0) { // subtree doesn't have any documents, remove this node
      if (prevChild === null) {
        node.firstChild = child.next;
      } else {
        prevChild.next = child.next;
      }
    } else {
      prevChild = child;
    }
    child = child.next;
  }

  return ret;
}
