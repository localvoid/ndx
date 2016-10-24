import { expect } from "chai";
import { DocumentIndex } from "../src/document_index";

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
  }
]

describe("DocumentIndex", () => {
  describe("empty", () => {
    it("should have size 0", () => {
      const idx = new DocumentIndex<string, { id: string, title: string, body: string }>();
      expect(idx.size).to.be.equal(0);
    });

    it("should perform search queries", () => {
      const idx = new DocumentIndex<string, { id: string, title: string, body: string }>();
      expect(idx.search("a")).to.be.eql([]);
    });
  });

  describe("multiple docs", () => {
    it("should index multiple fields", () => {
      const idx = new DocumentIndex<string, { id: string, title: string, body: string }>();
      idx.addField("title");
      idx.addField("body");
      DOCS.forEach((d) => {
        idx.add(d.id, d);
      });

      let result = idx.search("lorem");
      expect(result.length).to.be.equal(2);
      expect(result[0].docId).to.be.equal("b");
      expect(result[1].docId).to.be.equal("a");

      result = idx.search("b");
      expect(result.length).to.be.equal(1);
      expect(result[0].docId).to.be.equal("b");

      result = idx.search("a");
      expect(result.length).to.be.equal(2);
      expect(result[0].docId).to.be.equal("a");
      expect(result[1].docId).to.be.equal("c");
    });

    it("should remove documents", () => {
      const idx = new DocumentIndex<string, { id: string, title: string, body: string }>();
      idx.addField("title");
      idx.addField("body");
      DOCS.forEach((d) => {
        idx.add(d.id, d);
      });
      idx.remove("a");

      let result = idx.search("lorem");
      expect(result.length).to.be.equal(1);
      expect(result[0].docId).to.be.equal("b");

      result = idx.search("a");
      expect(result.length).to.be.equal(1);
      expect(result[0].docId).to.be.equal("c");
    });
  });
});
