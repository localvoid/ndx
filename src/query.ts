import type { DocumentIndex, InvertedIndexNode } from "./index.js";
import { findInvertedIndexNode } from "./index.js";

/**
 * Query Result.
 *
 * @typeparam T Document key.
 */
export interface QueryResult<I> {
  /** Document key. */
  readonly key: I;
  /** Result score. */
  readonly score: number;
}

const sortByScore = (
  a: QueryResult<any>,
  b: QueryResult<any>,
) => b.score - a.score;

const max = Math.max;
const log = Math.log;

/**
 * Performs a search with a simple free text query.
 *
 * All token separators work as a disjunction operator.
 *
 * @typeparam T Document key.
 * @param index {@link DocumentIndex}.
 * @param fieldBoost Field boost factors.
 * @param bm25k1 BM25 ranking function constant `k1`, controls non-linear term
 *  frequency normalization (saturation).
 * @param bm25b BM25 ranking function constant `b`, controls to what degree
 *  document length normalizes tf values.
 * @param s Query string.
 * @returns Array of {@link QueryResult} objects.
 */
export const indexQuery = <T>(
  index: DocumentIndex<T>,
  fieldBoost: number[],
  bm25k1: number,
  bm25b: number,
  s: string,
): QueryResult<T>[] => {
  const { docs, root, fAvg, tokenizer, filter } = index;
  const terms = tokenizer(s);
  const scores = new Map<T, number>();

  for (let i = 0; i < terms.length; i++) {
    const term = filter(terms[i]);
    if (term !== "") {
      const expandedTerms = expandTerm(index, term);
      const visitedDocuments = new Set<T>();
      for (let j = 0; j < expandedTerms.length; j++) {
        const eTerm = expandedTerms[j];
        const expansionBoost = eTerm === term
          ? 1
          : log(1 + (1 / (1 + eTerm.length - term.length)));
        const termNode = findInvertedIndexNode(root, eTerm);
        let d;

        if (termNode !== void 0 && (d = termNode.d) !== null) {
          let documentFrequency = 0;
          for (let k = 0; k < d.length; k++) {
            const pointer = d[k];
            if (pointer.details.removed === false) {
              documentFrequency++;
            }
          }
          if (documentFrequency > 0) {
            // calculating BM25 idf
            const idf = log(1 + (docs.size - documentFrequency + 0.5) / (documentFrequency + 0.5));

            for (let k = 0; k < d.length; k++) {
              const pointer = d[k];
              if (pointer.details.removed === false) {
                let score = 0;
                console.log(pointer.details.fCount);
                for (let x = 0; x < pointer.details.fCount.length; x++) {
                  let tf = pointer.tf[x];
                  if (tf > 0) {
                    // calculating BM25 tf
                    const fieldLength = pointer.details.fCount[x];
                    const avgFieldLength = fAvg[x];
                    tf = ((bm25k1 + 1) * tf) / (bm25k1 * ((1 - bm25b) + bm25b * (fieldLength / avgFieldLength)) + tf);
                    score += tf * idf * fieldBoost[x] * expansionBoost;
                  }
                }
                if (score > 0) {
                  const key = pointer.details.key;
                  const prevScore = scores.get(key);
                  scores.set(
                    key,
                    prevScore !== void 0 && visitedDocuments.has(key)
                      ? max(prevScore, score)
                      : prevScore === void 0
                        ? score
                        : prevScore + score
                  );
                  visitedDocuments.add(key);
                }
              }
            }
          }
        }
      }
    }
  }
  const result = [] as QueryResult<T>[];
  scores.forEach((score, key) => {
    result.push({ key, score });
  });
  result.sort(sortByScore);

  return result;
};


/**
 * Recursively goes through inverted index nodes and expands term with all possible combinations.
 *
 * @typeparam I Document ID type.
 * @param index {@link DocumentIndex}
 * @param results Results.
 * @param term Term.
 */
const _expandTerm = <I>(
  node: InvertedIndexNode<I>,
  results: string[],
  term: string,
): void => {
  if (node.d !== null) {
    results.push(term);
  }
  const children = node.c;
  if (children !== null) {
    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      _expandTerm(c, results, term + String.fromCharCode(c.k));
    }
  }
};

/**
 * Expands term with all possible combinations.
 *
 * @typeparam I Document ID type.
 * @param index {@link DocumentIndex}
 * @param term Term.
 * @returns All terms that starts with [term] string.
 */
export const expandTerm = <I>(
  index: DocumentIndex<I>,
  term: string,
): string[] => {
  const node = findInvertedIndexNode(index.root, term);
  const results = [] as string[];
  if (node !== void 0) {
    _expandTerm(node, results, term);
  }

  return results;
}

