import { expect } from "chai";
import { InvertedIndex, InvertedIndexNode } from "../src/inverted_index";

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
      idx.add("term", { docId: "doc1", removed: false, fieldLengths: [1] }, [1]);
      const node = idx.get("term");
      expect(node).to.be.instanceOf(InvertedIndexNode);
      expect(node!.postings).to.be.not.null;
      expect(node!.children).to.be.null;
      expect(node!.postings!.length).to.be.equal(1);
      expect(node!.postings![0].details.docId).to.be.equal("doc1");
      expect(node!.postings![0].termFrequency[0]).to.be.equal(1);
    });
  });

  describe("multiple documents", () => {
    it("should return InvertedIndexNode with 2 documents", () => {
      const idx = new InvertedIndex<string>();
      idx.add("term", { docId: "doc1", removed: false, fieldLengths: [1] }, [1]);
      idx.add("term", { docId: "doc2", removed: false, fieldLengths: [2] }, [2]);
      const node = idx.get("term");
      expect(node).to.be.instanceOf(InvertedIndexNode);
      expect(node!.postings).to.be.not.null;
      expect(node!.children).to.be.null;
      expect(node!.postings!.length).to.be.equal(2);
      expect(node!.postings![0].details.docId).to.be.equal("doc1");
      expect(node!.postings![0].termFrequency[0]).to.be.equal(1);
      expect(node!.postings![1].details.docId).to.be.equal("doc2");
      expect(node!.postings![1].termFrequency[0]).to.be.equal(2);
    });
  });

  describe("multiple terms", () => {
    it("should store 2 terms", () => {
      const idx = new InvertedIndex<string>();
      idx.add("term1", { docId: "doc1", removed: false, fieldLengths: [1] }, [1]);
      idx.add("term2", { docId: "doc2", removed: false, fieldLengths: [2] }, [2]);
      const node = idx.get("term");
      expect(node).to.be.instanceOf(InvertedIndexNode);
      expect(node!.postings).to.be.null;
      expect(node!.children).to.be.not.null;

      const node1 = idx.get("term1");
      expect(node1).to.be.instanceOf(InvertedIndexNode);
      expect(node1!.postings).to.be.not.null;
      expect(node1!.children).to.be.null;
      expect(node1!.postings!.length).to.be.equal(1);
      expect(node1!.postings![0].details.docId).to.be.equal("doc1");

      const node2 = idx.get("term2");
      expect(node2).to.be.instanceOf(InvertedIndexNode);
      expect(node2!.postings).to.be.not.null;
      expect(node2!.children).to.be.null;
      expect(node2!.postings!.length).to.be.equal(1);
      expect(node2!.postings![0].details.docId).to.be.equal("doc2");
    });

    it("should store term as suffix", () => {
      const idx = new InvertedIndex<string>();
      idx.add("term1", { docId: "doc1", removed: false, fieldLengths: [1] }, [1]);
      idx.add("term11", { docId: "doc2", removed: false, fieldLengths: [2] }, [2]);
      const node = idx.get("term");
      expect(node).to.be.instanceOf(InvertedIndexNode);
      expect(node!.postings).to.be.null;
      expect(node!.children).to.be.not.null;

      const node1 = idx.get("term1");
      expect(node1).to.be.instanceOf(InvertedIndexNode);
      expect(node1!.postings).to.be.not.null;
      expect(node1!.children).to.be.not.null;
      expect(node1!.postings!.length).to.be.equal(1);
      expect(node1!.postings![0].details.docId).to.be.equal("doc1");

      const node11 = idx.get("term11");
      expect(node11).to.be.instanceOf(InvertedIndexNode);
      expect(node11!.postings).to.be.not.null;
      expect(node11!.children).to.be.null;
      expect(node11!.postings!.length).to.be.equal(1);
      expect(node11!.postings![0].details.docId).to.be.equal("doc2");
    });

    it("should expand term", () => {
      const idx = new InvertedIndex<string>();
      idx.add("term1", { docId: "doc1", removed: false, fieldLengths: [1] }, [1]);
      idx.add("term11", { docId: "doc2", removed: false, fieldLengths: [2] }, [2]);
      idx.add("abc", { docId: "doc3", removed: false, fieldLengths: [1] }, [1]);
      const terms = idx.expandTerm("te");
      expect(terms).to.be.eql(["term1", "term11"]);
    });
  });
});
