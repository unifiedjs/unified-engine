/** @type {import('../../../../index.js').Preset} */
const config = {
  plugins: [
    ['./array-to-object.js', ['charlie']],
    ['./merge-object.js', {one: true, two: true}],
    ['./object-to-array.js', {golf: 'hotel'}],
    ['./string-to-array.js', 'echo'],
    ['./string-to-object.js', 'alpha']
  ]
}

export default config
