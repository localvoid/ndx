import * as msgpack from "msgpack-lite";

import {
  DEFAULT_FILTER,
  deserialize,
  DeserializeOptions,
  Deserializer,
  DocumentIndex,
  DocumentIndexOptions,
  serialize,
  Serializer,
  whitespaceTokenizer,
} from "..";

interface Doc {
  readonly id: string;
  readonly title: string;
  readonly body: string;
}

const codec = msgpack.createCodec({binarraybuffer: true, preset: true});
const serializer: Serializer<Doc["id"], Doc> = (data) => msgpack.encode(data, {codec});
const deserializer: Deserializer<Doc["id"], Doc> = (data) => msgpack.decode(data, {codec});

describe("serialize/deserialize", () => {
  function buildTest(
    title: string,
    indexConfig: DocumentIndexOptions,
    deserializeConfig: DeserializeOptions<string, Doc>,
    addFields: (idx: DocumentIndex<string, Doc>) => void,
  ) {
    test(title, () => {
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
      const idx = new DocumentIndex<string, Doc>(indexConfig);

      addFields(idx);

      DOCS.forEach((doc) => {
        idx.add(doc.id, doc);
      });

      const serializedIdx = serialize(idx, serializer);
      const deserializedIdx = deserialize(serializedIdx, deserializer, deserializeConfig);

      expect(idx === deserializedIdx).toBeFalsy();
      expect(idx).toEqual(deserializedIdx);

      const query = "a b ip";
      expect(idx.search(query)).toEqual(deserializedIdx.search(query));
      expect(idx.expandTerm(query)).toEqual(deserializedIdx.expandTerm(query));
    });
  }

  buildTest(
    "deserialized with default config index should produce the same result as original one",
    {},
    {},
    (idx) => {
      idx.addField("title");
      idx.addField("body");
    },
  );

  (() => {
    const deserializeOptions: DeserializeOptions<string, Doc> = {
      fieldsGetters: {
        title_: (doc) => doc.title,
        body_: (doc) => doc.body,
      },
      filter: DEFAULT_FILTER,
      tokenizer: whitespaceTokenizer,
    };

    buildTest(
      "deserialized with custom config index should produce the same result as original one",
      {
        tokenizer: deserializeOptions.tokenizer,
        filter: deserializeOptions.filter,
        bm25: {
          b: 0.7,
          k1: 1.15,
        },
      },
      deserializeOptions,
      (idx) => {
        const {fieldsGetters} = deserializeOptions;

        if (fieldsGetters) {
          Object.keys(fieldsGetters).forEach((name) => {
            idx.addField(name, {getter: fieldsGetters[name]});
          });
        }
      },
    );
  })();
});
