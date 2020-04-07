// Responsible for using electron-osx-sign package to sign the app
require('dotenv').config();
const sign = require('electron-osx-sign');

exports.default = function (context) {
  return new Promise((resolve) => {
    sign(
      {
        app: context.appOutDir + '/banjo.app',
      },
      (err) => {
        resolve();
      }
    );
  });
};
