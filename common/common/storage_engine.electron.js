import config from "./config.js";

const fs = window.fs;
const basePath = config.basePath();

export default (function() {
  async function createDirectory(currentPath) {
    if (!fs.existsSync(currentPath)) {
      fs.mkdirSync(currentPath);
    }
  }

  return {
    setItem: async function(key, value) {
      return fs.writeFileSync(`${basePath}/${key}`, value);
    },
    deleteItem: async function(key) {
      const currentPath = `${basePath}/${key}`;
      if (fs.existsSync(currentPath)) {
        return fs.unlinkSync(currentPath);
      } else {
        return null;
      }
    },
    clearAllData: async function() {
      const files = fs.readdirSync(basePath);

      for (const file of files) {
        fs.unlinkSync(`${basePath}/${file}`);
      }
    },
    init: async function() {
      const folders = basePath.split("/");
      let currentPath = "";
      if (folders[0] === "") {
        // Remove the leading slash
        folders.shift();

        const first = folders.shift();
        currentPath= `/${first}`;
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
        fs.readFile(`${basePath}/${key}`, (err, data) => {
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
