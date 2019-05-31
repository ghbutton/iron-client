let utility = (function() {
  return {
    sleep: async function(milliseconds) {
      return new Promise(resolve => setTimeout(resolve, milliseconds))
    },
    nullOrUndefined: async function(value) {
      return value === undefined || value === null;
    },
    randomInteger: async function(){
      return Math.floor(Math.random() * 1000000);
    },
    addressString: async function (deviceId) {
      return `${deviceId}`
    },
    idsEqual: async function(id1, id2) {
      return `${id1}` === `${id2}`
    }
  }
})()

export default utility;
