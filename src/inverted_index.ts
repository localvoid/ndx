import { DocumentDetails } from "./document";

export interface DocumentPointer<I> {
  readonly details: DocumentDetails<I>;
  readonly termFrequency: number[];
}

/**
 * Trie Node.
 */
export class InvertedIndexNode<I> {
  readonly charCode: number;
  postings: DocumentPointer<I>[] | null;
  children: InvertedIndexNode<I>[] | null;

  constructor(charCode: number) {
    this.charCode = charCode;
    this.postings = null;
    this.children = null;
  }
}

/**
 * Create trie nodes for the `term` starting from the `start` character.
 */
function createNodes<I>(parent: InvertedIndexNode<I>, term: string, start: number): InvertedIndexNode<I> {
  for (; start < term.length; start++) {
    const newNode = new InvertedIndexNode<I>(term.charCodeAt(start));
    if (parent.children === null) {
      parent.children = [];
    }
    parent.children.push(newNode);
    parent = newNode;
  }
  return parent;
}

/**
 * Find trie child node that matches `charCode`.
 */
function findChild<I>(node: InvertedIndexNode<I>, charCode: number): InvertedIndexNode<I> | undefined {
  if (node.children !== null) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (child.charCode === charCode) {
        return child;
      }
    }
  }
  return undefined;
}

/**
 * Inverted Index implemented with a trie data structure.
 */
export class InvertedIndex<I> {
  root: InvertedIndexNode<I>;

  constructor() {
    this.root = new InvertedIndexNode<I>(0);
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
      if (node.children === null) {
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

    if (node.postings === null) {
      node.postings = [];
    }
    node.postings.push({
      details: docDetails,
      termFrequency: termFrequency,
    });
  }
}

function _expandTerm<I>(node: InvertedIndexNode<I>, results: string[], term: string): void {
  if (node.postings !== null && node.postings.length > 0) {
    results.push(term);
  }
  if (node.children !== null) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      _expandTerm(child, results, term + String.fromCharCode(child.charCode));
    }
  }
}

/**
 * Expand term with all indexed terms.
 */
export function invertedIndexExpandTerm<I>(index: InvertedIndex<I>, term: string): string[] {
  const node = index.get(term);
  const results = [] as string[];
  if (node !== null) {
    _expandTerm(node, results, term);
  }

  return results;
}
