/**
 * Trie Node.
 */
export class InvertedIndexNode<I> {
  documents: Map<I, number> | null;
  children: Map<number, InvertedIndexNode<I>> | null;

  constructor() {
    this.documents = null;
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

  add(term: string, frequency: number, documentId: I): void {
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

    if (node.documents === null) {
      node.documents = new Map<I, number>();
    }
    node.documents.set(documentId, frequency);
  }

  remove(term: string, documentId: I): void {
    const node = this.get(term);
    if (node !== null && node.documents !== null) {
      node.documents.delete(documentId);
    }
  }
}

function _expandTerm<I>(node: InvertedIndexNode<I>, results: string[], term: string): void {
  if (node.documents !== null && node.documents.size > 0) {
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
