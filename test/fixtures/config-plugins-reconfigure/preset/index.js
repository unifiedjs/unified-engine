const config = {
  plugins: [
    ['./merge-object', {one: true, two: true}],
    ['./string-to-object', 'alpha'],
    ['./array-to-object', ['charlie']],
    ['./string-to-array', 'echo'],
    ['./object-to-array', {golf: 'hotel'}]
  ]
}

export default config
