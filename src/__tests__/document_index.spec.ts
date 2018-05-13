import { DocumentIndex } from "..";

interface Doc {
  readonly id: string;
  readonly title: string;
  readonly body: string;
}

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
  describe("empty index", () => {
    test("should have size 0", () => {
      const idx = new DocumentIndex<string, Doc>();
      expect(idx.size).toBe(0);
    });

    test("should perform search queries", () => {
      const idx = new DocumentIndex<string, Doc>();
      expect(idx.search("a")).toEqual([]);
    });
  });

  describe("options", () => {
    test("custom tokenizer should be invoked when indexing documents", () => {
      let i = 0;
      const idx = new DocumentIndex<string, Doc>({
        tokenizer: (text) => (i++ , text.split(",")),
      });
      idx.addField("body");
      idx.add("a", { id: "a", title: "", body: "a,b,c" });
      idx.add("b", { id: "b", title: "", body: "d,e,f" });

      expect(i).toBe(2);
    });

    test("custom tokenizer should be invoked when searching", () => {
      let i = 0;
      const idx = new DocumentIndex<string, Doc>({
        tokenizer: (text) => (i++ , text.split(",")),
      });
      idx.addField("body");
      idx.search("a b");

      expect(i).toBe(1);
    });

    test("custom tokenizer should be applied when indexing documents", () => {
      const idx = new DocumentIndex<string, Doc>({
        tokenizer: (text) => text.split(","),
      });
      idx.addField("body");
      idx.add("a", { id: "a", title: "", body: "a,b,c" });
      idx.add("b", { id: "b", title: "", body: "d,e,f" });

      const result = idx.search("b");
      expect(result.length).toBe(1);
      expect(result[0].docId).toBe("a");
    });

    test("custom filter should be invoked when indexing documents", () => {
      let i = 0;
      const idx = new DocumentIndex<string, Doc>({
        filter: (text) => (i++ , text.toUpperCase()),
      });
      idx.addField("body");
      idx.add("a", { id: "a", title: "", body: "a b c" });

      expect(i).toBe(3);
    });

    test("custom filter should be invoked when searching", () => {
      let i = 0;
      const idx = new DocumentIndex<string, Doc>({
        filter: (text) => (i++ , text.toUpperCase()),
      });
      idx.addField("body");
      idx.search("a b");

      expect(i).toBe(2);
    });
  });

  describe("multiple docs", () => {
    test("should index multiple fields", () => {
      const idx = new DocumentIndex<string, Doc>();
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

    test("autovacuum should remove documents", () => {
      const idx = new DocumentIndex<string, Doc>();
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

    test("vacuum should remove documents", () => {
      const idx = new DocumentIndex<string, Doc>();
      idx.addField("title");
      idx.addField("body");
      DOCS.forEach((d) => {
        idx.add(d.id, d);
      });
      idx.remove("a");
      idx.vacuum();

      const result = idx.search("a");
      expect(result.length).toBe(1);
      expect(result[0].docId).toBe("c");
    });
  });
});
