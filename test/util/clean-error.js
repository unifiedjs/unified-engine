/**
 * Clean an error so that it’s easier to test.
 *
 * This removes error cause messages, which change across Node versions.
 * It also drops file paths, which differ across platforms,
 * and stack frames, which differ across Node versions.
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
      // Clean syscall errors.
      .replace(/( *Error: [A-Z]+:)[^\n]*/g, '$1…')

      .replace(/\(.+[/\\]/g, '(')
      .replace(/file:.+\//g, '')
      .replace(/\d+:\d+/g, '1:1')
      .split('\n')
      .filter(function (line) {
        return !/^ +at /.test(line)
      })
      .slice(0, max || Infinity)
      .join('\n')
  )
}
