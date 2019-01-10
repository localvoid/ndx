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
