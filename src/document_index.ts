import { DocumentDetails } from "./document";
import { InvertedIndex, DocumentPointer } from "./inverted_index";
import { whitespaceTokenizer } from "./tokenizer";
import { lowerCaseFilter, trimNonWordCharactersFilter } from "./filters";

/**
 * BM25 Ranking function constants.
 */
export interface BM25Options {
  /**
   * Controls non-linear term frequency normalization (saturation).
   *
   * Default value: 1.2
   */
  readonly k1?: number;

  /**
   * Controls to what degree document length normalizes tf values.
   *
   * Default value: 0.75
   */
  readonly b?: number;
}

/**
 * Document Index options.
 */
export interface DocumentIndexOptions {
  /**
   * Tokenizer is a function that breaks a text into words, phrases, symbols, or other meaningful elements called
   * tokens.
   *
   * Default tokenizer breaks words on spaces, tabs, line feeds and assumes that contiguous nonwhitespace characters
   * form a single token.
   */
  readonly tokenizer?: (query: string) => string[];
  /**
   * Filter is a function that processes tokens and returns terms, terms are used in Inverted Index to index documents.
   *
   * Default filter transforms all characters to lower case and removes all non-word characters at the beginning and
   * the end of a term.
   */
  readonly filter?: (term: string) => string;
  /**
   * BM25 Ranking function constants.
   */
  readonly bm25?: BM25Options;
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
  /**
   * Score boosting factor.
   */
  readonly boost?: number;
}

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
   * Score boosting factor.
   */
  readonly boost: number;
  /**
   * Sum of field lengths in all documents.
   */
  sumLength: number;
  /**
   * Average of field lengths in all documents.
   */
  avgLength: number;
}

export function DEFAULT_FILTER(term: string): string {
  return trimNonWordCharactersFilter(lowerCaseFilter(term));
}

export interface DocumentIndexState<I, D> {
  _documents: Map<I, DocumentDetails<I>>;
  _index: InvertedIndex<I>;
  _fields: FieldDetails<D>[];
  _tokenizer: (text: string) => string[];
  _filter: (term: string) => string;
  _bm25k1: number;
  _bm25b: number;
}

/**
 * Document Index.
 */
export class DocumentIndex<I, D> {
  private readonly _documents: DocumentIndexState<I, D>["_documents"];
  private readonly _index: DocumentIndexState<I, D>["_index"];
  private readonly _fields: DocumentIndexState<I, D>["_fields"];
  private readonly _tokenizer: DocumentIndexState<I, D>["_tokenizer"];
  private readonly _filter: DocumentIndexState<I, D>["_filter"];
  private readonly _bm25k1: DocumentIndexState<I, D>["_bm25k1"];
  private readonly _bm25b: DocumentIndexState<I, D>["_bm25b"];

