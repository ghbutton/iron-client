import utility from "./utility.js"
import config from "./config.js"
const RNFS = require('react-native-fs');

let basePath = config.basePath();
const UTF8 = "utf8";

export default (function() {
  async function createDirectory(currentPath) {
    if (!fs.existsSync(currentPath)) {
      fs.mkdirSync(currentPath);
    }
  }

  return {
    setItem: async function(key, value) {
      RNFS.writeFile(RNFS.DocumentDirectoryPath + `/${key}`, value, UTF8);
    },
    deleteItem: async function(key) {
      // TODO
    },
    clearAllData: async function() {
      const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
      for(let file of files) {
        await RNFS.unlink(RNFS.DocumentDirectoryPath + `/${file.name}`)
      }
    },
    init: async function() {
      // Do nothing
    },
    getItem: async function(key) {
      try {
        return await RNFS.readFile(RNFS.DocumentDirectoryPath + `/${key}`, UTF8);
      } catch (err) {
        if (err.toString().startsWith("Error: ENOENT: no such file or directory, open")) {
          return null
        } else {
          throw(err);
        }
      }
    },
  }
})()
