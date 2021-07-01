export default function mergeObject(options) {
  this.t.deepEqual(
    options,
    {one: true, two: false, three: true},
    'merge-object: should pass the merged object'
  )
}
