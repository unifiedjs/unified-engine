export default function plugin(options) {
  this.t.deepEqual(
    options,
    {one: true, two: true},
    'should pass the correct options to the deep plugin'
  )
}
