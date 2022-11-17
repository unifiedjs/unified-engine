export default function test() {
  // @ts-expect-error: set by tests.
  globalThis.unifiedEngineTestCalls++
}
