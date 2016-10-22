import { DocumentDetails } from "./document";

export interface DocumentPointer<I> {
  readonly details: DocumentDetails<I>;
  readonly termFrequency: number[];
}

/**
 * Trie Node.
 */
export class InvertedIndexNode<I> {
  postings: DocumentPointer<I>[] | null;
  children: Map<number, InvertedIndexNode<I>> | null;

  constructor() {
    this.postings = null;
    this.children = null;
  }
}

function createNodes<I>(parent: InvertedIndexNode<I>, term: string, start: number): InvertedIndexNode<I> {
  for (; start < term.length; start++) {
    const c = term.charCodeAt(start);
    const newNode = new InvertedIndexNode<I>();
    if (parent.children === null) {
      parent.children = new Map<number, InvertedIndexNode<I>>();
    }
    parent.children.set(c, newNode);
    parent = newNode;
  }
  return parent;
}

/**
 * Inverted Index implemented with a trie data structure.
 */
export class InvertedIndex<I> {
  root: InvertedIndexNode<I>;

  constructor() {
    this.root = new InvertedIndexNode<I>();
  }

  get(term: string): InvertedIndexNode<I> | null {
    let node: InvertedIndexNode<I> | undefined = this.root;

    for (let i = 0; i < term.length; i++) {
      if (node.children === null) {
        return null;
      }
      node = node.children.get(term.charCodeAt(i));
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
      const nextNode = node.children.get(term.charCodeAt(i));
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
    node.children.forEach((node, key) => {
      _expandTerm(node, results, term + String.fromCharCode(key));
    });
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
