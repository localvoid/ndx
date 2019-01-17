import { createIndex, addDocumentToIndex, removeDocumentFromIndex, vacuumIndex } from "..";

const tokenizer = (s: string) => s.split(" ");
const filter = (s: string) => s;

test("one simple document", () => {
  const idx = createIndex(1);
  const removed = new Set();
  const docs = [
    { id: 1, text: "a" },
  ];
  docs.forEach((doc) => {
    addDocumentToIndex(idx, [(d) => d.text], tokenizer, filter, doc.id, doc);
  });
  removeDocumentFromIndex(idx, removed, 1);
  vacuumIndex(idx, removed);

  expect(idx).toMatchSnapshot();
});

test("two documents with shared terms", () => {
  const idx = createIndex(1);
  const removed = new Set();
  const docs = [
    { id: 1, text: "a b c" },
    { id: 2, text: "b c d" },
  ];
  docs.forEach((doc) => {
    addDocumentToIndex(idx, [(d) => d.text], tokenizer, filter, doc.id, doc);
  });
  removeDocumentFromIndex(idx, removed, 1);
  vacuumIndex(idx, removed);

  expect(idx).toMatchSnapshot();
});

test("remove the same document twice", () => {
  const idx = createIndex(1);
  const removed = new Set();
  const docs = [
    { id: 1, text: "a b c" },
    { id: 2, text: "b c d" },
  ];
  docs.forEach((doc) => {
    addDocumentToIndex(idx, [(d) => d.text], tokenizer, filter, doc.id, doc);
  });
  removeDocumentFromIndex(idx, removed, 1);
  removeDocumentFromIndex(idx, removed, 1);
  vacuumIndex(idx, removed);

  expect(idx).toMatchSnapshot();
});

test("two documents with undefined fields", () => {
  const idx = createIndex(2);
  const removed = new Set();
  const docs = [
    { id: 1, text1: "a b c" },
    { id: 2, text1: "b c d" },
  ];
  docs.forEach((doc) => {
    addDocumentToIndex(idx, [(d) => d.text1, (d) => (d as any).text2], tokenizer, filter, doc.id, doc);
  });
  removeDocumentFromIndex(idx, removed, 1);
  vacuumIndex(idx, removed);

  expect(idx).toMatchSnapshot();
});
