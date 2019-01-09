import { createInvertedIndexNode } from "../index";

describe("createInvertedIndexNode", () => {
  test("inverted index node should be created with correct char code", () => {
    const n = createInvertedIndexNode(1);
    expect(n.charCode).toBe(1);
  });

  test("inverted index node should be created with null next value", () => {
    const n = createInvertedIndexNode(1);
    expect(n.next).toBeNull();
  });

  test("inverted index node should be created with null firstChild", () => {
    const n = createInvertedIndexNode(1);
    expect(n.firstChild).toBeNull();
  });

  test("inverted index node should be created with null firstPosting", () => {
    const n = createInvertedIndexNode(1);
    expect(n.firstPosting).toBeNull();
  });
});
