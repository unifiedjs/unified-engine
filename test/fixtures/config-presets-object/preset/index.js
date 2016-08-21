module.exports = function (current, options) {
  return {
    plugins: {
      './plugin': options
    }
  };
};
