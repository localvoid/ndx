import { InvertedIndex } from "../inverted_index";

describe("InvertedIndex", () => {
  describe("empty", () => {
    test("should return `null` when term doesn't exist", () => {
      const idx = new InvertedIndex<string>();
      expect(idx.get("term")).toBeNull();
    });
  });

  describe("1 document", () => {
    test("should return InvertedIndexNode with 1 document", () => {
      const idx = new InvertedIndex<string>();
      idx.add("term", { docId: "doc1", removed: false, fieldLengths: [1] }, [1]);
      const node = idx.get("term");
      expect(isLikelyInstanceOfInvertedIndexNode(node)).toBeTruthy();
      expect(node!.firstPosting).not.toBeNull();
      expect(node!.firstChild).toBeNull();
      expect(node!.firstPosting!.details.docId).toBe("doc1");
      expect(node!.firstPosting!.termFrequency[0]).toBe(1);
    });
  });

  describe("multiple documents", () => {
    test("should return InvertedIndexNode with 2 documents", () => {
      const idx = new InvertedIndex<string>();
      idx.add("term", { docId: "doc1", removed: false, fieldLengths: [1] }, [1]);
      idx.add("term", { docId: "doc2", removed: false, fieldLengths: [2] }, [2]);
      const node = idx.get("term");
      expect(isLikelyInstanceOfInvertedIndexNode(node)).toBeTruthy();
      expect(node!.firstPosting).not.toBeNull();
      expect(node!.firstChild).toBeNull();
      expect(node!.firstPosting!.details.docId).toBe("doc2");
      expect(node!.firstPosting!.termFrequency[0]).toBe(2);
      expect(node!.firstPosting!.next!.details.docId).toBe("doc1");
      expect(node!.firstPosting!.next!.termFrequency[0]).toBe(1);
    });
  });

  describe("multiple terms", () => {
    test("should store 2 terms", () => {
      const idx = new InvertedIndex<string>();
      idx.add("term1", { docId: "doc1", removed: false, fieldLengths: [1] }, [1]);
      idx.add("term2", { docId: "doc2", removed: false, fieldLengths: [2] }, [2]);
      const node = idx.get("term");
      expect(isLikelyInstanceOfInvertedIndexNode(node)).toBeTruthy();
      expect(node!.firstPosting).toBeNull();
      expect(node!.firstChild).not.toBeNull();

      const node1 = idx.get("term1");
      expect(isLikelyInstanceOfInvertedIndexNode(node)).toBeTruthy();
      expect(node1!.firstPosting).not.toBeNull();
      expect(node1!.firstChild).toBeNull();
      expect(node1!.firstPosting!.details.docId).toBe("doc1");

      const node2 = idx.get("term2");
      expect(isLikelyInstanceOfInvertedIndexNode(node)).toBeTruthy();
      expect(node2!.firstPosting).not.toBeNull();
      expect(node2!.firstChild).toBeNull();
      expect(node2!.firstPosting!.details.docId).toBe("doc2");
    });

    test("should store term as suffix", () => {
      const idx = new InvertedIndex<string>();
      idx.add("term1", { docId: "doc1", removed: false, fieldLengths: [1] }, [1]);
      idx.add("term11", { docId: "doc2", removed: false, fieldLengths: [2] }, [2]);
      const node = idx.get("term");
      expect(isLikelyInstanceOfInvertedIndexNode(node)).toBeTruthy();
      expect(node!.firstPosting).toBeNull();
      expect(node!.firstChild).not.toBeNull();

      const node1 = idx.get("term1");
      expect(isLikelyInstanceOfInvertedIndexNode(node)).toBeTruthy();
      expect(node1!.firstPosting).not.toBeNull();
      expect(node1!.firstChild).not.toBeNull();
      expect(node1!.firstPosting!.details.docId).toBe("doc1");

      const node11 = idx.get("term11");
      expect(isLikelyInstanceOfInvertedIndexNode(node)).toBeTruthy();
      expect(node11!.firstPosting).not.toBeNull();
      expect(node11!.firstChild).toBeNull();
      expect(node11!.firstPosting!.details.docId).toBe("doc2");
    });

    test("should expand term", () => {
      const idx = new InvertedIndex<string>();
      idx.add("term1", { docId: "doc1", removed: false, fieldLengths: [1] }, [1]);
      idx.add("term11", { docId: "doc2", removed: false, fieldLengths: [2] }, [2]);
      idx.add("abc", { docId: "doc3", removed: false, fieldLengths: [1] }, [1]);
      const terms = idx.expandTerm("te");
      expect(terms).toEqual(["term1", "term11"]);
    });
  });
});

function isLikelyInstanceOfInvertedIndexNode(value: any): boolean {
  return typeof value === "object" && typeof value.charCode === "number";
}
