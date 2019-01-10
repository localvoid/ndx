import {
  createInvertedIndexNode, addInvertedIndexChildNode, findInvertedIndexChildNodeByCharCode, findInvertedIndexNode,
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

  test("inverted index node should be created with null firstPosting", () => {
    const n = create(1);
    expect(n.firstPosting).toBeNull();
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
