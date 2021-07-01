export default function plugin(options) {
  this.t.deepEqual(
    options,
    {three: true, two: false},
    'should pass the correct options to the local plugin'
  )
}
