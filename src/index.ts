/**
 * Index data structure.
 *
 * This data structure is optimized for memory consumption and performant mutations during indexing, so it contains only
 * basic information.
 *
 * @typeparam I Document ID type.
 */
export interface Index<I> {
  /**
   * Additional information about documents.
   */
  readonly documents: Map<I, DocumentDetails<I>>;
  /**
   * Inverted index root node.
   */
  readonly root: InvertedIndexNode<I>;
  /**
   * Additional information about indexed fields in all documents.
   */
  readonly fields: FieldDetails[];
}

/**
 * Creates an Index.
 *
 * @typeparam I Document ID type.
 * @param fieldsNum Number of fields.
 * @returns {@link Index}
 */
export function createIndex<I>(fieldsNum: number): Index<I> {
  const fields: FieldDetails[] = [];
  for (let i = 0; i < fieldsNum; i++) {
    fields.push({ sum: 0, avg: 0 });
  }
  return {
    documents: new Map<I, DocumentDetails<I>>(),
    root: createInvertedIndexNode(0),
    fields,
  };
}

/**
 * Document Details object stores additional information about documents.
 *
 * @typeparam I Document ID type.
 */
export interface DocumentDetails<I> {
  /**
   * Document ID.
   */
  readonly id: I;
  /*
   * Field lengths is an array that contains number of terms in each indexed text field.
   */
  readonly fieldLengths: number[];
}

/**
 * Document pointer contains information about term frequency for a document.
 *
 * @typeparam I Document ID type.
 */
export interface DocumentPointer<I> {
  /**
   * Next {@link DocumentPointer} in the intrusive linked list.
   */
  next: DocumentPointer<I> | null;
  /**
   * Reference to a {@link DocumentDetails} object that is used for this document.
   */
  readonly details: DocumentDetails<I>;
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
 * @typeparam I Document ID type.
 */
export interface InvertedIndexNode<I> {
  /**
   * Char code is used to store keys in the trie data structure.
   */
  readonly charCode: number;
  /**
   * Next {@link InvertedIndexNode} in the intrusive linked list.
   */
  next: InvertedIndexNode<I> | null;
  /**
   * Linked list of children {@link InvertedIndexNode}.
   */
  firstChild: InvertedIndexNode<I> | null;
  /**
   * Linked list of documents associated with this node.
   *
   * Term `posting` is used in a traditional literature about information retrieval, see
   * [Introduction to Information Retrieval](https://nlp.stanford.edu/IR-book/information-retrieval-book.html) for
   * more details.
   */
  firstPosting: DocumentPointer<I> | null;
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
 * @typeparam I Document ID type.
 * @param charCode Char code.
 * @returnd {@link InvertedIndexNode} instance.
 */
export function createInvertedIndexNode<I>(charCode: number): InvertedIndexNode<I> {
  return {
    charCode,
    next: null,
    firstChild: null,
    firstPosting: null,
  };
}

/**
 * Finds inverted index node that matches the `term`.
 *
 * @typeparam I Document ID type.
 * @param node Root node.
 * @param term Term.
 * @returns Inverted index node that contains `term` or an `undefined` value.
 */
export function findInvertedIndexNode<I>(
  node: InvertedIndexNode<I> | undefined,
  term: string,
): InvertedIndexNode<I> | undefined {
  for (let i = 0; node !== void 0 && i < term.length; i++) {
    node = findInvertedIndexChildNodeByCharCode(node, term.charCodeAt(i));
  }
  return node;
}

/**
 * Finds inverted index child node with matching `charCode`.
 *
 * @typeparam I Document ID type.
 * @param node {@link InvertedIndexNode}
 * @param charCode Char code.
 * @returns Matching {@link InvertedIndexNode} or `undefined`.
 */
export function findInvertedIndexChildNodeByCharCode<I>(
  node: InvertedIndexNode<I>,
  charCode: number,
): InvertedIndexNode<I> | undefined {
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
 * @typeparam I Document ID type.
 * @param parent Parent node.
 * @param child Child node to add.
 */
export function addInvertedIndexChildNode<I>(parent: InvertedIndexNode<I>, child: InvertedIndexNode<I>): void {
  if (parent.firstChild !== null) {
    child.next = parent.firstChild;
  }
  parent.firstChild = child;
}

/**
 * Adds posting to inverted index node.
 *
 * @typeparam I Document ID type.
 * @param node Inverted index node.
 * @param posting Posting.
 */
export function addInvertedIndexPosting<I>(node: InvertedIndexNode<I>, posting: DocumentPointer<I>): void {
  if (node.firstPosting !== null) {
    posting.next = node.firstPosting;
  }
  node.firstPosting = posting;
}

/**
 * Adds a document to the index.
 *
 * @typeparam I Document ID type.
 * @param index {@link Index}.
 * @param fieldAccessors Field accessors.
 * @param tokenizer Tokenizer is a function that breaks a text into words, phrases, symbols, or other meaningful
 *  elements called tokens.
 * @param filter Filter is a function that processes tokens and returns terms, terms are used in Inverted Index to index
 *  documents.
 * @param id Document ID.
 * @param document Document.
 */
export function addDocumentToIndex<I, D>(
  index: Index<I>,
  fieldAccessors: Array<(doc: D) => string>,
  tokenizer: (s: string) => string[],
  filter: (s: string) => string,
  id: I,
  document: D,
): void {
  const { documents, root, fields } = index;
  const fieldLengths = [];
  const termCounts = new Map<string, number[]>();

  for (let i = 0; i < fields.length; i++) {
    const fieldValue = fieldAccessors[i](document);
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
      fieldDetails.avg = fieldDetails.sum / (documents.size + 1);
      fieldLengths[i] = filteredTermsCount;
    }
  }

  const details: DocumentDetails<I> = { id, fieldLengths };
  documents.set(id, details);
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

    addInvertedIndexPosting(node, { next: null, details, termFrequency });
  });
}

