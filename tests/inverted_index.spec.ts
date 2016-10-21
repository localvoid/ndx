import { expect } from "chai";
import { InvertedIndex, InvertedIndexNode, invertedIndexExpandTerm } from "../src/inverted_index";

describe("InvertedIndex", () => {
  describe("empty", () => {
    it("should return `null` when term doesn't exist", () => {
      const idx = new InvertedIndex<string>();
      expect(idx.get("term")).to.be.null;
    });
  });

  describe("1 document", () => {
    it("should return InvertedIndexNode with 1 document", () => {
      const idx = new InvertedIndex<string>();
      idx.add("term", 1, "doc1");
      const node = idx.get("term");
      expect(node).to.be.instanceOf(InvertedIndexNode);
      expect(node!.documents).to.be.not.null;
      expect(node!.children).to.be.null;
      expect(node!.documents!.size).to.be.equal(1);
      expect(node!.documents!.get("doc1")).to.be.equal(1);
    });

    it("should override InvertedIndexNode term frequency", () => {
      const idx = new InvertedIndex<string>();
      idx.add("term", 1, "doc1");
      idx.add("term", 2, "doc1");
      const node = idx.get("term");
      expect(node).to.be.instanceOf(InvertedIndexNode);
      expect(node!.documents).to.be.not.null;
      expect(node!.children).to.be.null;
      expect(node!.documents!.size).to.be.equal(1);
      expect(node!.documents!.get("doc1")).to.be.equal(2);
    });

    it("should remove document", () => {
      const idx = new InvertedIndex<string>();
      idx.add("term", 1, "doc1");
      idx.remove("term", "doc1");
      const node = idx.get("term");
      expect(node).to.be.instanceOf(InvertedIndexNode);
      expect(node!.documents).to.be.not.null;
      expect(node!.children).to.be.null;
      expect(node!.documents!.size).to.be.equal(0);
      expect(node!.documents!.get("doc1")).to.be.undefined;
    });
  });

  describe("multiple documents", () => {
    it("should return InvertedIndexNode with 2 documents", () => {
      const idx = new InvertedIndex<string>();
      idx.add("term", 1, "doc1");
      idx.add("term", 2, "doc2");
      const node = idx.get("term");
      expect(node).to.be.instanceOf(InvertedIndexNode);
      expect(node!.documents).to.be.not.null;
      expect(node!.children).to.be.null;
      expect(node!.documents!.size).to.be.equal(2);
      expect(node!.documents!.get("doc1")).to.be.equal(1);
      expect(node!.documents!.get("doc2")).to.be.equal(2);
    });

    it("should remove document", () => {
      const idx = new InvertedIndex<string>();
      idx.add("term", 1, "doc1");
      idx.add("term", 2, "doc2");
      idx.remove("term", "doc1");
      const node = idx.get("term");
      expect(node).to.be.instanceOf(InvertedIndexNode);
      expect(node!.documents).to.be.not.null;
      expect(node!.children).to.be.null;
      expect(node!.documents!.size).to.be.equal(1);
      expect(node!.documents!.get("doc1")).to.be.undefined;
      expect(node!.documents!.get("doc2")).to.be.equal(2);
    });
  });

  describe("multiple terms", () => {
    it("should store 2 terms", () => {
      const idx = new InvertedIndex<string>();
      idx.add("term1", 1, "doc1");
      idx.add("term2", 2, "doc2");
      const node = idx.get("term");
      expect(node).to.be.instanceOf(InvertedIndexNode);
      expect(node!.documents).to.be.null;
      expect(node!.children).to.be.not.null;

      const node1 = idx.get("term1");
      expect(node1).to.be.instanceOf(InvertedIndexNode);
      expect(node1!.documents).to.be.not.null;
      expect(node1!.children).to.be.null;
      expect(node1!.documents!.size).to.be.equal(1);
      expect(node1!.documents!.get("doc1")).to.be.equal(1);

      const node2 = idx.get("term2");
      expect(node2).to.be.instanceOf(InvertedIndexNode);
      expect(node2!.documents).to.be.not.null;
      expect(node2!.children).to.be.null;
      expect(node2!.documents!.size).to.be.equal(1);
      expect(node2!.documents!.get("doc2")).to.be.equal(2);
    });

    it("should store term as suffix", () => {
      const idx = new InvertedIndex<string>();
      idx.add("term1", 1, "doc1");
      idx.add("term11", 2, "doc2");
      const node = idx.get("term");
      expect(node).to.be.instanceOf(InvertedIndexNode);
      expect(node!.documents).to.be.null;
      expect(node!.children).to.be.not.null;

      const node1 = idx.get("term1");
      expect(node1).to.be.instanceOf(InvertedIndexNode);
      expect(node1!.documents).to.be.not.null;
      expect(node1!.children).to.be.not.null;
      expect(node1!.documents!.size).to.be.equal(1);
      expect(node1!.documents!.get("doc1")).to.be.equal(1);

      const node11 = idx.get("term11");
      expect(node11).to.be.instanceOf(InvertedIndexNode);
      expect(node11!.documents).to.be.not.null;
      expect(node11!.children).to.be.null;
      expect(node11!.documents!.size).to.be.equal(1);
      expect(node11!.documents!.get("doc2")).to.be.equal(2);
    });

    it("should remove document", () => {
      const idx = new InvertedIndex<string>();
      idx.add("term1", 1, "doc1");
      idx.add("term11", 2, "doc2");
      idx.remove("term1", "doc1");
      const node = idx.get("term");
      expect(node).to.be.instanceOf(InvertedIndexNode);
      expect(node!.documents).to.be.null;
      expect(node!.children).to.be.not.null;

      const node1 = idx.get("term1");
      expect(node1).to.be.instanceOf(InvertedIndexNode);
      expect(node1!.documents).to.be.not.null;
      expect(node1!.children).to.be.not.null;
      expect(node1!.documents!.size).to.be.equal(0);
      expect(node1!.documents!.get("doc1")).to.be.undefined;

      const node11 = idx.get("term11");
      expect(node11).to.be.instanceOf(InvertedIndexNode);
      expect(node11!.documents).to.be.not.null;
      expect(node11!.children).to.be.null;
      expect(node11!.documents!.size).to.be.equal(1);
      expect(node11!.documents!.get("doc2")).to.be.equal(2);
    });

    it("should expand term", () => {
      const idx = new InvertedIndex<string>();
      idx.add("term1", 1, "doc1");
      idx.add("term11", 2, "doc2");
      idx.add("abc", 3, "doc3");
      const terms = invertedIndexExpandTerm(idx, "te");
      expect(terms).to.be.eql(["term1", "term11"]);
    });
  });
});
