const utility = (function() {
  return {
    sleep: async function(milliseconds) {
      return new Promise((resolve) => setTimeout(resolve, milliseconds));
    },
    pollForCondition: async function(condition, _timeout) {
      while (true) {
        // Condition needs to be a function since it needs to update the value every time it is
        // called to make sure it has the latest value
        if (condition()) {
          return true;
        } else {
          await utility.sleep(10);
        }
      }
    },
    nullOrUndefined: async function(value) {
      return value === undefined || value === null;
    },
    randomInteger: async function() {
      return Math.floor(Math.random() * 1000000);
    },
    addressString: async function(deviceId) {
      return `${deviceId}`;
    },
    idsEqual: async function(id1, id2) {
      return `${id1}` === `${id2}`;
    },
  };
})();

export default utility;