/**
 * Creates inverted index nodes for the `term` starting from the `start` character.
 *
 * @typeparam I Document ID type.
 * @param parent Parent node.
 * @param term Term.
 * @param start First char code position in the `term`.
 * @returns Leaf {@link InvertedIndexNode}.
 */
function createInvertedIndexNodes<I>(
  parent: InvertedIndexNode<I>,
  term: string,
  start: number,
): InvertedIndexNode<I> {
  for (; start < term.length; start++) {
    const newNode = createInvertedIndexNode<I>(term.charCodeAt(start));
    addInvertedIndexChildNode(parent, newNode);
    parent = newNode;
  }
  return parent;
}

/**
 * Remove document from the index.
 *
 * @typeparam I Document ID type.
 * @param index {@link Index}.
 * @param removed Set of removed document ids.
 * @param id Document ID.
 */
export function removeDocumentFromIndex<I>(index: Index<I>, removed: Set<I>, id: I): void {
  const { documents, fields } = index;
  const docDetails = documents.get(id);
  if (docDetails !== void 0) {
    removed.add(id);
    documents.delete(id);
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
 * @typeparam I Document ID type.
 * @param index {@link Index}.
 * @param removed Set of removed document ids.
 */
export function vacuumIndex<I>(index: Index<I>, removed: Set<I>): void {
  _vacuumIndex(index.root, removed);
  removed.clear();
}

/**
 * Recursively cleans up removed postings from the index.
 *
 * @typeparam I Document ID type.
 * @param node {@link InvertedIndexNode}
 * @param removed Set of removed document ids.
 */
function _vacuumIndex<I>(node: InvertedIndexNode<I>, removed: Set<I>): void {
  let prevPointer: DocumentPointer<I> | null = null;
  let pointer = node.firstPosting;
  while (pointer !== null) {
    const id = pointer.details.id;
    if (removed.has(id)) {
      if (prevPointer === null) {
        node.firstPosting = pointer.next;
      } else {
        prevPointer.next = pointer.next;
      }
    } else {
      prevPointer = pointer;
    }
    pointer = pointer.next;
  }

  let child = node.firstChild;
  while (child !== null) {
    _vacuumIndex(child, removed);
    child = child.next;
  }
}
