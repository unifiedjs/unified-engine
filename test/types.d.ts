// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface SomeCustomResultExample {
  kind: 'some-virtual-dom'
}

// We put some state in `globalThis` to track tests work.
declare global {
  // eslint-disable-next-line no-var -- has to be `var` for `globalThis`.
  var unifiedEngineTestCalls: number | undefined
  // eslint-disable-next-line no-var -- has to be `var` for `globalThis`.
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
