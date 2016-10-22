/**
 * Document Details object stores additional information about documents.
 */
export interface DocumentDetails<I> {
  /**
   * Document ID.
   */
  docId: I;
  /**
   * Flag that is marked when document has been removed from the index.
   *
   * It isn't removed immediately because Inverted Index can still have references to this document.
   */
  removed: boolean;
  /*
   * Field length is an array that contains number of terms in each indexed text field.
   */
  readonly fieldLengths: number[];
}
