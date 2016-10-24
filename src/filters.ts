
/**
 * Converts term to lower case.
 */
export function lowerCaseFilter(term: string): string {
  return term.toLowerCase();
}

const NWSTART_RE = /^\W+/;
const NWEND_RE = /\W+$/;

/**
 * Removes all non-word characters at the start and at the end of the term.
 */
export function trimNonWordCharactersFilter(term: string): string {
  return term.replace(NWSTART_RE, "").replace(NWEND_RE, "");
}
