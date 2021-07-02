const config = {
  plugins: [
    ['./merge-object.js', {one: true, two: true}],
    ['./string-to-object.js', 'alpha'],
    ['./array-to-object.js', ['charlie']],
    ['./string-to-array.js', 'echo'],
    ['./object-to-array.js', {golf: 'hotel'}]
  ]
}

export default config
