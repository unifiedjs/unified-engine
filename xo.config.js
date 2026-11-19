/**
 * @import {FlatXoConfig} from 'xo'
 */

/** @type {FlatXoConfig} */
const xoConfig = [
  {
    name: 'default',
    prettier: 'compat',
    rules: {
      complexity: 'off',
      'import-x/order': 'off',
      'jsdoc/check-indentation': 'off',
      'jsdoc/check-line-alignment': 'off',
      // Wrong for overloads.
      'jsdoc/check-param-names': 'off',
      'jsdoc/informative-docs': 'off',
      'jsdoc/reject-any-type': 'off',
      // Functions typed with `@type` are described by that type.
      'jsdoc/require-description': [
        'error',
        {exemptedBy: ['inheritdoc', 'type']}
      ],
      'jsdoc/require-asterisk-prefix': 'off',
      // Wrong for contextually typed callbacks.
      'jsdoc/require-param-type': 'off',
      // Wrong for inferred return types.
      'jsdoc/require-returns-type': 'off',
      // Wrong for overloads.
      'jsdoc/require-returns-check': 'off',
      // Wrong for TypeScript types.
      'jsdoc/valid-types': 'off',
      // The API is callback based.
      'n/prefer-promises/fs': 'off',
      'no-await-in-loop': 'off',
      'no-shadow': 'off',
      // Asserts are used to narrow types.
      'node-test/prefer-equality-assertion': 'off',
      'prefer-arrow-callback': 'off',
      'regexp/no-super-linear-move': 'off',
      'regexp/prefer-named-capture-group': 'off',
      'require-unicode-regexp': 'off',
      'unicorn/consistent-boolean-name': 'off',
      'unicorn/logical-assignment-operators': 'off',
      'unicorn/no-array-sort': 'off',
      'unicorn/no-computed-property-existence-check': 'off',
      'unicorn/no-this-assignment': 'off',
      'unicorn/prefer-at': 'off',
      'unicorn/prefer-early-return': 'off',
      'unicorn/prefer-event-target': 'off',
      'unicorn/prefer-logical-operator-over-ternary': 'off',
      'unicorn/prefer-simple-condition-first': 'off',
      'unicorn/prefer-string-raw': 'off',
      'unicorn/prefer-string-replace-all': 'off',
      // Wrong: `.catch` would also catch errors thrown in the fulfilled handler.
      'unicorn/prefer-then-catch': 'off',
      'unicorn/prefer-unicode-code-point-escapes': 'off',
      'unicorn/require-array-sort-compare': 'off',
      'unicorn/single-line-block-comment-style': 'off'
    },
    space: true
  },
  // Wrong.
  {ignores: ['**/*.md']},
  // Malformed on purpose.
  {
    ignores: [
      'test/fixtures/malformed-package-file/package.json',
      'test/fixtures/malformed-tree/doc.json'
    ]
  },
  {
    files: ['test/**/*.{js,mjs}'],
    rules: {
      // Wrong for helpers in `test/util/`.
      'node-test/no-import-test-files': 'off',
      // Fixtures report back to tests through globals.
      'unicorn/no-global-object-property-assignment': 'off'
    }
  },
  {
    files: ['test/fixtures/**/*.{js,mjs}'],
    rules: {
      'jsdoc/require-description': 'off',
      'unicorn/no-empty-file': 'off',
      'unicorn/prefer-module': 'off'
    }
  },
  {
    files: ['package.json'],
    rules: {
      'package-json/no-orphan-types': 'off',
      // `@types/node` is `*` on purpose: see GH-87.
      'package-json/no-wildcard-dependencies': 'off',
      'package-json/require-engines': 'off',
      'package-json/sort-files': 'off',
      'package-json/sort-properties': 'off'
    }
  },
  {
    files: ['test/fixtures/**/package.json'],
    rules: {
      'package-json/prefer-files-field': 'off',
      'package-json/prefer-type-module': 'off',
      'package-json/require-engines': 'off',
      'package-json/require-entry-point': 'off',
      'package-json/require-fields': 'off'
    }
  }
]

export default xoConfig
