// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface SomeCustomResultExample {
  kind: 'some-virtual-dom'
}

// We put some state in `globalThis` to track tests work.
declare global {
  var unifiedEngineTestCalls: number | undefined
  var unifiedEngineTestValues: unknown | undefined
}

// Some arbitrary values used in the tests.
declare module 'unified' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface CompileResultMap {
    SomeCustomResultExample: SomeCustomResultExample
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Settings {
    alpha?: boolean | undefined
    bravo?: string | undefined
  }
}