  constructor(options?: DocumentIndexOptions) {
    this._documents = new Map();
    this._index = new InvertedIndex<I>();
    this._fields = [];
    this._tokenizer = whitespaceTokenizer;
    this._filter = DEFAULT_FILTER;
    this._bm25k1 = 1.2;
    this._bm25b = 0.75;

    if (options !== undefined) {
      if (options.tokenizer !== undefined) {
        this._tokenizer = options.tokenizer;
      }
      if (options.filter !== undefined) {
        this._filter = options.filter;
      }
      const bm25 = options.bm25;
      if (bm25 !== undefined) {
        if (bm25.k1 !== undefined) {
          this._bm25k1 = bm25.k1;
        }
        if (bm25.b !== undefined) {
          this._bm25b = bm25.b;
        }
      }
    }
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
  addField(fieldName: string, options?: FieldOptions<D>): void {
    let getter: ((document: D) => string) | string = fieldName;
    let boost = 1;
    if (options !== undefined) {
      if (options.getter !== undefined) {
        getter = options.getter;
      }
      if (options.boost !== undefined) {
        boost = options.boost;
      }
    }

    const details: FieldDetails<D> = {
      name: fieldName,
      getter: getter,
      boost: boost,
      sumLength: 0,
      avgLength: 0,
    };

    this._fields.push(details);
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
              counts = new Array<number>(this._fields.length).fill(0);
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
    };

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
      for (let i = 0; i < this._fields.length; i++) {
        const fieldLength = details.fieldLengths[i];
        if (fieldLength > 0) {
          const field = this._fields[i];
          field.sumLength -= fieldLength;
          field.avgLength = field.sumLength / this._documents.size;
        }
      }
    }
  }

  /**
   * Search with a free text query.
   *
   * All token separators work as a disjunction operator.
   */
  search(query: string): SearchResult<I>[] {
    const queryTerms = this._tokenizer(query);

    const scores = new Map<I, number>();

    for (let i = 0; i < queryTerms.length; i++) {
      const term = this._filter(queryTerms[i]);
      if (term !== "") {
        const expandedTerms = this._index.expandTerm(term);
        const documents = new Set<I>();
        for (let j = 0; j < expandedTerms.length; j++) {
          const eTerm = expandedTerms[j];
          const expansionBoost = eTerm === term ? 1 : Math.log(1 + (1 / (1 + eTerm.length - term.length)));
          const termNode = this._index.get(eTerm);

          if (termNode !== null && termNode.firstPosting !== null) {
            let documentFrequency = 0;
            let pointer: DocumentPointer<I> | null = termNode.firstPosting;
            let prevPointer: DocumentPointer<I> | null = null;

            while (pointer !== null) {
              if (pointer.details.removed) {
                if (prevPointer === null) {
                  termNode.firstPosting = pointer.next;
                } else {
                  prevPointer.next = pointer.next;
                }
              } else {
                prevPointer = pointer;
                documentFrequency++;
              }
              pointer = pointer.next;
            }

            if (documentFrequency > 0) {
              // calculating BM25 idf
              const idf = Math.log(1 + (this.size - documentFrequency + 0.5) / (documentFrequency + 0.5));

              pointer = termNode.firstPosting;
              while (pointer !== null) {
                if (!pointer.details.removed) {
                  let score = 0;
                  for (let x = 0; x < pointer.details.fieldLengths.length; x++) {
                    let tf = pointer.termFrequency[x];
                    if (tf > 0) {
                      // calculating BM25 tf
                      const fieldLength = pointer.details.fieldLengths[x];
                      const fieldDetails = this._fields[x];
                      const avgFieldLength = fieldDetails.avgLength;
                      const k1 = this._bm25k1;
                      const b = this._bm25b;
                      tf = ((k1 + 1) * tf) / (k1 * ((1 - b) + b * (fieldLength / avgFieldLength)) + tf);
                      score += tf * idf * fieldDetails.boost * expansionBoost;
                    }
                  }
                  if (score > 0) {
                    const docId = pointer.details.docId;
                    const prevScore = scores.get(docId);
                    if (prevScore !== undefined && documents.has(docId)) {
                      scores.set(docId, Math.max(prevScore, score));
                    } else {
                      scores.set(docId, prevScore === undefined ? score : prevScore + score);
                    }
                    documents.add(docId);
                  }
                }
                pointer = pointer.next;
              }
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

  /**
   * Expand term with all possible combinations.
   */
  expandTerm(term: string): string[] {
    return this._index.expandTerm(term);
  }

  /**
   * Convert query to an array of terms.
   */
  queryToTerms(query: string): string[] {
    let result = [] as string[];
    const tokens = this._tokenizer(query);
    for (let i = 0; i < tokens.length; i++) {
      const term = this._filter(tokens[i]);
      if (term !== "") {
        result = result.concat(this._index.expandTerm(term));
      }
    }

    return result;
  }

  /**
   * Remove outdated/removed documents from the index.
   */
  vacuum(): void {
    this._index.vacuum();
  }
}
