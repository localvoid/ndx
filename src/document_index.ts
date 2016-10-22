import { DocumentDetails } from "./document";
import { InvertedIndex } from "./inverted_index";
import { whitespaceTokenizer } from "./tokenizer";
import { lowerCaseFilter, trimNonWordCharactersFilter } from "./filters";

/**
 * Search Result.
 */
export interface SearchResult<I> {
  readonly docId: I;
  score: number;
}

/**
 * Field Details.
 */
interface FieldDetails<D> {
  /**
   * Field name.
   */
  readonly name: string;
  /**
   * Getter is a function that will be used to get value for this field. If getter function isn't specified, field name
   * will be used to get value.
   */
  readonly getter: ((document: D) => string) | string;
  /**
   * Sum of field lengths in all documents.
   */
  sumLength: number;
  /**
   * Average of field lengths in all documents.
   */
  avgLength: number;
}

/**
 * Field Options.
 */
export interface FieldOptions<D> {
  /**
   * Getter is a function that will be used to get value for this field. If getter function isn't specified, field name
   * will be used to get value.
   */
  readonly getter?: (document: D) => string;
}

export function DEFAULT_FILTER(term: string): string {
  return trimNonWordCharactersFilter(lowerCaseFilter(term));
}

/**
 * Controls non-linear term frequency normalization (saturation).
 */
const BM25_K1 = 1.2;

/**
 * Controls to what degree document length normalizes tf values.
 */
const BM25_B = 0.75;

/**
 * Document Index
 */
export class DocumentIndex<I, D> {
  private _documents: Map<I, DocumentDetails<I>>;
  private _index: InvertedIndex<I>;
  private _fields: FieldDetails<D>[];
  private _tokenizer: (text: string) => string[];
  private _filter: (term: string) => string;

  constructor() {
    this._documents = new Map();
    this._index = new InvertedIndex<I>();
    this._fields = [];
    this._tokenizer = whitespaceTokenizer;
    this._filter = DEFAULT_FILTER;
  }

  /**
   * Returns number of indexed document.
   */
  get size(): number {
    return this._documents.size;
  }

  /**
   * Create Field Index.
   */
  createIndex(fieldName: string, options?: FieldOptions<D>): void {
    let getter: ((document: D) => string) | string;
    if (options === undefined) {
      getter = fieldName;
    } else {
      getter = options.getter || fieldName;
    }

    const details: FieldDetails<D> = {
      name: fieldName,
      getter: getter,
      sumLength: 0,
      avgLength: 0,
    };

    this._fields.push(details);
  }

  /**
   * Set Text Tokenizer.
   *
   * Tokenizer is a simple function that accepts string values and returns array of string.
   */
  setTokenizer(tokenizer: (text: string) => string[]): void {
    this._tokenizer = tokenizer;
  }

  /**
   * Set Token Filter.
   *
   * Token filter will be applied to all tokens returned by tokenizer.
   */
  setFilter(filter: (token: string) => string): void {
    this._filter = filter;
  }

  /**
   * Add document to the index.
   */
  add(documentId: I, document: D): void {
    const documentTermCounts = new Array<number>(this._fields.length);
    const termCounts = new Map<string, number[]>();

    for (let i = 0; i < this._fields.length; i++) {
      const fieldDetails = this._fields[i];
      const fieldAccessor = fieldDetails.getter;
      const fieldValue = typeof fieldAccessor === "string" ?
        (document as any as { [key: string]: string })[fieldAccessor] :
        fieldAccessor(document);

      if (fieldValue === undefined) {
        documentTermCounts[i] = 0;
      } else {
        // tokenize text
        const terms = this._tokenizer(fieldValue);

        // filter and count terms, ignore empty strings
        let filteredTermsCount = 0;
        for (let j = 0; j < terms.length; j++) {
          const term = this._filter(terms[j]);
          if (term !== "") {
            filteredTermsCount++;
            let counts = termCounts.get(term);
            if (counts === undefined) {
              counts = new Array<number>(this._fields.length);
              for (let k = 0; k < counts.length; k++) {
                counts[k] = 0;
              }
              termCounts.set(term, counts);
            }
            counts[i] += 1;
          }
        }

        fieldDetails.sumLength += filteredTermsCount;
        fieldDetails.avgLength = fieldDetails.sumLength / (this._documents.size + 1);
        documentTermCounts[i] = filteredTermsCount;
      }
    }

    const docDetails: DocumentDetails<I> = {
      docId: documentId,
      removed: false,
      fieldLengths: documentTermCounts,
    }

    this._documents.set(documentId, docDetails);
    termCounts.forEach((termCounters, term) => {
      this._index.add(term, docDetails, termCounters);
    });
  }

  /**
   * Remove document from the index.
   */
  remove(documentId: I): void {
    const details = this._documents.get(documentId);
    if (details !== undefined) {
      details.removed = true;
      this._documents.delete(documentId);
      for (let i = 0; this._fields.length; i++) {
        const fieldLength = details.fieldLengths[i];
        if (fieldLength > 0) {
          const field = this._fields[i];
          field.sumLength -= fieldLength;
          field.avgLength = field.sumLength / this._documents.size;
        }
      }
    }
  }

  search(query: string): SearchResult<I>[] {
    const queryTerms = this._tokenizer(query);

    const scores = new Map<I, number>();

    for (let i = 0; i < queryTerms.length; i++) {
      const term = this._filter(queryTerms[i]);
      if (term !== "") {
        const termNode = this._index.get(term);

        let postings = termNode === null ? null : termNode.postings;

        if (postings !== null) {
          let documentFrequency = 0;
          for (let j = 0; j < postings.length; j++) {
            const pointer = postings[j];
            if (!pointer.details.removed) {
              documentFrequency++;
            }
          }
          // calculating BM25 idf
          const idf = Math.log(1 + (this.size - documentFrequency + 0.5) / (documentFrequency + 0.5));

          for (let j = 0; j < postings.length; j++) {
            const pointer = postings[j];
            if (!pointer.details.removed) {
              let score = 0;
              for (let k = 0; k < pointer.details.fieldLengths.length; k++) {
                let tf = pointer.termFrequency[k];
                if (tf > 0) {
                  // calculating BM25 tf
                  const fieldLength = pointer.details.fieldLengths[k];
                  const avgFieldLength = this._fields[k].avgLength;
                  tf = ((BM25_K1 + 1) * tf) / (BM25_K1 * ((1 - BM25_B) + BM25_B * (fieldLength / avgFieldLength)) + tf);
                  score += tf * idf;
                }
              }
              const prevScore = scores.get(pointer.details.docId);
              scores.set(pointer.details.docId, prevScore === undefined ? score : prevScore + score);
            }
          }
        }
      }
    }

    const result = [] as SearchResult<I>[];
    scores.forEach(function (score, documentId) {
      result.push({
        docId: documentId,
        score: score,
      });
    });
    result.sort(function (a, b) {
      return b.score - a.score;
    });

    return result;
  }
}
