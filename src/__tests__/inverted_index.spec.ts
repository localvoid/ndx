import {
  createInvertedIndexNode, addInvertedIndexChildNode, findInvertedIndexChildNodeByCharCode, findInvertedIndexNode,
  addInvertedIndexDoc,
} from "..";

const create = (charCode: number) => createInvertedIndexNode<number>(charCode);

describe("createInvertedIndexNode", () => {
  test("inverted index node should be created with correct char code", () => {
    const n = create(1);
    expect(n.charCode).toBe(1);
  });

  test("inverted index node should be created with null next value", () => {
    const n = create(1);
    expect(n.next).toBeNull();
  });

  test("inverted index node should be created with null firstChild", () => {
    const n = create(1);
    expect(n.firstChild).toBeNull();
  });

  test("inverted index node should be created with null firstDoc", () => {
    const n = create(1);
    expect(n.firstDoc).toBeNull();
  });
});

describe("findInvertedIndexChildNodeByCharCode", () => {
  test("empty children list should return undefined", () => {
    const p = create(0);
    expect(findInvertedIndexChildNodeByCharCode(p, 0)).toBeUndefined();
  });

  test("searching for an unexisting node should return undefined", () => {
    const p = create(0);
    const c1 = create(1);
    const c2 = create(2);
    addInvertedIndexChildNode(p, c1);
    addInvertedIndexChildNode(p, c2);
    expect(findInvertedIndexChildNodeByCharCode(p, 0)).toBeUndefined();
  });

  test("searching for existing node should return node associated with provided charCode", () => {
    const p = create(0);
    const c1 = create(1);
    const c2 = create(2);
    addInvertedIndexChildNode(p, c1);
    addInvertedIndexChildNode(p, c2);
    expect(findInvertedIndexChildNodeByCharCode(p, 1)).toBe(c1);
    expect(findInvertedIndexChildNodeByCharCode(p, 2)).toBe(c2);
  });
});

describe("findInvertedIndexNode", () => {
  test("empty trie should return undefined", () => {
    const p = create(0);
    expect(findInvertedIndexNode(p, "abc")).toBeUndefined();
  });

  test("searching for an unexisting node should return undefined", () => {
    const p = create(0);
    const a = create(97);
    const b = create(98);
    const c = create(99);
    addInvertedIndexChildNode(p, a);
    addInvertedIndexChildNode(a, b);
    addInvertedIndexChildNode(b, c);
    expect(findInvertedIndexNode(p, "abc")).toBe(c);
  });
});

describe("addInvertedIndexPosting", () => {
  test("should add one node", () => {
    const n = create(0);
    const p = {
      next: null,
      details: {
        key: 0,
        fieldLengths: [],
      },
      termFrequency: [],
    };
    addInvertedIndexDoc(n, p);
    expect(n.firstDoc).toBe(p);
  });

  test("should add two nodes", () => {
    const n = create(0);
    const p1 = {
      next: null,
      details: {
        key: 0,
        fieldLengths: [],
      },
      termFrequency: [],
    };
    const p2 = {
      next: null,
      details: {
        key: 0,
        fieldLengths: [],
      },
      termFrequency: [],
    };
    addInvertedIndexDoc(n, p1);
    addInvertedIndexDoc(n, p2);
    expect(n.firstDoc).toBe(p2);
    expect(p2.next).toBe(p1);
    expect(p1.next).toBe(null);
  });
});
