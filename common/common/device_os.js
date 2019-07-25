const os = window.os;
const exec = window.exec;

const DARWIN = "Darwin"

let deviceOS = (function() {
  function isOSX() {
    return os.type() === DARWIN
  }

  function execute(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.warn(error);
        }
      resolve(stdout? stdout : stderr);
      });
    });
  };

  return {
    deviceName: async function() {
      let hostname = "";
      if (isOSX()) {
        const name = await execute("scutil --get ComputerName", (output) => { });
        if (name !== "" && name !== null && name !== undefined) {
          hostname = name;
        }
      }
      if (hostname === "") {
        hostname = os.hostname();
        hostname = hostname.split(".")[0];
      }
      return hostname;
    },
    osName: async function() {
      return os.type();
    }
  }
})()

export default deviceOS;
