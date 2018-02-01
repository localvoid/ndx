import { expect } from "chai";
import { InvertedIndex, InvertedIndexNode } from "../src/inverted_index";

/* tslint:disable:no-unused-expression */

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
      expect(node!.firstPosting).to.be.not.null;
      expect(node!.firstChild).to.be.null;
      expect(node!.firstPosting!.details.docId).to.be.equal("doc1");
      expect(node!.firstPosting!.termFrequency[0]).to.be.equal(1);
    });
  });

  describe("multiple documents", () => {
    it("should return InvertedIndexNode with 2 documents", () => {
      const idx = new InvertedIndex<string>();
      idx.add("term", { docId: "doc1", removed: false, fieldLengths: [1] }, [1]);
      idx.add("term", { docId: "doc2", removed: false, fieldLengths: [2] }, [2]);
      const node = idx.get("term");
      expect(node).to.be.instanceOf(InvertedIndexNode);
      expect(node!.firstPosting).to.be.not.null;
      expect(node!.firstChild).to.be.null;
      expect(node!.firstPosting!.details.docId).to.be.equal("doc2");
      expect(node!.firstPosting!.termFrequency[0]).to.be.equal(2);
      expect(node!.firstPosting!.next!.details.docId).to.be.equal("doc1");
      expect(node!.firstPosting!.next!.termFrequency[0]).to.be.equal(1);
    });
  });

  describe("multiple terms", () => {
    it("should store 2 terms", () => {
      const idx = new InvertedIndex<string>();
      idx.add("term1", { docId: "doc1", removed: false, fieldLengths: [1] }, [1]);
      idx.add("term2", { docId: "doc2", removed: false, fieldLengths: [2] }, [2]);
      const node = idx.get("term");
      expect(node).to.be.instanceOf(InvertedIndexNode);
      expect(node!.firstPosting).to.be.null;
      expect(node!.firstChild).to.be.not.null;

      const node1 = idx.get("term1");
      expect(node1).to.be.instanceOf(InvertedIndexNode);
      expect(node1!.firstPosting).to.be.not.null;
      expect(node1!.firstChild).to.be.null;
      expect(node1!.firstPosting!.details.docId).to.be.equal("doc1");

      const node2 = idx.get("term2");
      expect(node2).to.be.instanceOf(InvertedIndexNode);
      expect(node2!.firstPosting).to.be.not.null;
      expect(node2!.firstChild).to.be.null;
      expect(node2!.firstPosting!.details.docId).to.be.equal("doc2");
    });

    it("should store term as suffix", () => {
      const idx = new InvertedIndex<string>();
      idx.add("term1", { docId: "doc1", removed: false, fieldLengths: [1] }, [1]);
      idx.add("term11", { docId: "doc2", removed: false, fieldLengths: [2] }, [2]);
      const node = idx.get("term");
      expect(node).to.be.instanceOf(InvertedIndexNode);
      expect(node!.firstPosting).to.be.null;
      expect(node!.firstChild).to.be.not.null;

      const node1 = idx.get("term1");
      expect(node1).to.be.instanceOf(InvertedIndexNode);
      expect(node1!.firstPosting).to.be.not.null;
      expect(node1!.firstChild).to.be.not.null;
      expect(node1!.firstPosting!.details.docId).to.be.equal("doc1");

      const node11 = idx.get("term11");
      expect(node11).to.be.instanceOf(InvertedIndexNode);
      expect(node11!.firstPosting).to.be.not.null;
      expect(node11!.firstChild).to.be.null;
      expect(node11!.firstPosting!.details.docId).to.be.equal("doc2");
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
