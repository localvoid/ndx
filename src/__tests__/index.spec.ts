import { createIndex } from "../index";

describe("createIndex", () => {
  test("documents should be an empty Map", () => {
    const n = createIndex(0);
    expect(n.documents).toBeInstanceOf(Map);
    expect(n.documents.size).toBe(0);
  });

  test("inverted index root should be a node with charCode 0", () => {
    const n = createIndex(0);
    expect(n.root.charCode).toBe(0);
  });

  test("field details array should have length equal to fieldNum", () => {
    const n = createIndex(2);
    expect(n.fields.length).toBe(2);
  });
});
