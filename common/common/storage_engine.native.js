import config from "./config.js";
const RNFS = require("react-native-fs");

const UTF8 = "utf8";
const privateDataPath = config.privateDataPath();

export default (function() {
  async function createDirectory(currentPath) {
    if (!fs.existsSync(currentPath)) {
      fs.mkdirSync(currentPath);
    }
  }

  return {
    setItem: async function(key, value) {
      RNFS.writeFile(`${privateDataPath}/${key}`, value, UTF8);
    },
    deleteItem: async function(key) {
      // TODO
    },
    clearAllData: async function() {
      const files = await RNFS.readDir(privateDataPath);
      for (const file of files) {
        await RNFS.unlink(`${privateDataPath}/${file.name}`);
      }
    },
    init: async function() {
      await RNFS.mkdir(`${privateDataPath}`);
    },
    getItem: async function(key) {
      try {
        return await RNFS.readFile(`${privateDataPath}/${key}`, UTF8);
      } catch (err) {
        if (err.toString().startsWith("Error: ENOENT: no such file or directory, open")) {
          return null;
        } else {
          throw (err);
        }
      }
    },
  };
})();
