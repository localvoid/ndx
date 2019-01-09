/**
 * Index.
 */
export interface Index<I> {
  /**
   * Document details.
   */
  readonly documents: Map<I, DocumentDetails<I>>;
  /**
   * Inverted index root.
   */
  readonly root: InvertedIndexNode<I>;
  /**
   * Field details.
   */
  readonly fields: FieldDetails[];
}

/**
 * Creates an Index.
 *
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

export interface DocumentPointer<I> {
  next: DocumentPointer<I> | null;
  readonly details: DocumentDetails<I>;
  readonly termFrequency: number[];
}

/**
 * Trie Node.
 */
export interface InvertedIndexNode<I> {
  readonly charCode: number;
  next: InvertedIndexNode<I> | null;
  firstChild: InvertedIndexNode<I> | null;
  firstPosting: DocumentPointer<I> | null;
}

/**
 * Field Details.
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
