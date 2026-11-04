// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    // on exige le module exact plutôt que la string
    presets: [require('babel-preset-expo')],
    plugins: [
      //require.resolve('nativewind/babel'),
      require.resolve('react-native-reanimated/plugin'), // toujours en dernier
    ],
  };
};
