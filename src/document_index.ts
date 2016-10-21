import { InvertedIndex } from "./inverted_index";
import { whitespaceTokenizer } from "./tokenizer";
import { lowerCaseFilter, trimNonWordCharactersFilter } from "./filters";

export interface SearchResult<I> {
  documentId: I;
  score: number;
}

interface FieldDetails<I, D> {
  name: string;
  accessor: ((document: D) => string) | string;
  invertedIndex: InvertedIndex<I>;
}

export interface FieldOptions<D> {
  accessor: (document: D) => string;
}

export function DEFAULT_FILTER(term: string): string {
  return trimNonWordCharactersFilter(lowerCaseFilter(term));
}

export class DocumentIndex<I, D> {
  private _fieldsByName: Map<string, number>;
  private _fields: FieldDetails<I, D>[];
  private _termCount: Map<I, number[]>;
  private _tokenizer: (text: string) => string[];
  private _filter: (term: string) => string;

  constructor() {
    this._fieldsByName = new Map();
    this._fields = [];
    this._termCount = new Map();
    this._tokenizer = whitespaceTokenizer;
    this._filter = DEFAULT_FILTER;
  }

  /**
   * Returns number of indexed document.
   */
  get size(): number {
    return this._termCount.size;
  }

  /**
   * Create Field Index.
   */
  createFieldIndex(fieldName: string, options?: FieldOptions<D>): void {
    let accessor: ((document: D) => string) | string;
    if (options === undefined) {
      accessor = fieldName;
    } else {
      accessor = options.accessor || fieldName;
    }

    const details = {
      name: fieldName,
      accessor: accessor,
      invertedIndex: new InvertedIndex<I>(),
    };

    let idx = this._fieldsByName.get(fieldName);
    if (idx === undefined) {
      idx = this._fields.push(details) - 1;
      this._fieldsByName.set(fieldName, idx);
    } else {
      this._fields[idx] = details;
    }
  }

  /**
   * Set Text Tokenizer.
   *
   * Term tokenizer is a simple function that accepts string values and returns array of string.
   */
  setTokenizer(tokenizer: (text: string) => string[]): void {
    this._tokenizer = tokenizer;
  }

  /**
   * Set Term Filter.
   *
   * Term filter will be applied to all terms returned by tokenizer.
   */
  setFilter(filter: (term: string) => string): void {
    this._filter = filter;
  }

  /**
   * Add document to the index.
   */
  add(documentId: I, document: D): void {
    const documentTermCounts = new Array(this._fields.length);

    for (let i = 0; i < this._fields.length; i++) {
      const fieldDetails = this._fields[i];
      const fieldAccessor = fieldDetails.accessor;
      const fieldValue = typeof fieldAccessor === "string" ?
        (document as any as { [key: string]: string })[fieldAccessor] :
        fieldAccessor(document);

      if (fieldValue === undefined) {
        documentTermCounts[i] = 0;
      } else {
        // tokenize text
        const terms = this._tokenizer(fieldValue);

        // filter and count terms, ignore empty strings
        const filteredTerms = new Map<string, number>();
        for (let j = 0; j < terms.length; j++) {
          const term = this._filter(terms[j]);
          if (term !== "") {
            const n = filteredTerms.get(term);
            filteredTerms.set(term, n === undefined ? 1 : n + 1);
          }
        }

        // add to inverted index
        filteredTerms.forEach(function (termCount, term) {
          fieldDetails.invertedIndex.add(term, Math.sqrt(termCount), documentId);
        });

        documentTermCounts[i] = filteredTerms.size;
      }
    }

    this._termCount.set(documentId, documentTermCounts);
  }

  /**
   * Remove document from the index.
   */
  remove(documentId: I, document: D): void {
    if (this._termCount.delete(documentId)) {
      for (let i = 0; i < this._fields.length; i++) {
        const fieldDetails = this._fields[i];
        const fieldAccessor = fieldDetails.accessor;
        const fieldValue = typeof fieldAccessor === "string" ?
          (document as any as { [key: string]: string })[fieldAccessor] :
          fieldAccessor(document);

        if (fieldValue !== undefined) {
          // tokenize text
          const terms = this._tokenizer(fieldValue);
          // filter terms, ignore empty strings and remove from inverted index
          for (let j = 0; j < terms.length; j++) {
            const term = this._filter(terms[j]);
            if (term !== "") {
              fieldDetails.invertedIndex.remove(term, documentId);
            }
          }
        }
      }
    }
  }

  search(query: string): SearchResult<I>[] {
    const queryTerms = this._tokenizer(query);
    const filteredQueryTerms = [] as string[];
    for (let i = 0; i < queryTerms.length; i++) {
      const term = this._filter(queryTerms[i]);
      if (term !== "") {
        filteredQueryTerms.push(term);
      }
    }

    let resultScores: Map<I, number> | undefined;
    for (let i = 0; i < this._fields.length; i++) {
      const scores = this._searchByField(i, filteredQueryTerms);
      if (resultScores === undefined) {
        resultScores = scores;
      } else {
        scores.forEach(function (score, documentId) {
          const prevScore = resultScores!.get(documentId);
          resultScores!.set(documentId, (score === undefined) ? score : prevScore + score);

        });
      }
    }

    if (resultScores === undefined) {
      return [];
    }

    const result = [] as SearchResult<I>[];
    resultScores.forEach(function (score, documentId) {
      result.push({
        documentId: documentId,
        score: score,
      });
    });

    return result;
  }

  private _searchByField(fieldIdx: number, terms: string[]): Map<I, number> {
    const scores: Map<I, number> = new Map<I, number>();
    const fieldDetails = this._fields[fieldIdx];
    const invertedIndex = fieldDetails.invertedIndex;

    for (let i = 0; i < terms.length; i++) {
      const term = terms[i];
      const termNode = invertedIndex.get(term);

      let documents: Map<I, number> | null = null;
      if (termNode !== null) {
        documents = termNode.documents;
      }

      if (documents !== null) {
        const documentFrequency = documents.size;
        const inverseDocumentFrequency = Math.log(this.size / (documentFrequency + 1)) + 1;

        if (scores.size !== 0) {
          const filteredDocuments = new Map<I, number>();
          scores.forEach((score, documentId) => {
            const termFrequency = documents!.get(documentId);
            if (termFrequency !== undefined) {
              filteredDocuments.set(documentId, termFrequency);
            }
          });
          documents = filteredDocuments;
        }

        documents.forEach((termFrequency, documentId) => {
          const fieldTermCount = getTermCount(this._termCount, documentId, fieldIdx);
          const fieldTermNorm = fieldTermCount === 0 ? 1 : 1 / Math.sqrt(fieldTermCount);
          const score = termFrequency * inverseDocumentFrequency * fieldTermNorm;
          const prevScore = scores.get(documentId);
          scores.set(documentId, (prevScore === undefined) ? score : prevScore + score);
        });
      }
    }

    return scores;
  }
}

function getTermCount<I>(counters: Map<I, number[]>, documentId: I, fieldIdx: number): number {
  const fields = counters.get(documentId);

  if (fields === undefined) {
    return 0;
  }

  return fields[fieldIdx];
}
