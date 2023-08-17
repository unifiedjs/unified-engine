/**
 * Clean an error so that it’s easier to test.
 *
 * This particularly removed error cause messages, which change across Node
 * versions.
 * It also drops file paths, which differ across platforms.
 *
 * @param {string} value
 *   Error, report, or stack.
 * @param {number | undefined} [max=Infinity]
 *   Lines to include.
 * @returns {string}
 *   Clean error.
 */
export function cleanError(value, max) {
  return (
    value
      // Clean syscal errors
      .replace(/( *Error: [A-Z]+:)[^\n]*/g, '$1…')

      .replace(/\(.+[/\\]/g, '(')
      .replace(/file:.+\//g, '')
      .replace(/\d+:\d+/g, '1:1')
      .split('\n')
      .slice(0, max || Number.POSITIVE_INFINITY)
      .join('\n')
  )
}
