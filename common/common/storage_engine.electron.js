import config from "./config.js";

const fs = window.fs;
const privateDataPath = config.privateDataPath();

export default (function() {
  async function createDirectory(currentPath) {
    if (!fs.existsSync(currentPath)) {
      fs.mkdirSync(currentPath);
    }
  }

  return {
    setItem: async function(key, value) {
      return fs.writeFileSync(`${privateDataPath}/${key}`, value);
    },
    deleteItem: async function(key) {
      const currentPath = `${privateDataPath}/${key}`;
      if (fs.existsSync(currentPath)) {
        return fs.unlinkSync(currentPath);
      } else {
        return null;
      }
    },
    clearAllData: async function() {
      const files = fs.readdirSync(privateDataPath);

      for (const file of files) {
        fs.unlinkSync(`${privateDataPath}/${file}`);
      }
    },
    init: async function() {
      const folders = privateDataPath.split("/");
      let currentPath = "";
      if (folders[0] === "") {
        // Remove the leading slash
        folders.shift();

        const first = folders.shift();
        currentPath = `/${first}`;
      } else {
        currentPath = `${folders.shift()}`;
      }

      while (folders.length > 0) {
        const current = folders.shift();
        currentPath = `${currentPath}/${current}`;
        createDirectory(currentPath);
      }
    },
    getItem: async function(key) {
      return new Promise(function(resolve, reject) {
        fs.readFile(`${privateDataPath}/${key}`, (err, data) => {
          if (err) {
            if (err.toString().startsWith("Error: ENOENT: no such file or directory, open")) {
              resolve(null);
            } else {
              throw (err);
            }
          } else {
            resolve(data);
          }
        });
      });
    },
  };
})();
