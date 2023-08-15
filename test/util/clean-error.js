/**
 * @param {string} value
 * @param {number | undefined} [max=Infinity]
 * @returns {string}
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
