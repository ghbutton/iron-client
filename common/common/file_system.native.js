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
    writeBase64: async function(path, base64) {
      const file = await RNFS.writeFile(path, base64, "base64");
      return file;
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
      // TODO dedup filesnames, make sure we aren't overwriting a file
      //      const fullPath = `${directory}/${basename}`;
      return {type: "ok", path: `${directory}/${basename}`, basename: basename};
    },
    downloadFinished: async function(path) {
    },
  };
})();

export default fileSystem;
