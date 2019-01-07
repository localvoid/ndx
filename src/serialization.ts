import { DocumentIndex, DocumentIndexOptions, DocumentIndexState, FieldOptions } from "./document_index";
import { InvertedIndex, InvertedIndexNode } from "./inverted_index";
import { DocumentDetails } from "./document";
import { Mutable, Omit } from "./types";

export function serialize<I extends SerializableDocumentId, D>(
  index: DocumentIndex<I, D>,
  serializer: Serializer<I, D>,
): Uint8Array {
  const indexState: SerializedState<I, D> = ((
    {
      _documents,
      _index,
      _fields,
      _tokenizer,
      _filter,
      _bm25k1,
      _bm25b,
    }: DocumentIndexState<I, D>,
  ) => {
    return {
      _documents: [..._documents],
      _index: {root: (_index as unknown as { root: InvertedIndexNode<I> }).root},
      _fields,
      _tokenizer,
      _filter,
      _bm25k1,
      _bm25b,
    };
  })(index as unknown as DocumentIndexState<I, D>);

  return serializer(indexState);
}

export function deserialize<I extends SerializableDocumentId | number, D>(
  serializedIndex: Uint8Array,
  deserializer: Deserializer<I, D>,
  {tokenizer, filter, fieldsGetters}: DeserializeOptions<I, D> = {},
): DocumentIndex<I, D> {
  const serializedState: SerializedState<I, D> = deserializer(serializedIndex);
  const instanceState = new DocumentIndex<I, D>() as unknown as DocumentIndexState<I, D>;

  instanceState._documents = new Map(serializedState._documents);
  instanceState._index = (() => {
    const index = new InvertedIndex<I>();
    (index as unknown as (typeof serializedState)["_index"]).root = serializedState._index.root;
    return index;
  })();
  instanceState._fields = serializedState._fields;
  instanceState._bm25k1 = serializedState._bm25k1;
  instanceState._bm25b = serializedState._bm25b;

  if (tokenizer) {
    instanceState._tokenizer = tokenizer;
  }
  if (filter) {
    instanceState._filter = filter;
  }
  if (fieldsGetters) {
    instanceState._fields.forEach((field) => {
      if (field.name in fieldsGetters) {
        (field as Mutable<FieldOptions<D>>).getter = fieldsGetters[field.name];
      }
    });
  }

  return instanceState as unknown as DocumentIndex<I, D>;
}

export type Serializer<I extends SerializableDocumentId, D>
  = (indexState: SerializedState<I, D>) => Uint8Array;

export type Deserializer<I extends SerializableDocumentId, D>
  = (serializedIndex: ReturnType<Serializer<I, D>>) => SerializedState<I, D>;

export type SerializedState<I extends SerializableDocumentId, D> =
  Readonly<Omit<DocumentIndexState<I, D>, "_index" | "_documents">
    & {
    _documents: Array<[I, DocumentDetails<I>]>,
    _index: { root: InvertedIndexNode<I> },
  }>;

export type DeserializeOptions<I, D> = Pick<DocumentIndexOptions, "tokenizer" | "filter"> & {
  readonly fieldsGetters?: { [fieldName: string]: FieldOptions<D>["getter"]; };
};

export type SerializableDocumentId = string | number;
