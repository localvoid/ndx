import { createIndex, addDocumentToIndex } from "..";

const tokenizer = (s: string) => s.split(" ");
const filter = (s: string) => s;

test("should invoke tokenizer", () => {
  let v = "";
  const t = (s: string) => (v = s, tokenizer(s));
  const idx = createIndex<number>(1);
  const doc = { id: 1, text: "a b c" };
  addDocumentToIndex(idx, [(d) => d.text], t, filter, doc.id, doc);
  expect(v).toBe("a b c");
});

test("should invoke filter for each term", () => {
  const v: string[] = [];
  const f = (s: string) => (v.push(s), s);
  const idx = createIndex<number>(1);
  const doc = { id: 1, text: "a b c" };
  addDocumentToIndex(idx, [(d) => d.text], tokenizer, f, doc.id, doc);
  expect(v).toEqual(["a", "b", "c"]);
});

test("one document with three terms", () => {
  const idx = createIndex<number>(1);
  const docs = [{ id: 1, text: "a b c" }];
  docs.forEach((doc) => {
    addDocumentToIndex(idx, [(d) => d.text], tokenizer, filter, doc.id, doc);
  });
  expect(idx).toMatchSnapshot();
});

test("two documents with different terms", () => {
  const idx = createIndex<number>(1);
  const docs = [
    { id: 1, text: "a b c" },
    { id: 2, text: "d e f" },
  ];
  docs.forEach((doc) => {
    addDocumentToIndex(idx, [(d) => d.text], tokenizer, filter, doc.id, doc);
  });
  expect(idx).toMatchSnapshot();
});

test("two documents with shared terms", () => {
  const idx = createIndex<number>(1);
  const docs = [
    { id: 1, text: "a b c" },
    { id: 2, text: "b c d" },
  ];
  docs.forEach((doc) => {
    addDocumentToIndex(idx, [(d) => d.text], tokenizer, filter, doc.id, doc);
  });
  expect(idx).toMatchSnapshot();
});

test("document with empty text", () => {
  const idx = createIndex<number>(1);
  const docs = [{ id: 1, text: "" }];
  docs.forEach((doc) => {
    addDocumentToIndex(idx, [(d) => d.text], tokenizer, filter, doc.id, doc);
  });
  expect(idx).toMatchSnapshot();
});

test("document with multiple fields", () => {
  const idx = createIndex<number>(2);
  const docs = [{ id: 1, text1: "a b c", text2: "c d e" }];
  docs.forEach((doc) => {
    addDocumentToIndex(idx, [(d) => d.text1, (d) => d.text2], tokenizer, filter, doc.id, doc);
  });
  expect(idx).toMatchSnapshot();
});

test("document with unavailable field", () => {
  const idx = createIndex<number>(2);
  const docs = [{ id: 1, text1: "a b c" }];
  docs.forEach((doc) => {
    addDocumentToIndex(idx, [(d) => d.text1, (d) => (d as any).text2], tokenizer, filter, doc.id, doc);
  });
  expect(idx).toMatchSnapshot();
});

test("document with object key", () => {
  const docs = [{ id: 1, text1: "a b c" }];
  const idx = createIndex<typeof docs[0]>(2);
  docs.forEach((doc) => {
    addDocumentToIndex(idx, [(d) => d.text1, (d) => (d as any).text2], tokenizer, filter, doc, doc);
  });
  expect(idx).toMatchSnapshot();
});
