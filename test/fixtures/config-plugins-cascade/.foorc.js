module.exports = {
  missing: undefined,
  plugins: {
    test: {
      module: true,
      cascade: 1
    },
    test3: null,
    test4: {},

    // Set plug-ins to `false` to turn them off.
    test5: false
  }
}
