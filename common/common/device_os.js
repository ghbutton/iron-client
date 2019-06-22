const os = window.os;

let deviceOS = (function() {
  return {
    deviceName: async function() {
      const hostname = os.hostname();
      return hostname.split(".")[0];
    },
    osName: async function() {
      return os.type();
    }
  }
})()

export default deviceOS;
