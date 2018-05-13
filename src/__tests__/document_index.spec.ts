import { DocumentIndex } from "../document_index";

const DOCS = [
  {
    id: "a",
    title: "a",
    body: "Lorem ipsum dolor",
  },
  {
    id: "b",
    title: "b",
    body: "Lorem ipsum",
  },
  {
    id: "c",
    title: "c",
    body: "sit amet",
  },
];

describe("DocumentIndex", () => {
  describe("empty", () => {
    test("should have size 0", () => {
      const idx = new DocumentIndex<string, { id: string, title: string, body: string }>();
      expect(idx.size).toBe(0);
    });

    test("should perform search queries", () => {
      const idx = new DocumentIndex<string, { id: string, title: string, body: string }>();
      expect(idx.search("a")).toEqual([]);
    });
  });

  describe("multiple docs", () => {
    test("should index multiple fields", () => {
      const idx = new DocumentIndex<string, { id: string, title: string, body: string }>();
      idx.addField("title");
      idx.addField("body");
      DOCS.forEach((d) => {
        idx.add(d.id, d);
      });

      let result = idx.search("lorem");
      expect(result.length).toBe(2);
      expect(result[0].docId).toBe("b");
      expect(result[1].docId).toBe("a");

      result = idx.search("b");
      expect(result.length).toBe(1);
      expect(result[0].docId).toBe("b");

      result = idx.search("a");
      expect(result.length).toBe(2);
      expect(result[0].docId).toBe("a");
      expect(result[1].docId).toBe("c");
    });

    test("should remove documents", () => {
      const idx = new DocumentIndex<string, { id: string, title: string, body: string }>();
      idx.addField("title");
      idx.addField("body");
      DOCS.forEach((d) => {
        idx.add(d.id, d);
      });
      idx.remove("a");

      let result = idx.search("lorem");
      expect(result.length).toBe(1);
      expect(result[0].docId).toBe("b");

      result = idx.search("a");
      expect(result.length).toBe(1);
      expect(result[0].docId).toBe("c");
    });
  });
});
