const RNFS = require("react-native-fs");

const fileSystem = (function() {
  return {
    openItem(path) {
    },
    openExternal(webpage) {
    },
    readBase64: async function(path) {
      const file = await RNFS.readFile(path, "base64");
      return file;
    },
    writeBase64: async function(path, bytes) {
    },
    basename: async function(uri) {
      let filename = uri.substring(uri.lastIndexOf('/') + 1, uri.length)
      return filename;
    },
    extname: async function(path) {
    },
    selectDirectory: async function() {
      // N/A, can't select a directory in RN
      return null;
    },
    selectFile: async function() {
    },
    multiSelectFiles: async function() {
    },
    showSaveDialog: async function(filename) {
    },
    defaultDownloadDirectory: async function() {
    },
    fileDownloadPath: async function(directory, basename) {
    },
    downloadFinished: async function(path) {
    },
  };
})();

export default fileSystem;
