import { DocumentDetails } from "./document";
import { Omit } from "./types";

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
 * Create trie nodes for the `term` starting from the `start` character.
 */
function createNodes<I>(parent: InvertedIndexNode<I>, term: string, start: number): InvertedIndexNode<I> {
  for (; start < term.length; start++) {
    const newNode = constructInvertedIndexNode<I>(term.charCodeAt(start));
    if (parent.firstChild === null) {
      parent.firstChild = newNode;
    } else {
      newNode.next = parent.firstChild;
      parent.firstChild = newNode;
    }
    parent = newNode;
  }
  return parent;
}

/**
 * Find trie child node that matches `charCode`.
 */
function findChild<I>(node: InvertedIndexNode<I>, charCode: number): InvertedIndexNode<I> | undefined {
  let child = node.firstChild;
  while (child !== null) {
    if (child.charCode === charCode) {
      return child;
    }
    child = child.next;
  }
  return undefined;
}

/**
 * Inverted Index implemented with a trie data structure.
 */
export class InvertedIndex<I> {
  private readonly root: InvertedIndexNode<I>;

  constructor() {
    this.root = constructInvertedIndexNode<I>(0);
  }

  /**
   * Get trie node that matches the `term`.
   */
  get(term: string): InvertedIndexNode<I> | null {
    let node: InvertedIndexNode<I> | undefined = this.root;

    for (let i = 0; i < term.length; i++) {
      node = findChild(node, term.charCodeAt(i));
      if (node === undefined) {
        return null;
      }
    }

    return node;
  }

  add(term: string, docDetails: DocumentDetails<I>, termFrequency: number[]): void {
    let node = this.root;

    for (let i = 0; i < term.length; i++) {
      if (node.firstChild === null) {
        node = createNodes(node, term, i);
        break;
      }
      const nextNode = findChild(node, term.charCodeAt(i));
      if (nextNode === undefined) {
        node = createNodes(node, term, i);
        break;
      }
      node = nextNode;
    }

    const pointer = {
      next: null,
      details: docDetails,
      termFrequency,
    } as DocumentPointer<I>;

    if (node.firstPosting === null) {
      node.firstPosting = pointer;
    } else {
      pointer.next = node.firstPosting;
      node.firstPosting = pointer;
    }
  }

  /**
   * Expand term with all indexed terms.
   */
  expandTerm(term: string): string[] {
    const node = this.get(term);
    const results = [] as string[];
    if (node !== null) {
      _expandTerm(node, results, term);
    }

    return results;
  }

  /**
   * Remove outdated/removed documents from the index.
   */
  vacuum(): void {
    _vacuum(this.root);
  }
}

function _expandTerm<I>(node: InvertedIndexNode<I>, results: string[], term: string): void {
  if (node.firstPosting !== null && node.firstPosting !== null) {
    results.push(term);
  }
  let child = node.firstChild;
  while (child !== null) {
    _expandTerm(child, results, term + String.fromCharCode(child.charCode));
    child = child.next;
  }
}

function _vacuum<I>(node: InvertedIndexNode<I>): void {
  let prevPointer: DocumentPointer<I> | null = null;
  let pointer = node.firstPosting;
  while (pointer !== null) {
    if (pointer.details.removed) {
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
    _vacuum(child);
    child = child.next;
  }
}

function constructInvertedIndexNode<I>(
  charCode: InvertedIndexNode<I>["charCode"],
  {next = null, firstChild = null, firstPosting = null}: Partial<Omit<InvertedIndexNode<I>, "charCode">> = {},
): InvertedIndexNode<I> {
  return {charCode, next, firstChild, firstPosting};
}
